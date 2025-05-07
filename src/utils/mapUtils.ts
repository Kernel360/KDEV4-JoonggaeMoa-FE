import { ArticleResponse } from "../types/article";
import { createCoordinates } from "./articleFormat";

// 역삼동 826-21 기준 좌표
export const YEOKSAM_CENTER = {
  lat: 37.4969664,
  lng: 127.0323278
};

// 지도 줌 레벨 설정
export const MAP_ZOOM_LEVELS = {
  DEFAULT: 5,           // 강남구 전체 보기에 적합
  CLUSTER: 6,           // 클러스터 표시 기준 (6 이상일 때 클러스터링)
  MIN_FETCH: 4,         // 데이터 fetching 최소 줌 레벨
  MAP_BOUND_LIST: 8     // 지도 영역 기준 목록 표시 줌 레벨
} as const;

// 강남구 일대를 보여주기 위한 기본 경계
export const DEFAULT_MAP_BOUNDS = {
  ne: { lat: 37.5170664, lng: 127.0523278 }, // 역삼동 중심에서 북동쪽
  sw: { lat: 37.4769664, lng: 127.0123278 }  // 역삼동 중심에서 남서쪽
};

// 매물 유형별 아이콘 및 색상 매핑 정의
export const PROPERTY_TYPE_STYLES = {
  "아파트": { icon: "🏢", color: "#3F51B5" }, // 파란색
  "오피스텔": { icon: "🏬", color: "#673AB7" }, // 보라색
  "빌라": { icon: "🏘️", color: "#4CAF50" }, // 녹색
  "전원주택": { icon: "🏡", color: "#8BC34A" }, // 연두색
  "단독/다가구": { icon: "🏠", color: "#009688" }, // 청록색
  "상가주택": { icon: "🏪", color: "#FF5722" }, // 주황색
  "한옥주택": { icon: "🏯", color: "#795548" }, // 갈색
  "상가": { icon: "🏪", color: "#FF9800" }, // 주황색
  "사무실": { icon: "🏢", color: "#607D8B" }, // 회색
  // 기본값 (매물 유형이 없거나 매칭되지 않을 경우)
  "default": { icon: "📍", color: "#F44336" } // 빨간색
};

// 클러스터 히트맵 색상 배열 (낮은 밀도에서 높은 밀도로)
export const HEATMAP_COLORS = [
  '#00FF00', // 녹색 (낮은 밀도)
  '#ADFF2F', // 연두색
  '#FFFF00', // 노란색
  '#FFA500', // 주황색
  '#FF4500', // 붉은 주황색
  '#FF0000', // 빨간색
  '#DC143C', // 크림슨
  '#8B0000', // 어두운 빨간색
  '#800080', // 보라색
  '#4B0082'  // 남색 (높은 밀도)
];

/**
 * 주어진 영역 내에 있는 매물 목록을 필터링합니다.
 * 
 * @param articles 필터링할 매물 목록
 * @param bounds 영역 좌표 (북동쪽, 남서쪽 좌표)
 * @returns 영역 내에 있는 매물 목록
 */
export const filterArticlesInBounds = (
  articles: ArticleResponse[], 
  bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }
): ArticleResponse[] => {
  return articles.filter(article => {
    const coordinates = createCoordinates(article.latitude, article.longitude);
    if (!coordinates) return false;
    
    return (
      coordinates.lat >= bounds.sw.lat &&
      coordinates.lat <= bounds.ne.lat &&
      coordinates.lng >= bounds.sw.lng &&
      coordinates.lng <= bounds.ne.lng
    );
  });
};

/**
 * 지도 줌 레벨에 따른 정밀도 값을 반환합니다.
 * 
 * @param zoomLevel 지도 줌 레벨
 * @returns 정밀도 값
 */
export const getPrecisionByZoomLevel = (zoomLevel: number): number => {
  if (zoomLevel <= 3) return 1;
  if (zoomLevel <= 5) return 2;
  if (zoomLevel <= 7) return 3;
  if (zoomLevel <= 9) return 4;
  if (zoomLevel <= 11) return 5;
  if (zoomLevel <= 13) return 6;
  if (zoomLevel <= 15) return 7;
  return 8;
}; 