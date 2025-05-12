// 지도 기본 중심 좌표 (역삼동 826-21 기준)
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

// 지도 표시 방식 설정
export const MAP_DISPLAY_MODES = {
  SHOW_ALL_PINS: 'SHOW_ALL_PINS',           // 모든 매물 표시
  SHOW_CLUSTERS: 'SHOW_CLUSTERS',           // 클러스터 표시
  SHOW_DISTRICT_COUNT: 'SHOW_DISTRICT_COUNT', // 구별 매물 개수 표시
  SHOW_CITY_COUNT: 'SHOW_CITY_COUNT'        // 시별 매물 개수 표시
} as const;

// 줌 레벨에 따른 표시 방식
export const DISPLAY_MODE_BY_ZOOM_LEVEL = {
  1: MAP_DISPLAY_MODES.SHOW_CITY_COUNT,     // 1~3: 시별 매물 개수
  2: MAP_DISPLAY_MODES.SHOW_CITY_COUNT,
  3: MAP_DISPLAY_MODES.SHOW_CITY_COUNT,
  4: MAP_DISPLAY_MODES.SHOW_ALL_PINS,       // 4: 모든 매물
  5: MAP_DISPLAY_MODES.SHOW_CLUSTERS,       // 5~6: 클러스터
  6: MAP_DISPLAY_MODES.SHOW_CLUSTERS,
  7: MAP_DISPLAY_MODES.SHOW_DISTRICT_COUNT, // 7~8: 구별 매물 개수
  8: MAP_DISPLAY_MODES.SHOW_DISTRICT_COUNT,
  9: MAP_DISPLAY_MODES.SHOW_CITY_COUNT,     // 9 이상: 시별 매물 개수
  10: MAP_DISPLAY_MODES.SHOW_CITY_COUNT,
  11: MAP_DISPLAY_MODES.SHOW_CITY_COUNT,
  12: MAP_DISPLAY_MODES.SHOW_CITY_COUNT,
  13: MAP_DISPLAY_MODES.SHOW_CITY_COUNT,
  14: MAP_DISPLAY_MODES.SHOW_CITY_COUNT
} as const;

// 강남구 일대를 보여주기 위한 기본 경계
export const DEFAULT_MAP_BOUNDS = {
  ne: {lat: 37.5170664, lng: 127.0523278}, // 역삼동 중심에서 북동쪽
  sw: {lat: 37.4769664, lng: 127.0123278}  // 역삼동 중심에서 남서쪽
};

// 매물 유형별 아이콘 및 색상 매핑 정의
export const PROPERTY_TYPE_STYLES = {
  "아파트": {icon: "🏢", color: "#3F51B5"}, // 파란색
  "오피스텔": {icon: "🏬", color: "#673AB7"}, // 보라색
  "빌라": {icon: "🏘️", color: "#4CAF50"}, // 녹색
  "전원주택": {icon: "🏡", color: "#8BC34A"}, // 연두색
  "단독/다가구": {icon: "🏠", color: "#009688"}, // 청록색
  "상가주택": {icon: "🏪", color: "#FF5722"}, // 주황색
  "한옥주택": {icon: "🏯", color: "#795548"}, // 갈색
  "상가": {icon: "🏪", color: "#FF9800"}, // 주황색
  "사무실": {icon: "🏢", color: "#607D8B"}, // 회색
  // 기본값 (매물 유형이 없거나 매칭되지 않을 경우)
  "default": {icon: "📍", color: "#F44336"} // 빨간색
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

// 지도 정밀도 설정 (줌 레벨에 따른 정밀도)
export const PRECISION_BY_ZOOM = {
  LOW: {MAX_LEVEL: 3, PRECISION: 1},
  MEDIUM_LOW: {MAX_LEVEL: 5, PRECISION: 2},
  MEDIUM: {MAX_LEVEL: 7, PRECISION: 3},
  MEDIUM_HIGH: {MAX_LEVEL: 9, PRECISION: 4},
  HIGH: {MAX_LEVEL: 11, PRECISION: 5},
  VERY_HIGH: {MAX_LEVEL: 13, PRECISION: 6},
  ULTRA_HIGH: {MAX_LEVEL: 15, PRECISION: 7},
  MAX: {PRECISION: 8}
};
