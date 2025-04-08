import api from "./api";
import type { RealEstateTypeSummaryResponse, TradeTypeSummaryResponse } from "../types/dashboard";

// 대시보드 API 서비스
export const dashboardApi = {
    // 부동산 유형 요약 데이터 가져오기
    getRealEstateTypeSummary: async (period: string) => {
        return api.get<{ success: boolean; data: RealEstateTypeSummaryResponse[]; error?: { message: string } }>(
            `/api/dashboard/real-estate-type-summary?period=${period}`
        );
    },
    
    // 거래 유형 요약 데이터 가져오기
    getTradeTypeSummary: async (period: string) => {
        return api.get<{ success: boolean; data: TradeTypeSummaryResponse[]; error?: { message: string } }>(
            `/api/dashboard/trade-type-summary?period=${period}`
        );
    }
}; 