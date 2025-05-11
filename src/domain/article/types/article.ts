// 매물 응답 타입
import { REAL_ESTATE_OPTIONS, TRADE_TYPE_OPTIONS } from '../constants/articleConstants';

export type RealEstateType =
    | "아파트"
    | "오피스텔"
    | "빌라"
    | "전원주택"
    | "단독/다가구"
    | "상가주택"
    | "한옥주택"
    | "상가"
    | "사무실";

export type TradeType = "매매" | "전세" | "월세";

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
    complexResponse?: ComplexResponse;
    articleType: string;
    cortarName?: string;
    buildingName?: string;
    district?: string;
    town?: string;
    atclFetrDesc?: string;
}

export interface ComplexResponse {
    id: number;
    complexCode: string;
    complexName: string;
    countDong: number;
    countHousehold: number;
    confirmedAt: string;
    countDeal: number;
    countLease: number;
    countRent: number;
    countRentShortTerm: number;
    countArticles: number;
    sizeMin: string;
    sizeMax: string;
    priceSaleInitialMin: number;
    priceSaleInitialMax: number;
    tourExists: boolean;
    isSeismic: boolean;
    countElevator: number;
    regionId?: number;
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
    type?: 'bounds' | 'region' | 'default';
    realEstateType?: RealEstateType[];
    tradeType?: TradeType[];
    name?: string;
    cortarNo?: string;
    cortarName?: string;
    minPrice?: number;
    maxPrice?: number;
}

export interface Tag {
    id: number;
    name: string;
}

export interface ClusterInfo {
    lat: number;
    lng: number;
    count: number;
    precision?: number;
    weight?: number;
    radius?: number;
    color?: string;
    isMerged?: boolean;
    mainRealEstateType?: RealEstateType;
    typeDistribution?: Record<string, number>;
}

// API 응답 타입 확장
export interface ApiSuccess<T> {
    success: true;
    data: T;
    error: null;
}

export interface ApiError {
    success: false;
    data: null;
    error: {
        code: number;
        message: string;
    };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// HATEOAS 응답 형식
export interface HateoasResponse<T> {
    _embedded: {
        articles?: T[];
        articleResponseList?: T[];
    };
    _links?: Record<string, any>;
    page?: any;
}

// 페이지 객체 응답 형식
export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    last: boolean;
}

// 다양한 API 응답 형식
export type ArticleApiResponse =
    | ApiResponse<ArticleResponse[]>
    | ApiResponse<PageResponse<ArticleResponse>>
    | HateoasResponse<ArticleResponse>
    | PageResponse<ArticleResponse>
    | ArticleResponse[];