import { useCallback, useState } from 'react';

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
      // 줌 레벨만 업데이트
      setMapZoom(newZoom);

      // 클러스터 모드 전환 감지
      const isTransitioningToCluster = mapZoom < clusterZoomThreshold && newZoom >= clusterZoomThreshold;
      const isTransitioningFromCluster = mapZoom >= clusterZoomThreshold && newZoom < clusterZoomThreshold;

      if (isTransitioningToCluster) {
        setIsClusterMode(true);
      } else if (isTransitioningFromCluster) {
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