// 대시보드 관련 타입 정의

// 부동산 유형 비율
export interface RealEstateTypeSummaryResponse {
    values: RealEstateTypeSummary[];
}

export interface RealEstateTypeSummary {
    type: string;
    ratio: number;
}

// 거래 유형 비율
export interface TradeTypeSummaryResponse {
    values: TradeTypeSummary[];
}

export interface TradeTypeSummary {
    type: string;
    ratio: number;
}

export interface CustomerSummaryResponse {
    count: number;
    rate: number;
}

export interface ContractSummaryResponse {
    count: number;
    rate: number;
}

export interface ConsultationSummaryResponse {
    todayCount: number;
    remainingCount: number;
}