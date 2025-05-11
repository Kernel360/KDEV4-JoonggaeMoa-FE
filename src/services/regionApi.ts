import api from "./api"
import type {AxiosResponse} from "axios"
import type {ApiResponse} from "./customerApi"
import type {RegionResponse} from "../types/article"

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

/**
 * 행정구역 경계 데이터(GeoJSON) 가져오기
 * @param type 행정구역 타입 ('dong' 또는 'gu')
 * @returns 행정구역 경계 데이터
 */
export const getRegionBoundaries = async (type: 'dong' | 'gu'): Promise<any> => {
    // 실제 API 연결 시 아래 주석 해제
    // return api.get(`/api/region-boundaries/${type}`);

    // 임시로 외부 데이터 사용 (프로덕션에서는 자체 API 사용 권장)
    const url = type === 'dong'
        ? 'https://raw.githubusercontent.com/vuski/admdongkor/master/ver20230101/HangJeongDong_ver20230101.geojson'
        : 'https://raw.githubusercontent.com/southkorea/seoul-maps/master/kostat/2013/json/seoul_municipalities_geo.json';

    console.log(`행정구역 경계 데이터 API 호출: ${url}`);
    const response = await fetch(url);
    return response.json();
}

export const regionApi = {
    getRegions,
    getChildRegions,
    getRegionBoundaries
}