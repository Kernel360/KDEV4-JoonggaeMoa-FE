import { useCallback, useState, useRef, useEffect } from 'react';

import { YEOKSAM_CENTER, DEFAULT_MAP_BOUNDS, MAP_ZOOM_LEVELS } from '../map/constants/mapConstants';

export interface MapBounds {
  ne: { lat: number; lng: number };
  sw: { lat: number; lng: number };
}

interface UseMapViewProps {
  onBoundsChanged?: (newBounds: MapBounds, newZoom: number) => void;
  clusterZoomThreshold: number;
}

export function useMapView({ onBoundsChanged, clusterZoomThreshold }: UseMapViewProps) {
  const [mapBounds, setMapBounds] = useState<MapBounds>(DEFAULT_MAP_BOUNDS);
  const [mapZoom, setMapZoom] = useState<number>(MAP_ZOOM_LEVELS.DEFAULT);
  const [currentLocation, setCurrentLocation] = useState(YEOKSAM_CENTER);
  const [isClusterMode, setIsClusterMode] = useState<boolean>(false);
  const [clusterTransition, setClusterTransition] = useState<boolean>(false);
  const lastCallTimeRef = useRef<number>(0);
  const timeoutRef = useRef<number | null>(null);

  // 이펙트 클린업 함수
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const handleMapViewChange = useCallback((newBounds: MapBounds, newZoom: number) => {
    // 클러스터 전환 플래그가 활성화된 경우는 무시 (클러스터 클릭으로 인한 줌인)
    if (clusterTransition) {
      setClusterTransition(false);
      return;
    }

    // 경계 변경은 항상 반영
    setMapBounds(newBounds);

    // 줌 레벨 변경 감지 (이전과 다른 경우만 상태 업데이트)
    if (newZoom !== mapZoom) {
      // 너무 빠른 연속 호출 방지 (최소 250ms 간격)
      const now = Date.now();
      if (now - lastCallTimeRef.current < 250) {
        // 이전 예약된 타이머가 있으면 취소
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        // 새로운 타이머 등록 (디바운싱)
        timeoutRef.current = window.setTimeout(() => {
          lastCallTimeRef.current = Date.now();
          
          // 줌 레벨 업데이트
          setMapZoom(newZoom);
          
          // 클러스터 모드 전환 감지
          if (mapZoom < clusterZoomThreshold && newZoom >= clusterZoomThreshold) {
            setIsClusterMode(true);
          } else if (mapZoom >= clusterZoomThreshold && newZoom < clusterZoomThreshold) {
            setIsClusterMode(false);
          }
          
          // 상위 컴포넌트에 변경 알림
          if (onBoundsChanged) {
            onBoundsChanged(newBounds, newZoom);
          }
          
          timeoutRef.current = null;
        }, 250);
        
        return;
      }
      
      // 일정 시간이 지났으면 바로 처리
      lastCallTimeRef.current = now;
      
      // 줌 레벨 업데이트
      setMapZoom(newZoom);

      // 클러스터 모드 전환 감지
      if (mapZoom < clusterZoomThreshold && newZoom >= clusterZoomThreshold) {
        setIsClusterMode(true);
      } else if (mapZoom >= clusterZoomThreshold && newZoom < clusterZoomThreshold) {
        setIsClusterMode(false);
      }
    }

    // 상위 컴포넌트에 변경 알림
    if (onBoundsChanged) {
      onBoundsChanged(newBounds, newZoom);
    }
  }, [mapZoom, clusterZoomThreshold, onBoundsChanged, clusterTransition]);

  return {
    mapBounds,
    setMapBounds,
    mapZoom,
    setMapZoom,
    currentLocation,
    setCurrentLocation,
    isClusterMode,
    setIsClusterMode,
    handleMapViewChange,
    clusterTransition,
    setClusterTransition
  };
} 