import { useEffect, useState } from 'react';
import { validateCoordinates } from '@/domain/article/utils/articleFormat';
import { createArticleMarkerSvg } from '@/domain/article/utils/articleDisplay';
import type { ArticleResponse, ClusterInfo } from '@/domain/article/types/article';

// window 전역 객체에 마커 배열이 없으면 초기화
if (typeof window !== 'undefined' && !window._customMarkers) {
  window._customMarkers = [];
}

interface UseMarkersProps {
  mapInstance: React.MutableRefObject<any>;
  isMapLoaded: boolean;
  articles: ArticleResponse[];
  selectedArticle: ArticleResponse | null;
  onArticleClick: (article: ArticleResponse) => void;
  clusterMode: boolean;
  clusters?: (ClusterInfo & {
    weight?: number;
    radius?: number;
    color?: string;
  })[];
  onClusterClick?: (cluster: ClusterInfo) => void;
}

export const useMarkers = ({
  mapInstance,
  isMapLoaded,
  articles,
  selectedArticle,
  onArticleClick,
  clusterMode,
  clusters,
  onClusterClick,
}: UseMarkersProps) => {
  const [sameLocationArticles, setSameLocationArticles] = useState<ArticleResponse[]>([]);
  const [sameLocationPopupOpen, setSameLocationPopupOpen] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);

  // 마커 표시
  useEffect(() => {
    if (!isMapLoaded || !mapInstance.current) {
      return;
    }

    const map = mapInstance.current;

    // 전역 매커 배열 초기화 (없는 경우)
    if (!window._customMarkers) {
      window._customMarkers = [];
    }

    // 기존 마커 제거 함수
    const clearMarkers = () => {
      if (window._customMarkers) {
        window._customMarkers.forEach(marker => {
          if (marker && marker.setMap) {
            marker.setMap(null);
          }
        });
        window._customMarkers = [];
      }
    };

    // 기존 마커 제거
    clearMarkers();

    // 클러스터 마커 클릭 이벤트 처리 함수
    const handleClusterClick = (cluster: ClusterInfo) => {
      if (onClusterClick) {
        onClusterClick(cluster);
      }
      if (mapInstance.current) {
        const kakao = (window as any).kakao;
        if (kakao && kakao.maps) {
          const position = new kakao.maps.LatLng(cluster.lat, cluster.lng);
          mapInstance.current.setCenter(position);
          mapInstance.current.setLevel(3); // Or an appropriate zoom level
        }
      }
    };

    // 매물 수에 따른 히트맵 색상 가져오기
    const getHeatmapColorByCount = (count: number): string => {
      if (count <= 10) return '#00FF00';
      else if (count <= 20) return '#ADFF2F';
      else if (count <= 30) return '#FFFF00';
      else if (count <= 40) return '#FFA500';
      else if (count <= 50) return '#FF4500';
      else if (count <= 60) return '#FF0000';
      else if (count <= 70) return '#DC143C';
      else if (count <= 80) return '#8B0000';
      else if (count <= 90) return '#800080';
      else return '#4B0082'; // 90개 초과
    };

    // 매물 수에 따른 채도(opacity) 가져오기
    const getOpacityByCount = (count: number): number => {
      if (count <= 10) return 0.4;
      else if (count <= 20) return 0.45;
      else if (count <= 30) return 0.5;
      else if (count <= 40) return 0.55;
      else if (count <= 50) return 0.6;
      else if (count <= 60) return 0.65;
      else if (count <= 70) return 0.7;
      else if (count <= 80) return 0.75;
      else if (count <= 90) return 0.8;
      else return 0.85; // 90개 초과
    };

    // 매물 수에 따른 반경 계산 함수
    const calculateRadiusByCount = (count: number): number => {
      // 10단위로 크기 증가
      if (count <= 10) return 40;
      else if (count <= 20) return 45;
      else if (count <= 30) return 50;
      else if (count <= 40) return 55;
      else if (count <= 50) return 60;
      else if (count <= 60) return 65;
      else if (count <= 70) return 70;
      else if (count <= 80) return 75;
      else if (count <= 90) return 80;
      else if (count <= 100) return 85;
      else return 90; // 100개 초과
    };

    // 클러스터 모드가 활성화되고 클러스터 데이터가 있으면 클러스터 표시
    if (clusterMode && clusters && clusters.length > 0) {
      try {
        // 클러스터끼리의 거리 계산 함수
        const calculateDistance = (c1: ClusterInfo, c2: ClusterInfo) => {
          const R = 6371; // 지구 반경 (km)
          const dLat = (c2.lat - c1.lat) * Math.PI / 180;
          const dLon = (c2.lng - c1.lng) * Math.PI / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;
          return distance * 1000; // 미터 단위로 변환
        };

        // 클러스터 마커 생성 로직...
        clusters.forEach(cluster => {
          try {
            // HTML 요소로 클러스터 마커 생성
            const element = document.createElement('div');

            // 히트맵 색상 사용
            const color = getHeatmapColorByCount(cluster.count);

            // 클러스터 크기 결정 - 10단위로 크기 구분
            let radius: number;
            let opacity: number;

            if (cluster.radius) {
              // 이미 지정된 반경이 있으면 그대로 사용
              radius = cluster.radius;
              opacity = getOpacityByCount(cluster.count);
            } else {
              // 매물 수에 따라 반경 결정
              radius = calculateRadiusByCount(cluster.count);
              opacity = getOpacityByCount(cluster.count);
            }

            // 글자 크기 조정
            const fontSize = Math.max(radius * 0.35, 14); // 최소 글자 크기 보장

            // 클러스터 마커 스타일 (SVG)
            const markerHtml = `
              <div 
                style="
                  position: absolute;
                  cursor: pointer;
                  width: ${radius}px;
                  height: ${radius}px;
                  transform: translate(-50%, -50%);
                "
              >
                <svg width="${radius}" height="${radius}" viewBox="0 0 100 100">
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="${color}" 
                    opacity="${opacity}"
                    stroke="#ffffff"
                    stroke-width="4"
                  />
                  <text 
                    x="50" 
                    y="55" 
                    text-anchor="middle" 
                    font-size="${fontSize}px" 
                    font-weight="bold"
                    fill="white"
                  >${cluster.count}</text>
                </svg>
              </div>
            `;
            element.innerHTML = markerHtml;

            // 클릭 이벤트 추가
            element.firstElementChild?.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClusterClick(cluster);
            });

            // 클러스터 커스텀 마커 생성
            const marker = new (window as any).kakao.maps.CustomOverlay({
              position: new (window as any).kakao.maps.LatLng(cluster.lat, cluster.lng),
              content: element,
              zIndex: 2,
              map: map
            });

            window._customMarkers.push(marker);
          } catch (error) {
            console.error("Error creating cluster marker:", error);
          }
        });
      } catch (error) {
        console.error("Error processing clusters:", error);
      }
    }
    // 클러스터 모드가 비활성화되고 매물 데이터가 있으면 매물 핀 표시
    else if (articles?.length > 0) {
      // 유효한 좌표가 있는 매물만 필터링
      const validArticles = articles.filter(article => {
        const isValid = validateCoordinates(article.latitude, article.longitude);
        if (!isValid) {
          console.warn(`Invalid coordinates for article ${article.id}: lat=${article.latitude}, lng=${article.longitude}`);
        }
        return isValid;
      });

      if (validArticles.length === 0) {
        console.error("No valid articles to display on map!");
        return;
      }

      // 동일한 좌표에 있는 매물들을 그룹화
      const locationGroups: Record<string, ArticleResponse[]> = {};

      validArticles.forEach(article => {
        const locationKey = `${article.latitude},${article.longitude}`;
        if (!locationGroups[locationKey]) {
          locationGroups[locationKey] = [];
        }
        locationGroups[locationKey].push(article);
      });

      // 각 위치 그룹별로 마커 생성
      Object.entries(locationGroups).forEach(([locationKey, articleGroup]) => {
        try {
          const [latStr, lngStr] = locationKey.split(',');
          const lat = parseFloat(latStr);
          const lng = parseFloat(lngStr);

          // 좌표가 유효하지 않은 경우 건너뛰기
          if (isNaN(lat) || isNaN(lng)) {
            console.error(`Invalid location key: ${locationKey}`);
            return;
          }

          // 그룹 내 첫 번째 매물의 유형으로 마커 생성
          const representativeArticle = articleGroup[0];
          const isSelectedLocation = selectedArticle &&
            selectedArticle.latitude === lat &&
            selectedArticle.longitude === lng;

          // 마커 DOM 엘리먼트 생성
          const element = document.createElement('div');

          element.innerHTML = `
            <div 
              style="
                position: absolute;
                width: 40px;
                height: 40px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: ${isSelectedLocation ? 5 : 1};
              "
            >
              ${createArticleMarkerSvg(
                representativeArticle.buildingType,
                isSelectedLocation,
                undefined,
                undefined,
                articleGroup.length // 그룹 내 매물 수를 전달
              )}
            </div>
          `;

          // 클릭 이벤트 추가
          element.firstElementChild?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // 동일 위치에 매물이 여러 개인 경우
            if (articleGroup.length > 1) {
              console.log(`${articleGroup.length}개의 동일 위치 매물 그룹 클릭됨`);
              // 동일 위치 매물 목록 표시
              setSameLocationArticles(articleGroup);
              setCurrentLocation({lat, lng});
              setSameLocationPopupOpen(true);
            } else {
              // 단일 매물인 경우 바로 선택
              console.log("Article clicked:", representativeArticle.id);
              onArticleClick(representativeArticle);
            }
          });

          // kakao LatLng 객체 생성
          let position;
          try {
            position = new (window as any).kakao.maps.LatLng(lat, lng);
          } catch (err) {
            console.error(`Failed to create LatLng for location ${locationKey}: ${err}`);
            return;
          }

          // 마커 생성
          try {
            const marker = new (window as any).kakao.maps.CustomOverlay({
              position: position,
              content: element,
              map: map,
              zIndex: isSelectedLocation ? 5 : 1
            });

            window._customMarkers.push(marker);
          } catch (err) {
            console.error(`Failed to create marker for location ${locationKey}: ${err}`);
          }
        } catch (err) {
          console.error("Error creating location group marker:", err);
        }
      });
    }

    return clearMarkers;
  }, [isMapLoaded, articles, selectedArticle, clusterMode, clusters, onArticleClick, onClusterClick]);

  // 선택된 매물로 이동
  useEffect(() => {
    if (!isMapLoaded || !mapInstance.current || !selectedArticle) return;

    try {
      const map = mapInstance.current;
      if (selectedArticle.latitude && selectedArticle.longitude) {
        const position = new (window as any).kakao.maps.LatLng(
          selectedArticle.latitude,
          selectedArticle.longitude
        );

        // 먼저 중심점 변경
        map.setCenter(position);

        // 그 다음 줌 레벨 설정 (현재 레벨이 이미 충분히 가까우면 변경하지 않음)
        const currentLevel = map.getLevel();
        if (currentLevel > 3) {
          map.setLevel(3);
        }
      }
    } catch (error) {
      console.error("Failed to move to selected article:", error);
    }
  }, [isMapLoaded, selectedArticle]);

  // 동일 위치 매물 팝업 닫기 핸들러
  const handleCloseLocationPopup = () => {
    setSameLocationPopupOpen(false);
  };

  // 부모 컨테이너에 클래스 추가 효과
  useEffect(() => {
    // 가장 가까운 article-list-container 클래스를 가진 부모 요소 찾기
    const findParentContainer = () => {
      if (!mapInstance.current) return null;
      let parent = mapInstance.current.getElement().parentElement;
      while (parent) {
        if (parent.classList.contains('article-list-container')) {
          return parent;
        }
        parent = parent.parentElement;
      }
      return null;
    };

    const parentContainer = findParentContainer();
    if (parentContainer) {
      if (sameLocationPopupOpen) {
        parentContainer.classList.add('same-location-open');
      } else {
        parentContainer.classList.remove('same-location-open');
      }
    }

    return () => {
      if (parentContainer) {
        parentContainer.classList.remove('same-location-open');
      }
    };
  }, [sameLocationPopupOpen]);

  return {
    sameLocationArticles,
    sameLocationPopupOpen,
    currentLocation,
    handleCloseLocationPopup
  };
}; 