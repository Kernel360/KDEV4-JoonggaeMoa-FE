import { Alert, Box } from '@mui/material';
import React, { useEffect, useRef } from 'react';

import SameLocationArticleList from "@/domain/article/components/SameLocationArticleList";
import type { Region } from '@/domain/article/map/utils/regionUtils';
import type { ArticleResponse, ClusterInfo } from '@/domain/article/types/article';

import MapControlButtons from './MapControlButtons';
import { useMapControls } from '../hooks/useMapControls';
import { useMapInitialize } from '../hooks/useMapInitialize';
import { useMarkers } from '../hooks/useMarkers';
import { useRegions } from '../hooks/useRegions';
import { RegionArticleCount } from '../types/mapDisplayTypes';

interface MapViewProps {
  articles: ArticleResponse[];
  selectedArticle: ArticleResponse | null;
  onArticleClick: (article: ArticleResponse) => void;
  selectedRegions?: {
    city: string;
    district: string;
    neighborhoods: string[];
  };
  allRegions?: Region[];
  initialCenter?: { lat: number, lng: number };
  initialZoom?: number;
  fixedInitialView?: boolean;
  onViewChange?: (center: { lat: number, lng: number }, zoom: number) => void;
  onBoundsChanged?: (bounds: {
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number }
  }, zoom: number) => void;
  /**
   * 클러스터 모드 여부 (true면 클러스터만 표시)
   */
  clusterMode?: boolean;
  /**
   * 클러스터 데이터
   */
  clusters?: (ClusterInfo & {
    weight?: number;
    radius?: number;
    color?: string;
  })[];
  onClusterClick?: (cluster: ClusterInfo) => void;
  onRegionClick?: (region: RegionArticleCount) => void;
  mapRef?: React.MutableRefObject<any>;
  /**
   * 리스트 숨김 상태
   */
  isListHidden?: boolean;
}

const MapView = ({
  articles,
  selectedArticle,
  onArticleClick,
  selectedRegions,
  allRegions,
  initialCenter,
  initialZoom,
  onViewChange,
  onBoundsChanged,
  clusterMode = false,
  clusters,
  onClusterClick,
  onRegionClick,
  mapRef,
  isListHidden
}: MapViewProps) => {
  const externalMapRef = useRef<any>(mapRef?.current);

  // 지도 초기화
  const {
    mapRefInternal,
    mapInstance,
    isMapLoaded,
    mapErrorMessage,
    currentZoomLevel,
    setCurrentZoomLevel
  } = useMapInitialize({
    initialCenter, 
    initialZoom, 
    onViewChange, 
    onBoundsChanged,
    mapRef: externalMapRef
  });

  // 지도 컨트롤 (줌, 현위치)
  const {
    isLocating,
    myLocationMarker,
    handleZoomIn,
    handleZoomOut,
    handleCurrentLocation,
    setMyLocationMarker
  } = useMapControls({
    mapInstance, 
    isMapLoaded, 
    setCurrentZoomLevel
  });

  // 마커 및 클러스터
  const {
    sameLocationArticles,
    sameLocationPopupOpen,
    currentLocation,
    handleCloseLocationPopup
  } = useMarkers({
    mapInstance,
    isMapLoaded,
    articles,
    selectedArticle,
    onArticleClick,
    clusterMode,
    clusters,
    onClusterClick,
    currentZoomLevel,
    onRegionClick
  });

  // 행정구역 경계
  useRegions({
    mapInstance,
    isMapLoaded,
    selectedRegions,
    allRegions
  });

  // 마이 로케이션 마커 언마운트 시 제거
  useEffect(() => {
    return () => {
      if (myLocationMarker) {
        myLocationMarker.setMap(null);
        setMyLocationMarker(null);
      }
    };
  }, [myLocationMarker, setMyLocationMarker]);

  return (
    <Box sx={{
      position: 'relative',
      width: '100%',
      height: '100%',
      flex: 1,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 지도 컨테이너 */}
      <Box
        ref={mapRefInternal}
        sx={{
          width: '100%',
          height: '100%',
          flex: 1
        }}
      />

      {/* 지도 컨트롤 버튼 */}
      <MapControlButtons
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleCurrentLocation={handleCurrentLocation}
        isLocating={isLocating}
      />

      {/* 에러 메시지 */}
      {mapErrorMessage && (
        <Alert severity="error" sx={{position: 'absolute', top: '10px', left: '10px', zIndex: 10}}>
          {mapErrorMessage}
        </Alert>
      )}

      {/* 동일 위치 매물 리스트 */}
      <SameLocationArticleList
        articles={sameLocationArticles}
        isOpen={sameLocationPopupOpen}
        onClose={handleCloseLocationPopup}
        onArticleClick={onArticleClick}
        selectedArticle={selectedArticle}
        location={currentLocation || {lat: 0, lng: 0}}
        isListHidden={isListHidden}
      />
    </Box>
  );
};

export default MapView; 
