import { useEffect, useRef, useState } from 'react';
import { YEOKSAM_CENTER } from '@/domain/article/map/constants/mapConstants';

interface UseMapInitializeProps {
  initialCenter?: { lat: number, lng: number };
  initialZoom?: number;
  onViewChange?: (center: { lat: number, lng: number }, zoom: number) => void;
  onBoundsChanged?: (bounds: {
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number }
  }, zoom: number) => void;
  mapRef?: React.MutableRefObject<any>;
}

// debounce 함수 구현
const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number
): ((...args: Parameters<F>) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<F>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

export const useMapInitialize = ({
  initialCenter,
  initialZoom,
  onViewChange,
  onBoundsChanged,
  mapRef
}: UseMapInitializeProps) => {
  const mapRefInternal = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
  const [mapErrorMessage, setMapErrorMessage] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<any>(null);
  const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(initialZoom || 5);
  const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY;

  // 카카오맵 스크립트 로드
  useEffect(() => {
    if (!KAKAO_APP_KEY) {
      console.error('Kakao API key is not defined');
      setMapErrorMessage("Kakao API 키가 설정되지 않았습니다");
      return;
    }

    const kakaoMapScript = document.getElementById('kakao-map-script');

    // 스크립트가 이미 로드되었고 API가 사용 가능한 경우
    if (
      kakaoMapScript &&
      (window as any).kakao &&
      (window as any).kakao.maps
    ) {
      setIsScriptLoaded(true);
      return;
    }

    // 이전 스크립트 제거
    if (kakaoMapScript) {
      kakaoMapScript.remove();
    }

    // 새 스크립트 요소 생성
    const script = document.createElement('script');
    script.id = 'kakao-map-script';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services,clusterer,drawing&autoload=false`;
    script.async = true;

    // 스크립트 로드 성공
    script.onload = () => {
      (window as any).kakao.maps.load(() => {
        setIsScriptLoaded(true);
      });
    };

    // 스크립트 로드 실패
    script.onerror = () => {
      console.error("Failed to load Kakao Maps script");
      setMapErrorMessage("Kakao 맵 스크립트 로드에 실패했습니다");
    };

    document.head.appendChild(script);
  }, [KAKAO_APP_KEY]);

  // 맵 초기화
  useEffect(() => {
    if (!isScriptLoaded || !mapRefInternal.current) return;

    try {
      // 이미 지도 인스턴스가 존재하는지 확인
      if (mapInstance.current) {
        // 지도가 존재하면 초기 세팅이 완료된 상태로 표시
        setIsMapLoaded(true);

        // 외부 참조도 업데이트
        if (mapRef) {
          mapRef.current = mapInstance.current;
        }
        return;
      }

      // 새 지도 인스턴스 생성 (처음 마운트될 때만)
      const container = mapRefInternal.current;
      const options = {
        center: new (window as any).kakao.maps.LatLng(
          initialCenter?.lat || YEOKSAM_CENTER.lat,
          initialCenter?.lng || YEOKSAM_CENTER.lng
        ),
        level: initialZoom || 5,
        mapTypeControl: false,
        zoomControl: false,
        scaleControl: false  // 스케일 컨트롤 비활성화
      };

      const kakaoMap = new (window as any).kakao.maps.Map(container, options);

      // 스케일 컨트롤 비활성화 (줌 레벨 표시 제거)
      if ((window as any).kakao.maps.ScaleControl) {
        const scaleControl = kakaoMap.getScaleControl();
        if (scaleControl) {
          scaleControl.setMap(null);
        }
      }

      // 맵 인스턴스 저장 - 내부 및 외부 참조 모두 업데이트
      mapInstance.current = kakaoMap;
      if (mapRef) {
        mapRef.current = kakaoMap;
      }

      // 지도 이동 이벤트
      const handleMapIdle = debounce(() => {
        try {
          const bounds = kakaoMap.getBounds();
          setMapBounds(bounds);

          const center = kakaoMap.getCenter();
          const level = kakaoMap.getLevel();
          setCurrentZoomLevel(level);

          if (onViewChange) {
            onViewChange({
              lat: center.getLat(),
              lng: center.getLng()
            }, level);
          }

          if (onBoundsChanged) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();

            onBoundsChanged({
              ne: {
                lat: ne.getLat(),
                lng: ne.getLng()
              },
              sw: {
                lat: sw.getLat(),
                lng: sw.getLng()
              }
            }, level);
          }
        } catch (error) {
          console.error("Error in handleMapIdle:", error);
        }
      }, 300);

      (window as any).kakao.maps.event.addListener(kakaoMap, 'idle', handleMapIdle);

      // 초기 줌 레벨 설정
      setCurrentZoomLevel(kakaoMap.getLevel());
      setIsMapLoaded(true);

      return () => {
        try {
          const kakao = (window as any).kakao;
          if (kakao && kakao.maps && kakao.maps.event && kakaoMap) {
            kakao.maps.event.removeListener(kakaoMap, 'idle', handleMapIdle);
          }
        } catch (error) {
          console.error('idle 이벤트 리스너 제거 중 오류:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapErrorMessage("지도 초기화에 실패했습니다.");
    }
  }, [isScriptLoaded]);

  // initialCenter가 변경될 때 한 번만 실행되는 효과
  const initialCenterRef = useRef(initialCenter);
  useEffect(() => {
    if (!isMapLoaded || !initialCenter) return;

    // 매우 처음 한 번만 실행
    if (!initialCenterRef.current) {
      initialCenterRef.current = initialCenter;

      if (mapInstance.current) {
        try {
          const position = new (window as any).kakao.maps.LatLng(
            initialCenter.lat,
            initialCenter.lng
          );
          mapInstance.current.setCenter(position);
        } catch (error) {
          console.error('Error setting initial center:', error);
        }
      }
    }
  }, [isMapLoaded, initialCenter]);

  // 초기 줌 레벨 설정
  const initialZoomRef = useRef(initialZoom);
  useEffect(() => {
    if (!isMapLoaded || !mapInstance.current) return;

    // initialZoom이 변경되었고, 사용자 상호작용이 아닌 경우에만 줌 레벨 업데이트
    if (initialZoom !== undefined && initialZoom !== currentZoomLevel) {
      // 클러스터나 매물 선택으로 인한 변경일 때만 실행
      if (initialZoom !== initialZoomRef.current) {
        initialZoomRef.current = initialZoom;

        try {
          mapInstance.current.setLevel(initialZoom);
          setCurrentZoomLevel(initialZoom);
        } catch (error) {
          console.error('Error setting zoom level:', error);
        }
      }
    }
  }, [isMapLoaded, initialZoom, currentZoomLevel]);

  return {
    mapRefInternal,
    mapInstance,
    isMapLoaded,
    isScriptLoaded,
    mapErrorMessage,
    mapBounds,
    currentZoomLevel,
    setCurrentZoomLevel
  };
}; 