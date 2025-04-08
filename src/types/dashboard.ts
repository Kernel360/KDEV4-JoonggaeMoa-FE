// 대시보드 관련 타입 정의

// 부동산 유형 비율
export interface RealEstateTypeSummaryResponse {
    type: string;
    ratio: number;
}

// 거래 유형 비율
export interface TradeTypeSummaryResponse {
    type: string;
    ratio: number;
}