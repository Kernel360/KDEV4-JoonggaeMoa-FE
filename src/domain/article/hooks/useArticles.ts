import { useState, useCallback, useEffect, useRef } from 'react';

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

interface ExtendedMapBounds extends MapBounds {
  filters?: any;
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
  const [lastSearchBounds, setLastSearchBounds] = useState<ExtendedMapBounds | null>(null);

  // 매물 목록 API 호출 함수
  const fetchArticles = useCallback(async (
    pageToFetch: number,
    bounds: MapBounds,
    filters: any = {},
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

    // 안전하게 빈 객체 처리
    const safeFilters = filters || {};
    
    // 바운드 정보와 필터 정보 함께 저장 (페이지네이션에 사용)
    setLastSearchBounds({...bounds, filters: safeFilters});
    
    console.log("[매물 API] 매물 데이터 요청:", { pageToFetch, loadMore, showMapBoundList });

    const params: any = {
      size: showMapBoundList ? 100000 : pageSize,
      sortBy: safeFilters.sortField || 'confirmedAt',
      direction: safeFilters.sortOrder || 'desc',
      sort: `${safeFilters.sortField || 'confirmedAt'},${safeFilters.sortOrder || 'desc'}`,
      fields: "id,latitude,longitude,title,description,price,priceRent,priceSale,tradeType,realEstateType,address,imageUrls,thumbnail,confirmedAt,complexId"
    };

    // showMapBoundList 모드에서는 한번에 많은 데이터를 로드하고,
    // 일반 페이지네이션 모드에서는 페이지 단위로 로드
    if (!showMapBoundList) {
      params.page = pageToFetch;
      console.log("[매물 API] 페이지네이션 요청:", pageToFetch);
    } else {
      console.log("[매물 API] 맵 바운드 모드 - 한번에 모든 데이터 요청");
    }

    // 매물 유형 필터 적용
    if (safeFilters.typeFilter && safeFilters.typeFilter.length > 0) {
      params.realEstateType = safeFilters.typeFilter;
      params.buildingType = safeFilters.typeFilter;
    }

    // 거래 유형 필터 적용
    if (safeFilters.tradeTypeFilter && safeFilters.tradeTypeFilter.length > 0) {
      params.tradeType = safeFilters.tradeTypeFilter;
      params.trade_type = safeFilters.tradeTypeFilter;
    }

    // 가격 필터 적용
    if (safeFilters.minSalePrice > 0) {
      params.minSalePrice = safeFilters.minSalePrice;
      params.min_price_sale = safeFilters.minSalePrice;
    }

    if (safeFilters.maxSalePrice > 0) {
      params.maxSalePrice = safeFilters.maxSalePrice;
      params.max_price_sale = safeFilters.maxSalePrice;
    }

    if (safeFilters.minRentPrice > 0) {
      params.minRentPrice = safeFilters.minRentPrice;
      params.min_price_rent = safeFilters.minRentPrice;
    }

    if (safeFilters.maxRentPrice > 0) {
      params.maxRentPrice = safeFilters.maxRentPrice;
      params.max_price_rent = safeFilters.maxRentPrice;
    }

    // 지역 필터 적용
    let regionFilterApplied = false;
    if (safeFilters.selectedNeighborhood && safeFilters.selectedNeighborhood.length > 0) {
      const neighborhood = safeFilters.neighborhoodOptions && 
        safeFilters.neighborhoodOptions.find(r => r.cortarName === safeFilters.selectedNeighborhood[0]);
      if (neighborhood?.cortarNo) {
        params.regionPrefix = neighborhood.cortarNo;
        regionFilterApplied = true;
      }
    } else if (safeFilters.selectedDistrict) {
      const district = safeFilters.districtOptions && 
        safeFilters.districtOptions.find(r => r.cortarName === safeFilters.selectedDistrict);
      if (district?.cortarNo) {
        params.regionPrefix = district.cortarNo.substring(0, 5);
        regionFilterApplied = true;
      }
    } else if (safeFilters.selectedCity) {
      const city = safeFilters.cityOptions && 
        safeFilters.cityOptions.find(r => r.cortarName === safeFilters.selectedCity);
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
      (safeFilters.typeFilter && safeFilters.typeFilter.length > 0) ||
      (safeFilters.tradeTypeFilter && safeFilters.tradeTypeFilter.length > 0) ||
      safeFilters.minSalePrice > 0 ||
      safeFilters.maxSalePrice > 0 ||
      safeFilters.minRentPrice > 0 ||
      safeFilters.maxRentPrice > 0
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
      console.log("[매물 API] 원본 응답 데이터:", { 
        pageToFetch, 
        loadMore,
        originalResponse: raw
      });
      
      console.log("[매물 API] 응답 받음:", { 
        pageToFetch, 
        loadMore, 
        hasLinks: !!raw._links,
        hasEmbedded: !!raw._embedded,
        hasContent: !!raw.content,
        isPaginated: !!raw.page
      });

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
        
        // 페이지 정보 추출
        pageInfo = {
          totalElements: raw.totalElements,
          totalPages: raw.totalPages,
          number: raw.number !== undefined ? raw.number : 0,
          size: raw.size,
          last: raw.last,
          first: raw.first,
          empty: raw.empty
        };
        
        // links 정보 추출 (Spring HATEOAS 스타일)
        if (raw._links) {
          links = raw._links;
        } else if (pageInfo.totalPages && pageInfo.number !== undefined) {
          // 페이지 정보로부터 links 정보 생성
          links = {};
          if (pageInfo.number < pageInfo.totalPages - 1) {
            links.next = { href: `?page=${pageInfo.number + 1}` };
          }
          if (pageInfo.number > 0) {
            links.prev = { href: `?page=${pageInfo.number - 1}` };
          }
        }
        
        console.log("[매물 API] 페이지 정보 추출:", pageInfo);
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
        if (fetchedArticles.length === 0 && (regionFilterApplied || safeFilters.mapZoom < safeFilters.mapBoundListZoomLevel)) {
          setNoMatchingArticles(true);
        }
      } else {
        // 페이지네이션 모드
        console.log("[매물 API] 페이지네이션 응답 처리:", {
          pageToFetch,
          loadMore,
          fetchedCount: fetchedArticles.length,
          links,
          pageInfo
        });
        
        // 중복 제거 - 같은 매물이 여러 번 로드되는 것 방지
        let updatedArticles: ArticleResponse[] = [];
        
        if (loadMore) {
          // 기존 매물과 새 매물 합치기 (중복 제거)
          const existingIds = new Set(allPaginatedArticles.map(a => a.id));
          const uniqueNewArticles = fetchedArticles.filter(a => !existingIds.has(a.id));
          
          console.log("[매물 API] 새로운 고유 매물:", uniqueNewArticles.length);
          
          // 새 매물이 없으면 더 이상 로드하지 않음
          if (uniqueNewArticles.length === 0) {
            console.log("[매물 API] 새로운 매물이 없음, 더 이상 로드하지 않음");
            setHasMore(false);
            setIsLoadingMore(false);
            return;
          }
          
          updatedArticles = [...allPaginatedArticles, ...uniqueNewArticles];
        } else {
          updatedArticles = fetchedArticles;
        }
        
        setAllPaginatedArticles(updatedArticles);
        setVisibleMapArticles([]);

        // 링크 기반 또는 페이지 정보 기반으로 더 데이터가 있는지 확인
        const moreExist = !!links.next || (pageInfo.last !== undefined && !pageInfo.last);
        console.log("[매물 API] 더 불러올 데이터 있음 (링크 기반):", moreExist);
        
        // totalPages 정보가 있다면 이를 기반으로 더 데이터가 있는지 확인
        let hasMorePages = false;
        if (pageInfo && pageInfo.totalPages && pageInfo.number !== undefined) {
          // 현재 페이지가 전체 페이지보다 작으면 더 데이터가 있음
          hasMorePages = (pageInfo.number + 1) < pageInfo.totalPages;
          console.log("[매물 API] 더 불러올 데이터 있음 (페이지 기반):", hasMorePages, {
            currentPage: pageInfo.number,
            totalPages: pageInfo.totalPages,
            totalElements: pageInfo.totalElements || 0
          });
        }
        
        // 링크 기반 또는 페이지 기반 중 하나라도 더 데이터가 있다고 판단되면 true
        const hasMoreData = moreExist || hasMorePages;
        
        // 페이지 정보에서 totalPages가 있고 현재 페이지가 0이면 다음 페이지가 있음이 확정적
        if (pageInfo && pageInfo.totalPages && pageInfo.totalPages > 1 && pageInfo.number === 0) {
          console.log("[매물 API] 첫 페이지 데이터에 더 페이지가 있음이 확정적:", {
            currentPage: pageInfo.number,
            totalPages: pageInfo.totalPages
          });
          
          // 첫 페이지면 무조건 다음 페이지 있음
          setHasMore(true);
        } else {
          // 현재 페이지와 가져온 데이터 수를 기반으로 hasMore 결정
          // 가져온 데이터가 없거나 페이지 사이즈보다 작으면 더 이상 데이터가 없음
          const hasNoMoreData = fetchedArticles.length === 0 || fetchedArticles.length < pageSize;
          console.log("[매물 API] 최종 판단 - 더 불러올 데이터 있음:", hasMoreData && !hasNoMoreData, {
            hasNoMoreData,
            fetchedCount: fetchedArticles.length,
            pageSize
          });
          
          setHasMore(hasMoreData && !hasNoMoreData);
        }
        
        setCurrentPage(pageToFetch);
        setTotalArticleCount(pageInfo.totalElements || updatedArticles.length);

        if (fetchedArticles.length === 0 && pageToFetch === 0) {
          setNoMatchingArticles(true);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
      console.error("Error fetching articles:", err);
      setError(`매물 목록을 불러오는데 실패했습니다: ${errorMessage}`);
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
  }, [
    pageSize, 
    showMapBoundList, 
    allPaginatedArticles.length,
    setVisibleMapArticles,
    setAllPaginatedArticles,
    setHasMore,
    setCurrentPage,
    setTotalArticleCount,
    setNoMatchingArticles,
    setLoading,
    setIsLoadingMore,
    setError,
    setLastSearchBounds,
    articleApi
  ]);

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
  }, [
    pageSize, 
    setLoading, 
    setCurrentPage,
    setHasMore, 
    setNoArticlesInCluster, 
    setError, 
    setCurrentClusterInfo, 
    setAllPaginatedArticles, 
    setVisibleMapArticles, 
    setShowMapBoundList,
    validateCoordinates, 
    articleApi, 
    generateClusterId
  ]);

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
  }, [
    currentClusterInfo, 
    loading, 
    hasMore, 
    currentPage, 
    pageSize, 
    setIsLoadingMore, 
    setAllPaginatedArticles, 
    setCurrentClusterInfo, 
    setVisibleMapArticles, 
    setCurrentPage, 
    setHasMore, 
    setError,
    validateCoordinates,
    articleApi
  ]);

  // 무한 스크롤 디버깅을 위한 useEffect
  useEffect(() => {
    console.log("[매물 디버깅] 상태 변경:", {
      isLoadingMore,
      hasMore,
      currentPage,
      totalArticles: allPaginatedArticles.length,
      showMapBoundList
    });
  }, [isLoadingMore, hasMore, currentPage, allPaginatedArticles.length, showMapBoundList]);

  // 마지막 요청 타임스탬프 추적
  const lastRequestRef = useRef<number>(0);
  const requestLockRef = useRef<boolean>(false);
  const currentRequestRef = useRef<AbortController | null>(null);
  
  // 페이지네이션 요청 락 적용 함수
  const acquireRequestLock = useCallback(() => {
    // 현재 시간
    const now = Date.now();
    
    // 마지막 요청 이후 5초가 지나지 않았으면 락 유지
    if (now - lastRequestRef.current < 5000) {
      console.log("[매물 무한스크롤] 요청 락 획득 실패 - 시간 제한 (마지막 요청으로부터 경과: " + (now - lastRequestRef.current) + "ms)");
      return false;
    }
    
    // 이미 락이 걸려있으면 실패
    if (requestLockRef.current) {
      console.log("[매물 무한스크롤] 요청 락 획득 실패 - 이미 락 걸림");
      return false;
    }
    
    // 이미 로딩 중이거나 더 불러올 데이터가 없으면 실패
    if (isLoadingMore || !hasMore) {
      console.log("[매물 무한스크롤] 요청 락 획득 실패 - 상태 부적합:", { isLoadingMore, hasMore });
      return false;
    }
    
    // 락 획득 성공
    requestLockRef.current = true;
    lastRequestRef.current = now;
    console.log("[매물 무한스크롤] 요청 락 획득 성공");
    
    // 이전 요청 중단
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
      currentRequestRef.current = null;
    }
    
    // 새 요청 컨트롤러 생성
    currentRequestRef.current = new AbortController();
    
    // 15초 후 락 자동 해제 (안전장치)
    setTimeout(() => {
      if (requestLockRef.current) {
        console.log("[매물 무한스크롤] 요청 락 자동 해제 (15초 타임아웃)");
        requestLockRef.current = false;
      }
    }, 15000);
    
    return true;
  }, [isLoadingMore, hasMore]);
  
  // 락 해제 함수
  const releaseRequestLock = useCallback(() => {
    requestLockRef.current = false;
    console.log("[매물 무한스크롤] 요청 락 해제");
  }, []);

  const loadMoreArticles = useCallback(() => {
    // 락 획득 시도
    if (!acquireRequestLock()) {
      console.log("[매물 무한스크롤] 중단 - 락 획득 실패");
      return;
    }
    
    console.log("[매물 무한스크롤] 시작 - 다음 페이지 요청:", currentPage + 1);
    
    // 로딩 중 상태 즉시 설정
    setIsLoadingMore(true);

    try {
      if (currentClusterInfo) {
        // 클러스터 내 매물 추가 로드
        console.log("[매물 무한스크롤] 클러스터 내 매물 추가 로드");
        loadMoreClusterArticles()
          .then(() => {
            console.log("[매물 무한스크롤] 클러스터 매물 로드 완료");
          })
          .catch((error) => {
            console.error("[매물 무한스크롤] 클러스터 매물 로드 실패:", error);
          })
          .finally(() => {
            // 요청 완료 후 2초 후에 락 해제
            setTimeout(() => {
              releaseRequestLock();
            }, 2000);
          });
      } else {
        // 일반 페이지네이션 처리
        console.log("[매물 무한스크롤] 일반 페이지네이션 처리");
        
        if (!lastSearchBounds) {
          console.error("[매물 무한스크롤] 페이지네이션 오류: 검색 정보가 없습니다");
          setIsLoadingMore(false);
          releaseRequestLock();
          return;
        }
        
        // 현재 페이지 확인
        if (currentPage === null || typeof currentPage !== 'number') {
          console.error("[매물 무한스크롤] 페이지네이션 오류: 현재 페이지 정보가 없습니다");
          setIsLoadingMore(false);
          releaseRequestLock();
          return;
        }
        
        // 마지막 검색 정보와 필터를 함께 사용
        console.log("[매물 무한스크롤] 다음 페이지 매물 요청:", {
          page: currentPage + 1,
          bounds: lastSearchBounds,
          filters: lastSearchBounds.filters || {}
        });
        
        // showMapBoundList 모드에 따라 다른 처리
        if (showMapBoundList) {
          // 맵 바운드 모드에서는 이미 모든 데이터를 가져왔으므로 
          // 클라이언트 측에서 페이지네이션 처리
          setIsLoadingMore(false);
          setHasMore(false);
          console.log("[매물 무한스크롤] 맵 바운드 모드에서는 추가 로드를 지원하지 않습니다");
          releaseRequestLock();
        } else {
          // API로부터 다음 페이지 데이터 요청
          fetchArticles(currentPage + 1, lastSearchBounds, lastSearchBounds.filters || {}, true)
            .then(() => {
              console.log("[매물 무한스크롤] 일반 페이지네이션 데이터 로드 완료");
            })
            .catch((error) => {
              console.error("[매물 무한스크롤] 일반 페이지네이션 데이터 로드 실패:", error);
            })
            .finally(() => {
              // 요청 완료 후 2초 후에 락 해제
              setTimeout(() => {
                releaseRequestLock();
              }, 2000);
            });
        }
      }
    } catch (error) {
      console.error("[매물 무한스크롤] 추가 데이터 로드 중 오류:", error);
      setIsLoadingMore(false);
      releaseRequestLock();
    }
  }, [
    acquireRequestLock,
    releaseRequestLock,
    currentClusterInfo, 
    loadMoreClusterArticles, 
    currentPage, 
    fetchArticles, 
    lastSearchBounds, 
    showMapBoundList,
    setIsLoadingMore,
    setHasMore
  ]);

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
  
  // 페이지 로딩 시 초기 데이터 로드
  useEffect(() => {
    // 초기 로딩 시 매물 데이터 요청
    if (loading) {
      console.log("초기 매물 데이터 로딩 시작");
      // 기본적인 API 요청을 위한 기본 필터
      const defaultFilters = {
        sortField: 'confirmedAt',
        sortOrder: 'desc'
      };
      
      // 기본 바운드 정보 생성
      const defaultBounds: MapBounds = {
        ne: { lat: 37.5170664, lng: 127.0523278 },
        sw: { lat: 37.4769664, lng: 127.0123278 }
      };
      
      // 초기 데이터 요청
      fetchArticles(0, defaultBounds, defaultFilters, false);
    }
  }, [loading, fetchArticles]);

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