import api from "./api"
import type { AxiosResponse } from "axios"
import type { ApiResponse } from "./customerApi"
import type { RegionResponse } from "../types/article"

export interface RegionParams {
    cortarNoPrefix?: string;
}

/**
 * 지역 정보 가져오기
 * @param params 파라미터
 * @returns API 응답
 */
export const getRegions = async (params?: RegionParams): Promise<AxiosResponse<ApiResponse<RegionResponse[]>>> => {
    let url = '/api/regions';
    
    // Handle request with prefix
    if (params?.cortarNoPrefix) {
        const cortarNoPrefix = params.cortarNoPrefix;
        url = `/api/regions/${cortarNoPrefix}`;
    }
    
    console.log(`지역 API 호출: ${url}`);
    return api.get(url);
}

/**
 * 특정 코드로 시작하는 하위 지역 코드 가져오기
 */
export const getChildRegions = async (cortarNoPrefix: string): Promise<AxiosResponse<ApiResponse<RegionResponse[]>>> => {
    return getRegions({ 
        cortarNoPrefix
    });
}

export const regionApi = {
    getRegions,
    getChildRegions
}