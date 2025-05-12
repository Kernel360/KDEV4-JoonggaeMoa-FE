import { useCallback } from 'react';

import { MapBounds } from './useMapView';
import { articleApi } from '../services/articleApi';
import { ArticleResponse, ClusterInfo, ComplexResponse } from '../types/article';

export interface ApiFilters {
  typeFilter: any[];
  tradeTypeFilter: any[];
  minSalePrice: number;
  maxSalePrice: number;
  minRentPrice: number;
  maxRentPrice: number;
  sortField: string;
  sortOrder: string;
  selectedCity: string;
  selectedDistrict: string;
  selectedNeighborhood: string[];
  cityOptions: any[];
  districtOptions: any[];
  neighborhoodOptions: any[];
  isRegionFiltered: boolean;
  mapZoom: number;
  mapBoundListZoomLevel: number;
}

export function useArticleApi() {
  // 매물 목록 API 호출
  const fetchArticleList = useCallback(async (
    pageToFetch: number,
    bounds: MapBounds,
    filters: ApiFilters,
    showMapBoundList: boolean,
    pageSize: number
  ) => {
    try {
      const params: any = {
        size: showMapBoundList ? 100000 : pageSize,
        sortBy: filters.sortField,
        direction: filters.sortOrder,
        sort: `${filters.sortField},${filters.sortOrder}`,
        fields: "id,latitude,longitude,title,description,price,priceRent,priceSale,tradeType,realEstateType,address,imageUrls,thumbnail,confirmedAt,complexId"
      };

      if (!showMapBoundList) {
        params.page = pageToFetch;
      }

      // 매물 유형 필터 적용
      if (filters.typeFilter && filters.typeFilter.length > 0) {
        params.realEstateType = filters.typeFilter;
        params.buildingType = filters.typeFilter;
      }

      // 거래 유형 필터 적용
      if (filters.tradeTypeFilter && filters.tradeTypeFilter.length > 0) {
        params.tradeType = filters.tradeTypeFilter;
        params.trade_type = filters.tradeTypeFilter;
      }

      // 가격 필터 적용
      if (filters.minSalePrice > 0) {
        params.minSalePrice = filters.minSalePrice;
        params.min_price_sale = filters.minSalePrice;
      }

      if (filters.maxSalePrice > 0) {
        params.maxSalePrice = filters.maxSalePrice;
        params.max_price_sale = filters.maxSalePrice;
      }

      if (filters.minRentPrice > 0) {
        params.minRentPrice = filters.minRentPrice;
        params.min_price_rent = filters.minRentPrice;
      }

      if (filters.maxRentPrice > 0) {
        params.maxRentPrice = filters.maxRentPrice;
        params.max_price_rent = filters.maxRentPrice;
      }

      // 지역 필터 적용
      let regionFilterApplied = false;
      if (filters.selectedNeighborhood.length > 0) {
        const neighborhood = filters.neighborhoodOptions.find(r => r.cortarName === filters.selectedNeighborhood[0]);
        if (neighborhood?.cortarNo) {
          params.regionPrefix = neighborhood.cortarNo;
          regionFilterApplied = true;
        }
      } else if (filters.selectedDistrict) {
        const district = filters.districtOptions.find(r => r.cortarName === filters.selectedDistrict);
        if (district?.cortarNo) {
          params.regionPrefix = district.cortarNo.substring(0, 5);
          regionFilterApplied = true;
        }
      } else if (filters.selectedCity) {
        const city = filters.cityOptions.find(r => r.cortarName === filters.selectedCity);
        if (city?.cortarNo) {
          params.regionPrefix = city.cortarNo.substring(0, 2);
          regionFilterApplied = true;
        }
      }

      // 바운드 적용
      params.neLat = bounds.ne.lat;
      params.neLng = bounds.ne.lng;
      params.swLat = bounds.sw.lat;
      params.swLng = bounds.sw.lng;

      // 검색 타입 결정 (bounds, region, default)
      if (regionFilterApplied && params.regionPrefix) {
        params.type = 'region';
      } else if (bounds.ne.lat && bounds.ne.lng && bounds.sw.lat && bounds.sw.lng) {
        params.type = 'bounds';
      } else {
        params.type = 'default';
      }

      // 추가 필터 있을 경우 default 타입으로 설정
      const hasAdditionalFilters = (
        (filters.typeFilter && filters.typeFilter.length > 0) ||
        (filters.tradeTypeFilter && filters.tradeTypeFilter.length > 0) ||
        filters.minSalePrice > 0 ||
        filters.maxSalePrice > 0 ||
        filters.minRentPrice > 0 ||
        filters.maxRentPrice > 0
      );

      if (hasAdditionalFilters && (params.type === 'bounds' || params.type === 'region')) {
        params.type = 'default';
      }

      const response = await articleApi.getAllArticles(params);
      let articles: ArticleResponse[] = [];
      let links: any = {};
      let pageInfo: any = {};
      
      // 응답 데이터 처리
      const raw = response.data as any;

      // Spring HATEOAS 응답 구조 처리
      if (raw._embedded) {
        const embedded = raw._embedded;
        
        if (embedded.articles) {
          articles = embedded.articles;
        } else if (embedded.articleResponseList) {
          articles = embedded.articleResponseList;
        } else if (embedded.content) {
          articles = embedded.content;
        } else {
          const firstKey = Object.keys(embedded)[0];
          if (firstKey && Array.isArray(embedded[firstKey])) {
            articles = embedded[firstKey];
          }
        }
        
        links = raw._links || {};
        
        if (raw.page) {
          pageInfo = {
            totalElements: raw.page.totalElements,
            totalPages: raw.page.totalPages,
            number: raw.page.number,
            size: raw.page.size,
            last: raw.page.last
          };
        }
      } 
      // 표준 Spring Data 페이징 구조 처리
      else if (raw.content && Array.isArray(raw.content)) {
        articles = raw.content;
        pageInfo = {
          totalElements: raw.totalElements,
          totalPages: raw.totalPages,
          number: raw.number,
          last: raw.last
        };
      } 
      // 기존 API 응답 구조 처리
      else if (raw.data && Array.isArray(raw.data)) {
        articles = raw.data;
      } else if (Array.isArray(raw)) {
        articles = raw;
      }
      
      // 데이터가 너무 많은 경우 제한
      articles = articles.slice(0, 100000);
      
      return {
        articles,
        pageInfo,
        links,
        hasMore: !!links.next || (pageInfo.last !== undefined && !pageInfo.last)
      };
    } catch (error) {
      console.error("Error fetching articles:", error);
      throw error;
    }
  }, []);

  // 클러스터 API 호출
  const fetchClusters = useCallback(async (bounds: MapBounds, zoom: number) => {
    try {
      // 줌 레벨에 따른 적절한 정밀도 계산
      const precision = calculatePrecisionByZoom(zoom);

      // API 호출 파라미터 준비
      const params = {
        swLat: bounds.sw.lat,
        swLng: bounds.sw.lng,
        neLat: bounds.ne.lat,
        neLng: bounds.ne.lng,
        precision,
        zoomLevel: zoom,
        clusterRadius: zoom <= 3 ? 100 : zoom <= 4 ? 80 : zoom <= 5 ? 60 : 40,
        minPoints: zoom <= 3 ? 1 : zoom <= 4 ? 2 : zoom <= 5 ? 2 : 3
      };

      const resp = await articleApi.getClusters(params);
      
      // 응답 처리
      let clusterData: ClusterInfo[] = [];
      const responseData = resp.data as any;

      // HATEOAS _embedded 필드 처리
      if (responseData && responseData._embedded) {
        const embedded = responseData._embedded;
        
        if (embedded.clusterRequests) {
          clusterData = embedded.clusterRequests;
        } else if (embedded.clusters) {
          clusterData = embedded.clusters;
        } else {
          const firstKey = Object.keys(embedded)[0];
          if (firstKey && Array.isArray(embedded[firstKey])) {
            clusterData = embedded[firstKey];
          }
        }
      }
      // 기존 API 응답 구조 처리
      else if (responseData && responseData.data && Array.isArray(responseData.data)) {
        clusterData = responseData.data;
      } else if (Array.isArray(responseData)) {
        clusterData = responseData;
      }

      if (!Array.isArray(clusterData)) {
        throw new Error("유효하지 않은 클러스터 데이터");
      }

      return clusterData;
    } catch (error) {
      console.error("Error fetching clusters:", error);
      throw error;
    }
  }, []);

  // 클러스터 내 매물 조회
  const fetchArticlesByCluster = useCallback(async (
    clusterId: string, 
    precision: number,
    page: number = 0,
    size: number = 20
  ) => {
    try {
      const response = await articleApi.getArticlesByCluster({
        clusterId,
        precision,
        page,
        size
      });
      
      if (!response.data) {
        throw new Error("API 응답 데이터가 없습니다");
      }
      
      let articles: ArticleResponse[] = [];
      const responseData = response.data as any;
      let hasNextPage = false;

      // HATEOAS _embedded 필드 처리
      if (responseData._embedded) {
        const embedded = responseData._embedded;
        
        if (embedded.articles) {
          articles = embedded.articles;
        } else if (embedded.articleResponseList) {
          articles = embedded.articleResponseList;
        } else {
          const firstKey = Object.keys(embedded)[0];
          if (firstKey && Array.isArray(embedded[firstKey])) {
            articles = embedded[firstKey];
          }
        }
        
        // 다음 페이지 존재 여부 확인
        if (responseData._links && responseData._links.next) {
          hasNextPage = true;
        }
        
        if (responseData.page) {
          hasNextPage = !responseData.page.last;
        }
      }
      // 표준 Spring Data 페이징 구조 처리
      else if (responseData.content && Array.isArray(responseData.content)) {
        articles = responseData.content;
        hasNextPage = !responseData.last;
      }
      // 기존 API 응답 구조 처리
      else if (responseData.data && Array.isArray(responseData.data)) {
        articles = responseData.data;
      } else if (Array.isArray(responseData)) {
        articles = responseData;
      }
      
      return { articles, hasNextPage };
    } catch (error) {
      console.error("Error fetching articles by cluster:", error);
      throw error;
    }
  }, []);

  // 단지 정보 조회
  const fetchComplex = useCallback(async (complexId: number) => {
    try {
      const response = await articleApi.getComplex(complexId);
      return response.data?.data as ComplexResponse;
    } catch (error) {
      console.error("Error fetching complex:", error);
      return null;
    }
  }, []);

  return {
    fetchArticleList,
    fetchClusters,
    fetchArticlesByCluster,
    fetchComplex
  };
}

// Utility function to calculate precision by zoom
function calculatePrecisionByZoom(zoom: number): number {
  if (zoom <= 3) return 2;
  if (zoom <= 5) return 3;
  if (zoom <= 7) return 4;
  if (zoom <= 9) return 5;
  if (zoom <= 11) return 6;
  if (zoom <= 13) return 7;
  return 8;
}
