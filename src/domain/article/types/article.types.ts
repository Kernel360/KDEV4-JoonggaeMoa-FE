export interface BoundingBox {
  swLat: number;
  neLat: number;
  swLng: number;
  neLng: number;
}

export interface Region {
  cortarNo: string;
  cortarName: string;
  cortarType: string;
  centerLat: number;
  centerLon: number;
}

export interface Marker {
  id: number;
  geoJson: string; // GeoJSON Point string e.g. "{\"type\":\"Point\",\"coordinates\":[127.001,37.001]}"
  title?: string; // 매물 제목
  address?: string; // 매물 주소
  price?: number; // 매물 가격
  tradeType?: string; // 거래 유형
  buildingType?: string; // 건물 유형
}

export interface Cluster {
  geoJson: string; // GeoJSON Point string for cluster center
  count: number;
}

export interface Complex {
  id: number;
  complexName: string;
  buildingType: string; 
  confirmedAt: string; // LocalDate string e.g., "2023-10-26"
}

// Article.java 와 ArticleResponse.java 를 참고하여 필터링에 필요한 주요 타입들을 미리 정의합니다.
// 실제 백엔드 응답에 따라 구체적인 문자열 리터럴 유니온 타입으로 변경할 수 있습니다.
export type BuildingType =
  | 'APT' // 아파트 (A01) - 예시, 실제 값 확인 필요
  | 'OFFICETEL' // 오피스텔 (A02) - 예시
  | 'VILLA' // 빌라/연립 (A03) - 예시
  | 'HOUSE' // 단독/다가구 (A04) - 예시
  | 'RETAIL' // 상가/점포 (B01) - 예시
  | 'OFFICE' // 사무실 (B02) - 예시
  | string; // 기타 유형을 위해 string 허용

export type TradeType =
  | 'SALE' // 매매
  | 'LEASE' // 전세
  | 'RENT' // 월세
  | string; // 기타 유형

// 매물 유형 상수 (src_old/types/article.ts 참고)
export const REAL_ESTATE_OPTIONS: Array<{label: string, value: BuildingType, color?: string}> = [
  { label: "아파트", value: "APT" },
  { label: "오피스텔", value: "OFFICETEL" },
  { label: "빌라/연립", value: "VILLA" },
  { label: "단독/다가구", value: "HOUSE" },
  { label: "상가/점포", value: "RETAIL" },
  { label: "사무실", value: "OFFICE" },
];

// 거래 유형 상수 (src_old/types/article.ts 참고)
export const TRADE_TYPE_OPTIONS: Array<{label: string, value: TradeType}> = [
  { label: "매매", value: "SALE" },
  { label: "전세", value: "LEASE" },
  { label: "월세", value: "RENT" },
];

export interface Article {
  id: number;
  articleCode?: string; // atclNo 매물번호
  bjdCode?: string; // cortarNo 법정동코드
  articleName?: string; // atclNm 매물이름
  buildingTypeCode?: string; // rletTpCd 매물유형코드
  buildingType: BuildingType; // rletTpNm 매물유형명
  tradeType: TradeType; // tradTpNm 거래유형
  floors?: string; // flrInfo 매물층수/건물층수
  priceSale?: number; // prc 매매가/보증금
  priceRent?: number; // rentPrc 월세
  areaSupply?: string; // spc1 공급면적 (단위: 제곱미터)
  areaExclusive?: string; // spc2 전용면적 (단위: 제곱미터)
  direction?: string; // direction 방향
  confirmedAt?: string; // atclCfmYmd 건물 사용승인일 (LocalDate string)
  imageUrl?: string; // repImgUrl 대표 이미지 URL
  latitude: number; // lat 위도
  longitude: number; // lng 경도
  articleDesc?: string; // articleDesc 매물 특징 설명
  companyName?: string; // cpNm 정보 제공 출처
  agency?: string; // rltrNm 매물을 올린 공인중개사무소
  subway?: string; // sbwyInfo 주변 지하철역
  isChecked?: boolean; // tradeCheckedByOwner 실매물 확인 여부
  addressFullLot?: string;
  addressFullRoad?: string;
  address1SiDo?: string;
  address2SiGunGu?: string;
  address3DongEupMyeon?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: any | null;
}

export interface RegionPolygon {
  regionId: string;
  regionName: string;
  regionType: 'SIDO' | 'SIGUNGU' | 'DONG'; // 시도, 시군구, 동 레벨
  multiPolygon: number[][][][]; // GeoJSON multipolygon coordinates
  centerLat: number;
  centerLng: number;
  count?: number; // 해당 지역 매물 개수
}

export interface RegionPolygonApiResponse extends ApiResponse<RegionPolygon[]> {
  success: boolean;
  data: RegionPolygon[];
  error: any | null;
}

export interface MarkerApiResponse extends ApiResponse<Marker[]> {
  success: boolean;
  data: Marker[];
  error: any | null;
}

export interface ClusterApiResponse extends ApiResponse<Cluster[]> {
  success: boolean;
  data: Cluster[];
  error: any | null;
} 