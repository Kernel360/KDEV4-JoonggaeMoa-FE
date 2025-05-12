import type { AxiosResponse } from "axios";
import qs from "qs";

import { calculatePrecisionByZoom, generateClusterId } from "@/domain/article/map/utils/clusterUtils";
import type {
    ApiResponse,
    ArticleClusterResponse,
    ArticleListParams,
    ArticleListResponse,
    ArticleResponse,
    ClusterInfo,
    ComplexResponse,
    ExtendedApiResponse
} from "@/domain/article/types/article";
import api from "@/global/api/services/api";

// HATEOAS 응답을 처리하는 유틸리티 함수
const extractHateoasData = <T>(response: any): T[] => {
    if (!response) return [];
    
    // HATEOAS _embedded 형식 처리
    if (response._embedded) {
        // 가능한 모든 필드 확인
        const possibleFields = ['articles', 'articleResponseList', 'articleResponses', 'content', 'clusters'];
        for (const field of possibleFields) {
            if (response._embedded[field] && Array.isArray(response._embedded[field])) {
                return response._embedded[field];
            }
        }
    }
    
    // Page 형식 처리
    if (response.content && Array.isArray(response.content)) {
        return response.content;
    }
    
    // 기본 배열 처리
    if (Array.isArray(response)) {
        return response;
    }
    
    // 데이터 필드 확인
    if (response.data) {
        if (Array.isArray(response.data)) {
            return response.data;
        }
        
        // 페이지 응답 처리
        if (response.data.content && Array.isArray(response.data.content)) {
            return response.data.content;
        }
    }
    
    // 기타 응답 형식 처리
    if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [response.data];
    }
    
    return [];
};

// 페이지 정보 추출 유틸리티 함수
const extractPageInfo = (response: any) => {
    // HATEOAS 페이지 정보
    if (response.page) {
        return {
            totalElements: response.page.totalElements,
            totalPages: response.page.totalPages,
            number: response.page.number,
            size: response.page.size,
            last: response.page.last,
        };
    }
    
    // Page 형식
    if (response.totalElements !== undefined) {
        return {
            totalElements: response.totalElements,
            totalPages: response.totalPages,
            number: response.number,
            size: response.size,
            last: response.last,
        };
    }
    
    // ApiResponse + Page 형식
    if (response.data && response.data.totalElements !== undefined) {
        return {
            totalElements: response.data.totalElements,
            totalPages: response.data.totalPages,
            number: response.data.number,
            size: response.data.size,
            last: response.data.last,
        };
    }
    
    return null;
};

// 모든 매물 조회 (페이지네이션)
export const getAllArticles = async (
    params: ArticleListParams & {
        type?: 'bounds' | 'region' | 'default';
        sortBy?: string;
        direction?: 'asc' | 'desc';
        realEstateType?: string[];
        tradeType?: string[];
        minPrice?: string;
        maxPrice?: string;
        regionPrefix?: string;
        neLat?: number;
        neLng?: number;
        swLat?: number;
        swLng?: number;
        includeComplex?: boolean; // 단지 정보 포함 여부
    } = {}
): Promise<ExtendedApiResponse<any>> => {
    try {
        // 기본적으로 단지 정보 포함
        const requestParams = {
            ...params,
            includeComplex: params.includeComplex !== false // 명시적으로 false로 지정하지 않으면 단지 정보 포함
        };

        const response = await api.get('/api/articles', {
            params: requestParams,
            paramsSerializer: params => {
                return qs.stringify(params, {arrayFormat: 'repeat'})
            }
        });
        
        // HATEOAS 데이터 추출
        const articles = extractHateoasData<ArticleResponse>(response.data);
        const pageInfo = extractPageInfo(response.data);
        
        // 링크 정보 추출 (HATEOAS)
        const links = response.data._links || {};
        
        return {
            data: {
                content: articles,
                totalElements: pageInfo?.totalElements || articles.length,
                totalPages: pageInfo?.totalPages || 1,
                size: pageInfo?.size || params.size,
                number: pageInfo?.number || params.page,
                last: pageInfo?.last || true
            },
            _links: links,
            page: pageInfo,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            config: response.config
        };
    } catch (error) {
        console.error("매물 목록 조회 실패:", error);
        return { 
            data: [],
            status: 500,
            statusText: "Error",
            headers: {},
            config: {} as any
        };
    }
}

/**
 * 화면 영역 내 클러스터 요약 조회
 */
export const getClusters = async (
    params: {
        swLat: number;
        swLng: number;
        neLat: number;
        neLng: number;
        precision?: number; // 클러스터링 정밀도 (높을수록 세분화, 줌레벨에 반비례)
        clusterRadius?: number; // 클러스터 반경 (미터)
        minPoints?: number; // 클러스터 형성에 필요한 최소 포인트 수
        zoomLevel?: number; // 줌 레벨 추가
    }
): Promise<ExtendedApiResponse<ClusterInfo[]>> => {
    console.log("getClusters API called with params:", params);
    try {
        // 파라미터 유효성 검사
        if (!params.swLat || !params.swLng || !params.neLat || !params.neLng) {
            throw new Error("Invalid parameters for getClusters");
        }

        // 정밀도가 없는 경우 기본값 설정
        if (!params.precision) {
            params.precision = 5;
        }

        // 줌 레벨 기반 자동 precision 계산 추가
        if (params.zoomLevel !== undefined && (!params.precision || params.precision <= 0)) {
            params.precision = calculatePrecisionByZoom(params.zoomLevel);
        }

        const response = await api.get('/api/clusters', {params});
        console.log("getClusters API response:", response);

        // HATEOAS 응답 처리
        const clusters = extractHateoasData<ClusterInfo>(response.data);
        
        // 클러스터 데이터 검증 및 가공
        const processedClusters = clusters.map(cluster => ({
            ...cluster,
            // 클러스터 ID 자동 생성
            clusterId: generateClusterId(cluster.lat, cluster.lng, params.precision),
            // 정밀도 정보 추가
            precision: params.precision
        }));

        return {
            data: processedClusters,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            config: response.config
        };
    } catch (error) {
        console.error("getClusters API error:", error);
        // 빈 배열 반환으로 폴백
        return {
            data: [],
            status: 500,
            statusText: "Error",
            headers: {},
            config: {} as any
        };
    }
}

/**
 * 클러스터 내 매물 조회 (좌표 그룹 기반)
 * 클러스터 ID는 "latGroup,lngGroup" 형식의 좌표 그룹 ID를 사용
 * latGroup과 lngGroup은 lat와 lng 좌표값에 precision의 10의 거듭제곱을 곱한 후 정수부만 사용
 */
export const getArticlesByCluster = async (params: {
  clusterId: string;
  precision: number;
  page: number;
  size: number;
}): Promise<ArticleClusterResponse> => {
  try {
    console.log("getArticlesByCluster API 요청:", params);
    const response = await api.get('/api/articles/by-cluster', { params });
    console.log("getArticlesByCluster API 응답:", response);

    // HATEOAS 응답 처리
    const articles = extractHateoasData<ArticleResponse>(response.data);
    const pageInfo = extractPageInfo(response.data);
    
    return {
      data: {
        content: articles,
        totalElements: pageInfo?.totalElements || articles.length,
        totalPages: pageInfo?.totalPages || 1,
        size: pageInfo?.size || params.size,
        number: pageInfo?.number || params.page,
        last: pageInfo?.last || true
      },
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      config: response.config
    };
  } catch (error) {
    console.error("getArticlesByCluster API 오류:", error);
    return { 
      data: { content: [] }, 
      success: false, 
      error: { message: '클러스터 매물을 가져오는데 실패했습니다.' },
      status: 500,
      statusText: "Error",
      headers: {},
      config: {} as any
    };
  }
}

/**
 * 좌표를 기반으로 클러스터 내 매물 조회
 * (내부적으로 좌표를 clusterId로 변환하여 getArticlesByCluster 호출)
 */
export const getArticlesByCoordinates = async (
    params: {
        lat: number;
        lng: number;
        precision: number;
        page?: number;
        size?: number;
    }
): Promise<ArticleClusterResponse> => {
    // 좌표로부터 클러스터 ID 생성
    const clusterId = generateClusterId(params.lat, params.lng, params.precision);

    // getArticlesByCluster 호출
    return getArticlesByCluster({
        clusterId,
        precision: params.precision,
        page: params.page ?? 0,
        size: params.size ?? 20
    });
}

export const getArticleById = async (id: number): Promise<AxiosResponse<ApiResponse<ArticleResponse>>> => {
    try {
        // 단지 정보를 포함한 응답을 요청하기 위해 includeComplex 파라미터를 추가
        return await api.get(`/api/articles/${id}`, {
            params: {
                includeComplex: true
            }
        });
    } catch (error) {
        console.error(`매물 ID: ${id} 조회 실패:`, error);
        throw error;
    }
}

export const searchArticles = async (
    params: ArticleListParams & {
        sortBy?: string;
        direction?: 'asc' | 'desc';
    }
): Promise<AxiosResponse<ApiResponse<ArticleListResponse>>> => {
    try {
        return await api.get('/api/articles/search', {
            params,
            paramsSerializer: params => {
                return qs.stringify(params, {arrayFormat: 'repeat'})
            }
        });
    } catch (error) {
        console.error("매물 검색 실패:", error);
        throw error;
    }
}

export const getComplex = async (id: number): Promise<AxiosResponse<ApiResponse<ComplexResponse>>> => {
    try {
        return await api.get(`/api/complexes/${id}`);
    } catch (error) {
        console.error(`단지 ID: ${id} 조회 실패:`, error);
        throw error;
    }
}

// Export the API object
export const articleApi = {
    getAllArticles,
    getClusters,
    getArticleById,
    searchArticles,
    getComplex,
    getArticlesByCluster,
    getArticlesByCoordinates,
}