import { Alert, Box, LinearProgress, Fade, Typography } from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';

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
  // 외부에서 전달받은 mapRef를 저장할 내부 참조
  const externalMapRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    onBoundsChanged: (bounds, zoom) => {
      // 지도 이동 시 로딩 상태 시작
      setIsLoading(true);
      setLoadingMessage("지도 로딩 중...");
      
      // 기존 타임아웃이 있으면 제거
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      // 바운드 변경 콜백 호출
      if (onBoundsChanged) {
        onBoundsChanged(bounds, zoom);
      }
      
      // 500ms 후에 로딩 상태 해제 (타일 로딩 완료 시간 고려)
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage("로딩 완료");
        
        // 로딩 완료 메시지를 잠시 표시한 후 사라지게 함
        loadingTimeoutRef.current = setTimeout(() => {
          setLoadingMessage("");
        }, 1000);
      }, 500);
    },
    mapRef: externalMapRef
  });

  // 지도 인스턴스가 생성되면 외부 mapRef에도 할당
  useEffect(() => {
    if (isMapLoaded && mapInstance.current && mapRef) {
      mapRef.current = mapInstance.current;
      
      // 타일 로드 완료 이벤트 추가
      const kakao = (window as any).kakao;
      if (kakao && kakao.maps) {
        kakao.maps.event.addListener(mapInstance.current, 'tilesloaded', () => {
          setIsLoading(false);
          setLoadingMessage("로딩 완료");
          
          // 로딩 완료 메시지를 잠시 표시한 후 사라지게 함
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }
          
          loadingTimeoutRef.current = setTimeout(() => {
            setLoadingMessage("");
          }, 1000);
        });
      }
    }
  }, [isMapLoaded, mapInstance, mapRef]);

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

  // 마이 로케이션 마커 언마운트 시 제거 및 타임아웃 정리
  useEffect(() => {
    return () => {
      if (myLocationMarker) {
        myLocationMarker.setMap(null);
        setMyLocationMarker(null);
      }
      
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
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
      {/* 로딩 표시기 */}
      <Fade in={isLoading || loadingMessage !== ""} timeout={300}>
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {isLoading && (
            <LinearProgress sx={{ width: '100%', height: 4 }} />
          )}
          {loadingMessage && (
            <Typography 
              variant="caption" 
              sx={{ 
                bgcolor: 'rgba(0, 0, 0, 0.6)', 
                color: 'white', 
                py: 0.5, 
                px: 2, 
                borderRadius: '0 0 4px 4px'
              }}
            >
              {loadingMessage}
            </Typography>
          )}
        </Box>
      </Fade>

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
