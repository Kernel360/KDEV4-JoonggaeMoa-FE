import { useMemo } from 'react';

import { ArticleResponse } from '../../types/article';
import { DISPLAY_MODE_BY_ZOOM_LEVEL, MAP_DISPLAY_MODES } from '../constants/mapConstants';
import { DisplayModeData, MapDisplayMode, RegionArticleCount } from '../types/mapDisplayTypes';
import { KOREA_REGIONS } from '../utils/regionData';
import { Region } from '../utils/regionUtils';

interface UseMapDisplayModeProps {
  articles: ArticleResponse[];
  currentZoomLevel: number;
  clusters?: Array<{
    lat: number;
    lng: number;
    count: number;
    color?: string;
    radius?: number;
  }>;
}

export const useMapDisplayMode = ({
  articles,
  currentZoomLevel,
  clusters
}: UseMapDisplayModeProps) => {
  // 줌 레벨에 따른 표시 방식 결정
  const displayMode = useMemo<MapDisplayMode>(() => {
    // 수정: 현재 줌 레벨을 1~14 사이로 제한
    const level = Math.min(Math.max(1, currentZoomLevel), 14);
    
    // 클러스터가 있고 줌 레벨이 클러스터 표시 범위에 있다면 클러스터 모드 강제
    if (clusters && clusters.length > 0 && 
       (level >= 5 && level <= 7)) {
      return MAP_DISPLAY_MODES.SHOW_CLUSTERS;
    }
    
    // 매물이 있고 구/시 매물 수가 없을 경우 모든 줌 레벨에서 매물 핀 표시 모드 사용
    if (articles.length > 0) {
      return MAP_DISPLAY_MODES.SHOW_ALL_PINS;
    }
    
    // 그 외에는 줌 레벨에 따라 지정된 표시 모드 사용
    const mode = DISPLAY_MODE_BY_ZOOM_LEVEL[level as keyof typeof DISPLAY_MODE_BY_ZOOM_LEVEL] || MAP_DISPLAY_MODES.SHOW_ALL_PINS;
    return mode;
  }, [currentZoomLevel, clusters, articles]);

  // 시별 매물 개수 계산
  const cityCounts = useMemo<RegionArticleCount[]>(() => {
    if (displayMode !== MAP_DISPLAY_MODES.SHOW_CITY_COUNT || !articles.length) {
      return [];
    }

    const cities: Record<string, { count: number; region: Region }> = {};
    
    // 시/도 레벨 지역 필터링
    const cityRegions = KOREA_REGIONS.filter(region => 
      region.cortarType === 'sido'
    );
    
    // 각 시/도별 초기화
    cityRegions.forEach(region => {
      cities[region.cortarName] = { count: 0, region };
    });
    
    // 매물별로 시/도 카운트 증가
    articles.forEach(article => {
      const cityName = article.address1SiDo;
      if (cityName && cities[cityName]) {
        cities[cityName].count++;
      }
    });
    
    // 결과 배열로 변환
    return Object.entries(cities)
      .filter(([, data]) => data.count > 0)
      .map(([name, data]) => ({
        region: data.region,
        count: data.count,
        name,
        lat: data.region.centerLat,
        lng: data.region.centerLon,
        type: 'city' as const
      }));
  }, [articles, displayMode]);

  // 구별 매물 개수 계산
  const districtCounts = useMemo<RegionArticleCount[]>(() => {
    if (displayMode !== MAP_DISPLAY_MODES.SHOW_DISTRICT_COUNT || !articles.length) {
      return [];
    }

    const districts: Record<string, { count: number; region: Region }> = {};
    
    // 구/군 레벨 지역 필터링
    const districtRegions = KOREA_REGIONS.filter(region => 
      region.cortarType === 'sigungu'
    );
    
    // 각 구/군별 초기화
    districtRegions.forEach(region => {
      districts[region.areaFull || region.cortarName] = { count: 0, region };
    });
    
    // 매물별로 구/군 카운트 증가
    articles.forEach(article => {
      const districtName = article.address1SiDo + ' ' + article.address2SiGunGu;
      if (districtName && districts[districtName]) {
        districts[districtName].count++;
      } else {
        // 구/군명만으로도 시도
        const districtOnlyName = article.address2SiGunGu;
        if (districtOnlyName) {
          const matchingDistrict = Object.entries(districts).find(([key]) => 
            key.endsWith(districtOnlyName)
          );
          if (matchingDistrict) {
            districts[matchingDistrict[0]].count++;
          }
        }
      }
    });
    
    // 결과 배열로 변환
    return Object.entries(districts)
      .filter(([, data]) => data.count > 0)
      .map(([name, data]) => ({
        region: data.region,
        count: data.count,
        name,
        lat: data.region.centerLat,
        lng: data.region.centerLon,
        type: 'district' as const
      }));
  }, [articles, displayMode]);

  // 표시 방식에 따른 데이터 구성
  const displayData = useMemo<DisplayModeData>(() => {
    switch (displayMode) {
      case MAP_DISPLAY_MODES.SHOW_ALL_PINS:
        return { articles };
      
      case MAP_DISPLAY_MODES.SHOW_CLUSTERS:
        // 클러스터가 없거나 비어있을 경우 처리
        if (!clusters || clusters.length === 0) {
          // 줌 레벨에 따라 대체 표시 모드 사용
          if (currentZoomLevel <= 2) {
            return { cityCounts };
          } else if (currentZoomLevel <= 4) {
            return { districtCounts };
          } else {
            return { articles };
          }
        }
        
        return { clusters };
      
      case MAP_DISPLAY_MODES.SHOW_DISTRICT_COUNT:
        return { districtCounts };
      
      case MAP_DISPLAY_MODES.SHOW_CITY_COUNT:
        return { cityCounts };
      
      default:
        return { articles };
    }
  }, [displayMode, articles, clusters, districtCounts, cityCounts, currentZoomLevel]);

  return {
    displayMode,
    displayData
  };
}; 