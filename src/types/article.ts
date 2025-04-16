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
    cortarNo: string;
    articleNo: string;
    name: string;
    buildingName?: string;
    realEstateType: RealEstateType;
    tradeType: TradeType;
    price: string;
    rentPrice: number;
    confirmedAt: string;
    latitude: number;
    longitude: number;
    imageUrl: string;
    direction: string;
    tags: string[];
    subwayInfo: string;
    companyId: string;
    companyName: string;
    agentName: string;
    cortarName: string;
    roadAddressName: string;
    lotAddressName: string;
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