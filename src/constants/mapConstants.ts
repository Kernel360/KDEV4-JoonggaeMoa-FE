// 역삼동 826-21 기준 좌표
export const YEOKSAM_CENTER = {
    lat: 37.4969664,
    lng: 127.0323278
};

// 강남구 일대를 보여주기 위한 기본 경계
export const DEFAULT_MAP_BOUNDS = {
    ne: { lat: 37.5170664, lng: 127.0523278 }, // 역삼동 중심에서 북동쪽
    sw: { lat: 37.4769664, lng: 127.0123278 }  // 역삼동 중심에서 남서쪽
};

// 지도 줌 레벨 설정
export const MAP_ZOOM_LEVELS = {
    DEFAULT: 5,           // 강남구 전체 보기에 적합
    CLUSTER: 6,           // 클러스터 표시 기준 (6 이상일 때 클러스터링)
    MIN_FETCH: 4,         // 데이터 fetching 최소 줌 레벨
    MAP_BOUND_LIST: 8     // 지도 영역 기준 목록 표시 줌 레벨
} as const; 