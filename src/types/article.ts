// 매물 응답 타입
export type RealEstateType = 
    | "아파트"
    | "오피스텔"
    | "빌라"
    | "아파트분양권"
    | "오피스텔분양권"
    | "재건축"
    | "전원주택"
    | "단독/다가구"
    | "상가주택"
    | "한옥주택"
    | "재개발"
    | "원룸"
    | "고시원"
    | "상가"
    | "사무실"
    | "공장/창고"
    | "건물"
    | "토지"
    | "지식산업센터";

export type TradeType = "매매" | "전세" | "월세" | "단기임대";

export interface ArticleResponse {
    id: number;
    articleCode: string;
    bjdCode: string;
    articleName: string;
    buildingTypeCode: string;
    buildingType: string;
    tradeType: string;
    floors: string;
    priceSale: number;
    priceRent: number;
    areaSupply: string;
    areaExclusive: string;
    direction: string;
    confirmedAt: string;
    imageUrl: string;
    latitude: number;
    longitude: number;
    articleDesc: string;
    companyName: string;
    agency: string;
    subway: string;
    isChecked: boolean;
    addressFullLot: string;
    addressFullRoad: string;
    address1SiDo: string;
    address2SiGunGu: string;
    address3DongEupMyeon: string;
    complexId?: number;
}

export interface ComplexResponse {
    id: number;
    name: string;
    type: string;
    approvedAt: string;
}

export interface RegionResponse {
    cortarNo: string;
    centerLat: number;
    centerLon: number;
    cortarName: string;
    cortarType: string;
}

export interface TradeTypeSummaryResponse {
    values: TradeTypeSummary[];
}

export interface TradeTypeSummary {
    type: string;
    ratio: number;
}

export interface RealEstateTypeSummaryResponse {
    values: RealEstateTypeSummary[];
}

export interface RealEstateTypeSummary {
    type: string;
    ratio: number;
}

export interface ArticleListResponse {
    content: ArticleResponse[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    last: boolean;
}

export interface ArticleListParams {
    page?: number;
    size?: number;
    sort?: string;
    excludeIds?: number[];
    realEstateType?: RealEstateType[];
    tradeType?: TradeType[];
    name?: string;
    cortarNo?: string;
    cortarName?: string;
    minPrice?: number;
    maxPrice?: number;
}

// 새로 추가할 Tag 타입
export interface Tag {
    id: number;
    name: string;
}