import { useEffect, useRef, useState, useCallback } from 'react';

import { regionApi } from '@/domain/article/map/services/regionApi';
import type { Region } from '@/domain/article/map/utils/regionUtils';

interface UseRegionsProps {
  mapInstance: React.MutableRefObject<any>;
  isMapLoaded: boolean;
  selectedRegions?: {
    city: string;
    district: string;
    neighborhoods: string[];
  };
  allRegions?: Region[];
}

export const useRegions = ({
  mapInstance,
  isMapLoaded,
  selectedRegions,
  allRegions
}: UseRegionsProps) => {
  const [dongBoundaries, setDongBoundaries] = useState<any>(null);
  const [guBoundaries, setGuBoundaries] = useState<any>(null);
  const polygonsRef = useRef<any[]>([]);
  const labelsRef = useRef<any[]>([]);
  const colorMapRef = useRef<Map<string, string>>(new Map());
  const drawTimeoutRef = useRef<number | null>(null);
  const currentZoomRef = useRef<number | null>(null);

  // 행정구역 경계 데이터 로드
  useEffect(() => {
    const loadBoundaries = async () => {
      try {
        // 동 경계 로드
        const dongData = await regionApi.getRegionBoundaries('dong');
        setDongBoundaries(dongData);

        // 구 경계 로드
        const guData = await regionApi.getRegionBoundaries('gu');
        setGuBoundaries(guData);
      } catch (error) {
        console.error('행정구역 경계 데이터 로드 실패:', error);
      }
    };

    loadBoundaries();
  }, []);

  // 랜덤 색상 생성 함수 (밝은 색상)
  const getRandomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsla(${hue}, 70%, 70%, 0.5)`;
  };

  // 행정구역 ID로부터 일관된 색상 얻기
  const getColorForRegion = useCallback((regionId: string) => {
    if (!colorMapRef.current.has(regionId)) {
      colorMapRef.current.set(regionId, getRandomColor());
    }
    return colorMapRef.current.get(regionId);
  }, []);

  // 행정구역 경계 그리기 - 폴리곤과 라벨 생성
  useEffect(() => {
    try {
      if (!isMapLoaded || !mapInstance.current) return;
      if (!dongBoundaries && !guBoundaries) return;

      // 이전 폴리곤과 라벨 제거
      polygonsRef.current.forEach(polygon => {
        try {
          if (polygon && polygon.setMap) {
            polygon.setMap(null);
          }
        } catch (e) {
          console.error('폴리곤 제거 중 오류:', e);
        }
      });
      polygonsRef.current = [];

      labelsRef.current.forEach(label => {
        try {
          if (label && label.setMap) {
            label.setMap(null);
          }
        } catch (e) {
          console.error('라벨 제거 중 오류:', e);
        }
      });
      labelsRef.current = [];

      const kakao = (window as any).kakao;
      if (!kakao || !kakao.maps) {
        console.warn('카카오맵 API가 로드되지 않았습니다.');
        return;
      }

      // drawBoundaries 함수를 mapInstance에 직접 연결하여 참조 보존
      mapInstance.current._drawBoundaries = function () {
        try {
          if (!mapInstance.current || !kakao || !kakao.maps) {
            console.warn('지도 인스턴스나 카카오맵 API가 없어 행정구역을 그릴 수 없습니다.');
            return;
          }

          // 이전에 예약된 타이머가 있으면 취소
          if (drawTimeoutRef.current !== null) {
            window.clearTimeout(drawTimeoutRef.current);
            drawTimeoutRef.current = null;
          }

          // 300ms 디바운싱으로 경계 그리기 실행
          drawTimeoutRef.current = window.setTimeout(() => {
            const zoomLevel = mapInstance.current.getLevel();
            
            // 동일한 줌 레벨에서 중복 실행 방지
            if (currentZoomRef.current === zoomLevel) {
              return;
            }
            currentZoomRef.current = zoomLevel;

            // 줌 레벨 6에서는 동 경계, 7 이상에서는 구 경계 표시
            const boundaries = zoomLevel <= 6 ? dongBoundaries : guBoundaries;
            
            if (!boundaries) {
              console.warn('행정구역 데이터가 없습니다.');
              return;
            }

            // 이전 폴리곤과 라벨 제거
            polygonsRef.current.forEach(polygon => {
              try {
                if (polygon && polygon.setMap) {
                  polygon.setMap(null);
                }
              } catch (e) {
                console.error('폴리곤 제거 중 오류:', e);
              }
            });
            polygonsRef.current = [];

            labelsRef.current.forEach(label => {
              try {
                if (label && label.setMap) {
                  label.setMap(null);
                }
              } catch (e) {
                console.error('라벨 제거 중 오류:', e);
              }
            });
            labelsRef.current = [];

            const features = boundaries.features || [];

            features.forEach((feature: any) => {
              try {
                // 행정구역 속성 정보
                const properties = feature.properties || {};
                const regionId = properties.id || properties.SIG_CD || properties.EMD_CD ||
                  properties.adm_cd || properties.code || Math.random().toString(36);
                const regionName = properties.name || properties.SIG_KOR_NM || properties.EMD_KOR_NM ||
                  properties.adm_nm || properties.org || "unnamed";

                // 행정구역 색상 - 고유 ID 기반으로 일관된 색상 적용
                const fillColor = getColorForRegion(regionId);

                // 중심 좌표 계산을 위한 변수
                let centerLat = 0;
                let centerLng = 0;
                let pointCount = 0;

                // 폴리곤 경로
                const paths: any[] = [];

                if (feature.geometry.type === 'MultiPolygon') {
                  feature.geometry.coordinates.forEach((coordsArray: any) => {
                    coordsArray.forEach((coords: any) => {
                      const path = coords.map((coord: [number, number]) => {
                        // 중심 좌표 계산을 위해 모든 좌표 합산
                        centerLng += coord[0];
                        centerLat += coord[1];
                        pointCount++;

                        return new kakao.maps.LatLng(coord[1], coord[0]);
                      });

                      paths.push(path);
                    });
                  });
                } else if (feature.geometry.type === 'Polygon') {
                  feature.geometry.coordinates.forEach((coords: any) => {
                    const path = coords.map((coord: [number, number]) => {
                      // 중심 좌표 계산을 위해 모든 좌표 합산
                      centerLng += coord[0];
                      centerLat += coord[1];
                      pointCount++;

                      return new kakao.maps.LatLng(coord[1], coord[0]);
                    });

                    paths.push(path);
                  });
                }

                // 폴리곤이 존재할 때만 처리
                if (paths.length > 0) {
                  // 다중 폴리곤 처리
                  paths.forEach(path => {
                    const polygon = new kakao.maps.Polygon({
                      path: path,
                      strokeWeight: 1,
                      strokeColor: '#FFFFFF',
                      strokeOpacity: 0.7,
                      strokeStyle: 'solid',
                      fillColor: fillColor,
                      fillOpacity: 0.6
                    });

                    polygon.setMap(mapInstance.current);
                    polygonsRef.current.push(polygon);
                  });

                  // 중심 좌표 계산
                  if (pointCount > 0) {
                    centerLat = centerLat / pointCount;
                    centerLng = centerLng / pointCount;

                    // 라벨 생성
                    const labelContent = document.createElement('div');
                    labelContent.style.padding = '2px 6px';
                    labelContent.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                    labelContent.style.borderRadius = '3px';
                    labelContent.style.fontSize = zoomLevel <= 6 ? '10px' : '12px';
                    labelContent.style.fontWeight = 'bold';
                    labelContent.style.border = '1px solid #ccc';
                    labelContent.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)';
                    labelContent.style.whiteSpace = 'nowrap';
                    labelContent.style.pointerEvents = 'none';
                    labelContent.innerText = regionName;

                    const label = new kakao.maps.CustomOverlay({
                      position: new kakao.maps.LatLng(centerLat, centerLng),
                      content: labelContent,
                      xAnchor: 0.5,
                      yAnchor: 0.5,
                      zIndex: 3
                    });

                    label.setMap(mapInstance.current);
                    labelsRef.current.push(label);
                  }
                }
              } catch (error) {
                console.error('행정구역 폴리곤 생성 중 오류:', error);
              }
            });
          }, 300);
        } catch (error) {
          console.error('행정구역 폴리곤 그리기 중 오류:', error);
        }
      };

      // 처음 경계 그리기
      mapInstance.current._drawBoundaries();

    } catch (error) {
      console.error('행정구역 경계 그리기 초기화 중 오류:', error);
    }
  }, [isMapLoaded, dongBoundaries, guBoundaries, mapInstance, getColorForRegion]);

  // 줌 레벨 변경 이벤트 리스너 등록 - 별도의 useEffect로 분리
  useEffect(() => {
    if (!isMapLoaded || !mapInstance.current || !mapInstance.current._drawBoundaries) return;

    try {
      const kakao = (window as any).kakao;
      if (!kakao || !kakao.maps || !kakao.maps.event) {
        console.warn('카카오맵 이벤트 API가 로드되지 않았습니다.');
        return;
      }

      // 줌 변경 이벤트에 경계 다시 그리기 추가
      const zoomChangeListener = kakao.maps.event.addListener(
        mapInstance.current,
        'zoom_changed',
        mapInstance.current._drawBoundaries
      );

      // 리스너 참조를 맵 인스턴스에 저장
      mapInstance.current._zoomChangeListener = zoomChangeListener;

      return () => {
        try {
          if (kakao && kakao.maps && kakao.maps.event && zoomChangeListener) {
            kakao.maps.event.removeListener(zoomChangeListener);
          }
          
          // 디바운싱 타이머 정리
          if (drawTimeoutRef.current !== null) {
            window.clearTimeout(drawTimeoutRef.current);
            drawTimeoutRef.current = null;
          }
        } catch (error) {
          console.error('이벤트 리스너 제거 중 오류:', error);
        }
      };
    } catch (error) {
      console.error('줌 레벨 변경 이벤트 리스너 등록 중 오류:', error);
    }
  }, [isMapLoaded, dongBoundaries, guBoundaries, mapInstance]);

  // 선택된 지역으로 이동
  useEffect(() => {
    if (!isMapLoaded || !mapInstance.current || !selectedRegions || !allRegions) return;

    try {
      const map = mapInstance.current;
      const targetRegion = allRegions.find(region => {
        if (selectedRegions.neighborhoods.length > 0) {
          return region.cortarName === selectedRegions.neighborhoods[0];
        }
        if (selectedRegions.district) {
          return region.cortarName === selectedRegions.district;
        }
        return region.cortarName === selectedRegions.city;
      });

      if (targetRegion) {
        const position = new (window as any).kakao.maps.LatLng(
          targetRegion.centerLat,
          targetRegion.centerLon
        );

        // 중심점 이동
        map.setCenter(position);

        // 지역에 따른 적절한 줌 레벨 설정
        const zoomLevel = selectedRegions.neighborhoods.length > 0 ? 3
          : selectedRegions.district ? 5
            : 8;

        // 현재 줌 레벨과 목표 줌 레벨이 다른 경우에만 변경
        const currentLevel = map.getLevel();
        if (currentLevel !== zoomLevel) {
          map.setLevel(zoomLevel);
        }
      }
    } catch (error) {
      console.error("Failed to move to selected region:", error);
    }
  }, [isMapLoaded, selectedRegions, allRegions, mapInstance]);

  return {
    dongBoundaries,
    guBoundaries
  };
}; 