import { ArticleResponse } from '../../types/article';
import { MAP_DISPLAY_MODES } from '../constants/mapConstants';
import { Region } from '../utils/regionUtils';

export type MapDisplayMode = typeof MAP_DISPLAY_MODES[keyof typeof MAP_DISPLAY_MODES];

export interface RegionArticleCount {
  region: Region;
  count: number;
  name: string;
  lat: number;
  lng: number;
  type: 'city' | 'district';
}

export interface DisplayModeData {
  // 매물 표시용 데이터
  articles?: ArticleResponse[];
  
  // 클러스터 표시용 데이터
  clusters?: Array<{
    lat: number;
    lng: number;
    count: number;
    color?: string;
    radius?: number;
  }>;
  
  // 구역별 표시용 데이터
  districtCounts?: RegionArticleCount[];
  
  // 시별 표시용 데이터
  cityCounts?: RegionArticleCount[];
} 