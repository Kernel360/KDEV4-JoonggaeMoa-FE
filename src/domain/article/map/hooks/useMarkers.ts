import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';

import type { ArticleResponse, ClusterInfo } from '@/domain/article/types/article';
import { createArticleMarkerSvg } from '@/domain/article/utils/articleDisplay';
import { validateCoordinates } from '@/domain/article/utils/articleFormat';

import { useMapDisplayMode } from './useMapDisplayMode';
import RegionArticleCountMarker from '../components/RegionArticleCountMarker';
import RegionArticlePopper from '../components/RegionArticlePopper';
import { MAP_DISPLAY_MODES } from '../constants/mapConstants';
import { RegionArticleCount } from '../types/mapDisplayTypes';

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
  currentZoomLevel: number;
  onRegionClick?: (region: RegionArticleCount) => void;
}

export const useMarkers = ({
  mapInstance,
  isMapLoaded,
  articles,
  selectedArticle,
  onArticleClick,
  clusters,
  onClusterClick,
  currentZoomLevel,
  onRegionClick
}: UseMarkersProps) => {
  const [sameLocationArticles, setSameLocationArticles] = useState<ArticleResponse[]>([]);
  const [sameLocationPopupOpen, setSameLocationPopupOpen] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null);

  // 줌 레벨에 따른 표시 방식 결정
  const { displayMode, displayData } = useMapDisplayMode({
    articles,
    currentZoomLevel,
    clusters
  });

  // 마커 표시
  useEffect(() => {
    if (!isMapLoaded || !mapInstance.current) {
      return;
    }

    const map = mapInstance.current;
    
    // 기존 마커 제거 함수 - 한번에 효율적으로 제거
    const clearMarkers = () => {
      if (window._customMarkers && window._customMarkers.length > 0) {
        for (let i = 0; i < window._customMarkers.length; i++) {
          const marker = window._customMarkers[i];
          if (marker) marker.setMap(null);
        }
        window._customMarkers = [];
      }
    };

    // 기존 마커 모두 제거
    clearMarkers();

    // 클러스터 마커 클릭 이벤트 처리 함수
    const handleClusterClick = (cluster: ClusterInfo) => {
      if (onClusterClick) {
        onClusterClick(cluster);
      }
    };

    // 지역 마커 클릭 이벤트 처리 함수
    const handleRegionClick = (region: RegionArticleCount) => {
      if (onRegionClick) {
        onRegionClick(region);
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

    // DOM 요소 생성 최소화를 위한 DocumentFragment 활용
    const kakao = (window as any).kakao;
    const newMarkers = [];

    // 현재 표시 모드에 따라 적절한 마커 표시
    if (displayMode === MAP_DISPLAY_MODES.SHOW_CLUSTERS && displayData.clusters && displayData.clusters.length > 0) {
      // 클러스터 표시 (배치 처리)
      console.log("클러스터 모드: 클러스터 데이터 표시", displayData.clusters.length, "개");
      
      const maxClusters = Math.min(displayData.clusters.length, 100); // 클러스터 수 제한
      
      for (let i = 0; i < maxClusters; i++) {
        const cluster = displayData.clusters[i];
        
        // 클러스터 데이터 검증 
        if (!cluster || typeof cluster.lat !== 'number' || typeof cluster.lng !== 'number' || !cluster.count) {
          console.warn("유효하지 않은 클러스터 데이터:", cluster);
          continue;
        }
        
        // HTML 요소로 클러스터 마커 생성
        const element = document.createElement('div');

        // 히트맵 색상 사용
        const color = cluster.color || getHeatmapColorByCount(cluster.count);

        // 클러스터 크기 결정
        const radius = cluster.radius || calculateRadiusByCount(cluster.count);
        const opacity = getOpacityByCount(cluster.count);

        // 글자 크기 조정 
        const fontSize = Math.max(radius * 0.35, 14);

        // 최적화된 인라인 SVG 사용
        element.innerHTML = `
          <div style="position:absolute;cursor:pointer;width:${radius}px;height:${radius}px;transform:translate(-50%,-50%)">
            <svg width="${radius}" height="${radius}" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="${color}" opacity="${opacity}" stroke="#ffffff" stroke-width="4"/>
              <text x="50" y="55" text-anchor="middle" font-size="${fontSize}px" font-weight="bold" fill="white">${cluster.count}</text>
            </svg>
          </div>
        `;

        // 클릭 이벤트 추가
        element.firstElementChild?.addEventListener('click', () => handleClusterClick(cluster));

        // 클러스터 커스텀 마커 생성
        try {
          const position = new kakao.maps.LatLng(cluster.lat, cluster.lng);
          const marker = new kakao.maps.CustomOverlay({
            position: position,
            content: element,
            zIndex: 2,
            map: map
          });

          newMarkers.push(marker);
        } catch (err) {
          console.error("클러스터 마커 생성 오류:", err);
        }
      }
    } 
    else if ((displayMode === MAP_DISPLAY_MODES.SHOW_DISTRICT_COUNT && displayData.districtCounts && displayData.districtCounts.length > 0) ||
             (displayMode === MAP_DISPLAY_MODES.SHOW_CITY_COUNT && displayData.cityCounts && displayData.cityCounts.length > 0)) {
      // 지역별 매물 개수 표시 (React 컴포넌트 마커)
      const regionCounts = displayMode === MAP_DISPLAY_MODES.SHOW_DISTRICT_COUNT 
        ? displayData.districtCounts!
        : displayData.cityCounts!;
      
      // 성능을 위해 최대 표시 개수 제한
      const maxRegions = Math.min(regionCounts.length, 100);
      
      for (let i = 0; i < maxRegions; i++) {
        const region = regionCounts[i];
        
        // 마커 DOM 요소 생성
        const markerContainer = document.createElement('div');
        
        // React 컴포넌트 렌더링 - Popper 컴포넌트 사용
        const root = createRoot(markerContainer);
        root.render(
          React.createElement(RegionArticlePopper, {
            regionCount: region,
            onClick: () => handleRegionClick(region)
          })
        );

        // 지역 마커 생성
        try {
          const position = new kakao.maps.LatLng(region.lat, region.lng);
          const marker = new kakao.maps.CustomOverlay({
            position: position,
            content: markerContainer,
            zIndex: 2,
            map: map
          });
          newMarkers.push(marker);
        } catch (error) {
          // 오류는 무시하고 다음 마커로 진행
          continue;
        }
      }
    } 
    else if (displayMode === MAP_DISPLAY_MODES.SHOW_ALL_PINS || articles.length > 0) {
      // 개별 매물 마커 표시
      
      // 너무 많은 매물이 있으면 렌더링 부하가 커지므로 제한
      const maxArticles = Math.min(articles.length, 100);
      const articlesByLocation = new Map();
      
      // 같은 위치의 매물을 하나의 마커로 그룹화
      for (let i = 0; i < maxArticles; i++) {
        const article = articles[i];
        
        // 좌표 유효성 검사
        const lat = article.latitude;
        const lng = article.longitude;
        
        if (!lat || !lng || !validateCoordinates(lat, lng)) {
          console.warn("유효하지 않은 매물 좌표:", article.id, lat, lng);
          continue;
        }
        
        const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        
        if (!articlesByLocation.has(key)) {
          articlesByLocation.set(key, [article]);
        } else {
          articlesByLocation.get(key).push(article);
        }
      }
      
      // 그룹화된 위치별로 마커 생성
      articlesByLocation.forEach((articlesAtLocation, key) => {
        const [lat, lng] = key.split(',').map(Number);
        const article = articlesAtLocation[0]; // 첫 번째 매물 사용
        const isSelected = selectedArticle && selectedArticle.id === article.id;
        const hasMultipleArticles = articlesAtLocation.length > 1;
        
        // SVG 마커 생성 - 올바른 인수 전달
        const svgMarker = createArticleMarkerSvg(
          article.buildingType, 
          isSelected, 
          undefined, 
          undefined, 
          hasMultipleArticles ? articlesAtLocation.length : undefined
        );
        
        // 마커 DOM 요소 생성
        const element = document.createElement('div');
        element.innerHTML = `
          <div style="position:absolute;cursor:pointer;width:40px;height:40px;transform:translate(-50%,-50%)">
            ${svgMarker}
          </div>
        `;
        
        // 클릭 이벤트 추가
        element.addEventListener('click', () => {
          if (articlesAtLocation.length === 1) {
            onArticleClick(article);
          } else {
            setSameLocationArticles(articlesAtLocation);
            setSameLocationPopupOpen(true);
            setCurrentLocation({ lat, lng });
          }
        });
        
        // 마커 생성 및 지도에 표시
        const position = new kakao.maps.LatLng(lat, lng);
        const marker = new kakao.maps.CustomOverlay({
          position: position, 
          content: element,
          zIndex: isSelected ? 3 : 1,
          map: map
        });
        
        newMarkers.push(marker);
      });
    }

    // 모든 마커를 글로벌 배열에 저장
    window._customMarkers = newMarkers;

    // 다음 렌더링에서 제거될 수 있도록 클린업 함수 반환
    return clearMarkers;
  }, [
    isMapLoaded, 
    mapInstance, 
    displayMode, 
    displayData.clusters, 
    displayData.districtCounts, 
    displayData.cityCounts, 
    articles, 
    selectedArticle, 
    onArticleClick,
    onClusterClick,
    onRegionClick
  ]);

  // 팝업 닫기 핸들러
  const handleCloseLocationPopup = useCallback(() => {
    setSameLocationPopupOpen(false);
    setSameLocationArticles([]);
    setCurrentLocation(null);
  }, []);

  return {
    sameLocationArticles,
    sameLocationPopupOpen,
    currentLocation,
    handleCloseLocationPopup
  };
};