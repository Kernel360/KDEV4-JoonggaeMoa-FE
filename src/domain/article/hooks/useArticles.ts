import { useState, useCallback } from 'react';

import { MapBounds } from './useMapView';
import { generateClusterId } from '../map/utils/clusterUtils';
import { articleApi } from '../services/articleApi';
import { ArticleResponse, ClusterInfo } from '../types/article';
import { validateCoordinates } from '../utils/articleFormat';

interface ClusterDetailInfo {
  clusterId: string;
  precision: number;
  center: { lat: number; lng: number };
  articles: ArticleResponse[];
  allArticles?: ArticleResponse[];
  isEmpty?: boolean;
}

interface UseArticlesProps {
  pageSize: number;
}

export function useArticles({ pageSize }: UseArticlesProps) {
  const [allPaginatedArticles, setAllPaginatedArticles] = useState<ArticleResponse[]>([]);
  const [visibleMapArticles, setVisibleMapArticles] = useState<ArticleResponse[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMapBoundList, setShowMapBoundList] = useState(false);
  const [noMatchingArticles, setNoMatchingArticles] = useState(false);
  const [totalArticleCount, setTotalArticleCount] = useState(0);
  const [currentClusterInfo, setCurrentClusterInfo] = useState<ClusterDetailInfo | null>(null);
  const [noArticlesInCluster, setNoArticlesInCluster] = useState(false);

  // 매물 목록 API 호출 함수
  const fetchArticles = useCallback(async (
    pageToFetch: number,
    bounds: MapBounds,
    filters: any,
    loadMore = false
  ) => {
    if (!loadMore) {
      setLoading(true);
    }
    setNoMatchingArticles(false);
    setError(null);

    if (!bounds) {
      setLoading(false);
      return;
    }

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

    try {
      const response = await articleApi.getAllArticles(params);
      
      let fetchedArticles: ArticleResponse[] = [];
      let links: any = {};
      let pageInfo: any = {};

      // 응답 구조에 따라 데이터 추출
      const raw = response.data as any;

      // Spring HATEOAS 응답 구조 처리
      if (raw._embedded) {
        const embedded = raw._embedded;
        
        if (embedded.articles) {
          fetchedArticles = embedded.articles;
        } else if (embedded.articleResponseList) {
          fetchedArticles = embedded.articleResponseList;
        } else if (embedded.content) {
          fetchedArticles = embedded.content;
        } else {
          const firstKey = Object.keys(embedded)[0];
          if (firstKey && Array.isArray(embedded[firstKey])) {
            fetchedArticles = embedded[firstKey];
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
        fetchedArticles = raw.content;
        pageInfo = {
          totalElements: raw.totalElements,
          totalPages: raw.totalPages,
          number: raw.number,
          last: raw.last
        };
      } 
      // 기존 API 응답 구조 처리
      else if (raw.data && Array.isArray(raw.data)) {
        fetchedArticles = raw.data;
      } else if (Array.isArray(raw)) {
        fetchedArticles = raw;
      }

      // 데이터가 너무 많은 경우 제한
      fetchedArticles = fetchedArticles.slice(0, 100000);

      if (showMapBoundList) {
        setVisibleMapArticles(fetchedArticles);
        setAllPaginatedArticles([]);
        setTotalArticleCount(fetchedArticles.length);
        if (fetchedArticles.length === 0 && (regionFilterApplied || filters.mapZoom < filters.mapBoundListZoomLevel)) {
          setNoMatchingArticles(true);
        }
      } else {
        setAllPaginatedArticles(prev => loadMore ? [...prev, ...fetchedArticles] : fetchedArticles);
        setVisibleMapArticles([]);

        const moreExist = !!links.next || (pageInfo.last !== undefined && !pageInfo.last);
        setHasMore(moreExist);
        setCurrentPage(pageToFetch);
        setTotalArticleCount(pageInfo.totalElements || allPaginatedArticles.length + fetchedArticles.length);

        if (fetchedArticles.length === 0 && pageToFetch === 0) {
          setNoMatchingArticles(true);
        }
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
      setError("매물 목록을 불러오는데 실패했습니다.");
      if (showMapBoundList) {
        setVisibleMapArticles([]);
      } else {
        if (!loadMore) setAllPaginatedArticles([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [pageSize, showMapBoundList, allPaginatedArticles.length]);

  // 클러스터 내 매물 조회 함수
  const fetchArticlesByCluster = useCallback(async (cluster: ClusterInfo, precision: number) => {
    try {
      setLoading(true);
      setCurrentPage(0);
      setHasMore(true);

      // 클러스터 ID 생성 또는 사용
      const clusterId = cluster.clusterId ?? generateClusterId(cluster.lat, cluster.lng, precision);

      // API 호출 파라미터 준비
      const apiParams = {
        clusterId,
        precision,
        page: 0,
        size: pageSize * 10
      };

      // API 호출 및 응답 처리
      const response = await articleApi.getArticlesByCluster(apiParams) as any;

      if (!response || !response.data) {
        throw new Error("API 응답 데이터가 없습니다");
      }

      // 응답 데이터 처리
      let articles: ArticleResponse[] = [];
      const responseData = response.data as any;

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
      }
      else if (responseData.content && Array.isArray(responseData.content)) {
        articles = responseData.content;
      }
      else if (responseData.data && Array.isArray(responseData.data)) {
        articles = responseData.data;
      } else if (Array.isArray(responseData)) {
        articles = responseData;
      }

      // 매물 없음 케이스 처리
      if (!articles || articles.length === 0) {
        setNoArticlesInCluster(true);
        setError("현재 클러스터에 매물이 없습니다. 다른 클러스터를 선택해주세요.");

        // 빈 데이터 세팅
        setCurrentClusterInfo({
          clusterId,
          precision,
          center: {lat: cluster.lat, lng: cluster.lng},
          articles: [],
          allArticles: [],
          isEmpty: true
        });

        setAllPaginatedArticles([]);
        setVisibleMapArticles([]);
        setHasMore(false);
        return;
      }

      // 유효한 좌표 데이터 필터링
      const validArticles = articles.filter(article => {
        return validateCoordinates(article.latitude, article.longitude);
      });

      if (validArticles.length === 0) {
        setError("이 클러스터에 표시할 유효한 좌표의 매물이 없습니다.");
        setHasMore(false);
        setAllPaginatedArticles([]);
        setVisibleMapArticles([]);
        setShowMapBoundList(false);
        return;
      }

      setNoArticlesInCluster(false);

      // 현재 클러스터 정보 저장
      const clusterInfoRef = {
        clusterId,
        precision,
        center: {lat: cluster.lat, lng: cluster.lng},
        articles: validArticles,
        allArticles: validArticles,
        isEmpty: false
      };
      setCurrentClusterInfo(clusterInfoRef);

      // 지도와 목록에 표시할 데이터 업데이트
      setVisibleMapArticles(validArticles);

      // 매물 목록도 표시 (첫 페이지)
      const firstPageArticles = validArticles.slice(0, pageSize);
      setAllPaginatedArticles(firstPageArticles);

      // 페이지네이션 관련 상태 설정
      setHasMore(validArticles.length > pageSize);
      setCurrentPage(0);

      // 맵 바운드 리스트 모드 활성화
      setShowMapBoundList(true);

    } catch (err) {
      console.error("클러스터 내 매물 조회 실패:", err);
      setError("클러스터 내 매물을 조회하는데 실패했습니다.");
      setHasMore(false);
      setShowMapBoundList(false);
      setAllPaginatedArticles([]);
      setVisibleMapArticles([]);
      setNoArticlesInCluster(true);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // 클러스터 내 추가 매물 로드
  const loadMoreClusterArticles = useCallback(async () => {
    if (!currentClusterInfo || loading || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;

      // 클라이언트 측 페이징 (이미 모든 데이터를 저장하고 있는 경우)
      if (currentClusterInfo.allArticles && currentClusterInfo.allArticles.length > nextPage * pageSize) {
        // 다음 페이지 데이터 추출
        const nextPageArticles = currentClusterInfo.allArticles.slice(
          nextPage * pageSize,
          (nextPage + 1) * pageSize
        );

        // 추가 데이터 병합
        setAllPaginatedArticles(prev => [...prev, ...nextPageArticles]);
        setCurrentPage(nextPage);

        // 더 불러올 데이터가 있는지 체크
        setHasMore(currentClusterInfo.allArticles.length > (nextPage + 1) * pageSize);
        setIsLoadingMore(false);
        return;
      }

      // 서버에서 다음 페이지 로드 시도
      const response = await articleApi.getArticlesByCluster({
        clusterId: currentClusterInfo.clusterId,
        precision: currentClusterInfo.precision,
        page: nextPage,
        size: pageSize
      });

      // 응답 데이터 검증
      if (!response.data) {
        throw new Error("API 응답 데이터가 없습니다");
      }

      // 응답 처리
      let newArticles: ArticleResponse[] = [];
      const responseData = response.data as any;
      let hasNextPage = false;

      // HATEOAS _embedded 필드 처리
      if (responseData._embedded) {
        const embedded = responseData._embedded;
        
        if (embedded.articles) {
          newArticles = embedded.articles;
        } else if (embedded.articleResponseList) {
          newArticles = embedded.articleResponseList;
        } else {
          const firstKey = Object.keys(embedded)[0];
          if (firstKey && Array.isArray(embedded[firstKey])) {
            newArticles = embedded[firstKey];
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
        newArticles = responseData.content;
        hasNextPage = !responseData.last;
      }
      // 기존 API 응답 구조 처리
      else if (responseData.data && Array.isArray(responseData.data)) {
        newArticles = responseData.data;
      } else if (Array.isArray(responseData)) {
        newArticles = responseData;
      }

      if (newArticles && newArticles.length > 0) {
        // 유효한 좌표 데이터 필터링
        const validNewArticles = newArticles.filter(article => {
          return validateCoordinates(article.latitude, article.longitude);
        });

        // 새 데이터 추가
        setAllPaginatedArticles(prev => [...prev, ...validNewArticles]);

        // 캐시된 전체 목록에도 추가
        const updatedAllArticles = [...(currentClusterInfo.allArticles || []), ...validNewArticles];
        setCurrentClusterInfo({
          ...currentClusterInfo,
          allArticles: updatedAllArticles
        });

        // 지도에 표시할 매물도 업데이트
        setVisibleMapArticles(updatedAllArticles);

        // 페이지 업데이트
        setCurrentPage(nextPage);

        // 더 불러올 데이터가 있는지 체크
        setHasMore(hasNextPage || newArticles.length === pageSize);
      } else {
        // 더 이상 불러올 매물이 없음
        setHasMore(false);
      }
    } catch (err) {
      console.error("추가 매물 로드 실패:", err);
      setError("추가 매물을 불러오는데 실패했습니다.");
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentClusterInfo, loading, hasMore, currentPage, pageSize]);

  const loadMoreArticles = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    if (currentClusterInfo) {
      // 클러스터 내 매물 추가 로드
      loadMoreClusterArticles();
    } else {
      // 필요한 매개변수를 포함하지 않도록 간소화
      setIsLoadingMore(true);
      // 상위 컴포넌트에서 이 함수 호출 시 필요한 추가 매개변수 제공 필요
    }
  }, [isLoadingMore, hasMore, currentClusterInfo, loadMoreClusterArticles]);

  // 매물 클릭 핸들러
  const handleArticleClick = useCallback((article: ArticleResponse) => {
    setSelectedArticle(article);
  }, []);

  // 매물 상세 닫기 핸들러
  const handleDetailClose = useCallback(() => {
    setSelectedArticle(null);
  }, []);

  // 매물 데이터 초기화
  const resetArticleState = useCallback(() => {
    setAllPaginatedArticles([]);
    setVisibleMapArticles([]);
    setCurrentClusterInfo(null);
    setNoArticlesInCluster(false);
    setShowMapBoundList(false);
    setCurrentPage(0);
    setHasMore(true);
  }, []);

  // 경계 내의 매물 필터링
  const filterArticlesInBounds = useCallback((articlesToFilter: ArticleResponse[], bounds: MapBounds) => {
    return articlesToFilter.filter(article => {
      if (!article.latitude || !article.longitude) return false;
      
      const lat = parseFloat(article.latitude.toString());
      const lng = parseFloat(article.longitude.toString());
      
      if (isNaN(lat) || isNaN(lng)) return false;
      
      return (
        lat >= bounds.sw.lat &&
        lat <= bounds.ne.lat &&
        lng >= bounds.sw.lng &&
        lng <= bounds.ne.lng
      );
    });
  }, []);

  return {
    allPaginatedArticles,
    visibleMapArticles,
    selectedArticle,
    currentPage,
    hasMore,
    loading,
    isLoadingMore,
    error,
    showMapBoundList,
    setShowMapBoundList,
    noMatchingArticles,
    totalArticleCount,
    currentClusterInfo,
    noArticlesInCluster,
    setAllPaginatedArticles,
    setVisibleMapArticles,
    setSelectedArticle,
    setCurrentPage,
    setHasMore,
    setLoading,
    setIsLoadingMore,
    setError,
    setNoMatchingArticles,
    setTotalArticleCount,
    setCurrentClusterInfo,
    setNoArticlesInCluster,
    fetchArticles,
    fetchArticlesByCluster,
    loadMoreArticles,
    handleArticleClick,
    handleDetailClose,
    resetArticleState,
    filterArticlesInBounds
  };
} 