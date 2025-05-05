import api from "./api"
import type { AxiosResponse } from "axios"
import type { ApiResponse, ArticleResponse, ArticleListParams, ArticleListResponse, ComplexResponse, ArticleApiResponse } from "../types/article"
import type { ClusterInfo } from "../types/article";
import qs from "qs"
import { generateClusterId, calculatePrecisionByZoom } from "../utils/clusterUtils";

// 모든 매물 조회 (페이지네이션)
export const getAllArticles = async (
    params: ArticleListParams & {
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
    } = {}
): Promise<AxiosResponse<any>> => {
    try {
        return await api.get('/api/articles', {
            params,
            paramsSerializer: params => {
                return qs.stringify(params, { arrayFormat: 'repeat' })
            }
        });
    } catch (error) {
        console.error("매물 목록 조회 실패:", error);
        throw error;
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
  }
): Promise<AxiosResponse<ClusterInfo[]>> => {
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
    
    const response = await api.get('/api/clusters', { params });
    console.log("getClusters API response:", response);
    
    // 응답 데이터가 배열인지 확인
    if (!Array.isArray(response.data)) {
      // 성공 응답이지만 data 필드에 배열이 있는 경우
      if (response.data && typeof response.data === 'object' && response.data.success === true) {
        if (Array.isArray(response.data.data)) {
          response.data = response.data.data;
        } else {
          response.data = [];
        }
      } else {
        console.warn("getClusters API did not return array data:", response.data);
        response.data = [];
      }
    }
    
    return response;
  } catch (error) {
    console.error("getClusters API error:", error);
    // 빈 배열 반환으로 폴백
    return { data: [], status: 500, statusText: "Error", headers: {}, config: {} as any };
  }
}

/**
 * 클러스터 내 매물 조회 (좌표 그룹 기반)
 * 클러스터 ID는 "latGroup,lngGroup" 형식의 좌표 그룹 ID를 사용
 * latGroup과 lngGroup은 lat와 lng 좌표값에 precision의 10의 거듭제곱을 곱한 후 정수부만 사용
 */
export const getArticlesByCluster = async (
  params: {
    clusterId: string; // 좌표 그룹 ID (format: "latGroup,lngGroup")
    precision: number; // 클러스터 정밀도
    page?: number; // 페이지 번호
    size?: number; // 페이지 크기
  }
): Promise<AxiosResponse<ArticleApiResponse>> => {
  console.log("getArticlesByCluster API 호출:", params);
  try {
    // 파라미터 검증
    if (!params.clusterId || params.precision === undefined) {
      throw new Error("클러스터 ID 또는 정밀도가 지정되지 않았습니다");
    }
    
    // clusterId 형식 검증 (latGroup,lngGroup)
    if (!params.clusterId.includes(',')) {
      throw new Error("잘못된 클러스터 ID 형식입니다. 'latGroup,lngGroup' 형식이어야 합니다.");
    }
    
    // 요청 발송
    const response = await api.get('/api/articles/by-cluster', { params });
    console.log("getArticlesByCluster API 응답:", response);
    
    // 응답 데이터 검증
    if (!response.data) {
      throw new Error("API 응답 데이터가 없습니다");
    }
    
    return response;
  } catch (error) {
    console.error("getArticlesByCluster API 오류:", error);
    throw error;
  }
}

/**
 * 좌표를 기반으로 클러스터 내 매물 조회
 * (내부적으로 좌표를 clusterId로 변환하여 getArticlesByCluster 호출)
 */
export const getArticlesByCoordinates = async (
  params: {
    lat: number; // 위도
    lng: number; // 경도
    precision: number; // 클러스터 정밀도
    page?: number; // 페이지 번호
    size?: number; // 페이지 크기
  }
): Promise<AxiosResponse<ArticleApiResponse>> => {
  // 좌표로부터 클러스터 ID 생성
  const clusterId = generateClusterId(params.lat, params.lng, params.precision);
  
  // getArticlesByCluster 호출
  return getArticlesByCluster({
    clusterId,
    precision: params.precision,
    page: params.page,
    size: params.size
  });
}

export const getArticleById = async (id: number): Promise<AxiosResponse<ApiResponse<ArticleResponse>>> => {
    try {
        return await api.get(`/api/articles/${id}`);
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
                return qs.stringify(params, { arrayFormat: 'repeat' })
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