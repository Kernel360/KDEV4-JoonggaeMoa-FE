import api from "./api"
import type { ApiResponse } from "../types/api"

export interface RegionResponse {
    id: number
    cortarNo: string
    centerLat: number
    centerLon: number
    cortarName: string
    cortarType: string
    areaFull?: string
}

export const regionApi = {
    getChildRegions: async (cortarNoPrefix: string) => {
        // 법정동코드 prefix가 없으면 기본 엔드포인트, 있으면 prefix 엔드포인트 사용
        let url = '/api/regions';
        
        // prefix가 유효한 경우에만 URL에 포함
        if (cortarNoPrefix && cortarNoPrefix.trim() !== '') {
            url = `/api/regions/${cortarNoPrefix}`;
        }
        
        try {
            const response = await api.get<ApiResponse<RegionResponse[]>>(url);
            console.log(`지역 API 호출: ${url}, 결과: ${response.data.data.length}개 항목`);
            return response;
        } catch (error) {
            console.error(`지역 API 호출 실패: ${url}`, error);
            throw error;
        }
    }
}