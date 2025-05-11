import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from 'react-router-dom'

import ArticleDetail from "@/domain/article/components/ArticleDetail"
import ArticleListView from '@/domain/article/components/ArticleListView'
import { REAL_ESTATE_OPTIONS, TRADE_TYPE_OPTIONS } from '@/domain/article/constants/articleConstants'
import ArticleListMap from '@/domain/article/map/components/ArticleListMap'
import { DEFAULT_MAP_BOUNDS, MAP_ZOOM_LEVELS, YEOKSAM_CENTER } from '@/domain/article/map/constants/mapConstants'
import { regionApi } from "@/domain/article/map/services/regionApi"
import { calculatePrecisionByZoom, generateClusterId, getClusterColor } from '@/domain/article/map/utils/clusterUtils'
import { getCityOptions, getDistrictOptions, KOREA_REGIONS } from '@/domain/article/map/utils/regionData'
import type { Region } from '@/domain/article/map/utils/regionUtils'
import { articleApi } from "@/domain/article/services/articleApi"
import type {
    ArticleResponse,
    ClusterInfo,
    ComplexResponse,
    RealEstateType,
    TradeType
} from "@/domain/article/types/article"
import { createCoordinates, validateCoordinates } from "@/domain/article/utils/articleFormat"
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FilterListIcon from '@mui/icons-material/FilterList'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ViewMapIcon from '@mui/icons-material/Map'
import ViewListIcon from '@mui/icons-material/ViewList'
import {
    AppBar,
    Autocomplete,
    Box,
    Button,
    Chip,
    Drawer,
    FormControl,
    GlobalStyles,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Popover,
    Select,
    TextField,
    Toolbar,
    Typography,
    useMediaQuery,
    useTheme
} from "@mui/material"

interface PageContent<T> {
    content: T[];
    totalElements?: number;
    totalPages?: number;
    size?: number;
    number?: number;
    last?: boolean;
}

interface HateoasResponse<T> {
    _embedded: {
        articles?: T[];
        articleResponseList?: T[];
    };
    _links?: Record<string, any>;
    page?: any;
}

// 확장된 클러스터 상세 정보 타입
interface ClusterDetailInfo {
    clusterId: string;
    precision: number;
    center: { lat: number; lng: number };
    articles: ArticleResponse[];
    allArticles?: ArticleResponse[];
    isEmpty?: boolean;
}

const ArticleList: React.FC = () => {
    const clusterCache = useRef(new Map<string, ClusterInfo[]>());
    const mapRef = useRef<any>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // mapRef가 실제로 할당되었는지 확인하는 함수
    const ensureMapRef = useCallback(() => {
        if (!mapRef.current) {
            console.warn("mapRef is not available, map interactions may not work properly");
            return false;
        }
        return true;
    }, []);

    const MIN_ZOOM_LEVEL_TO_FETCH = MAP_ZOOM_LEVELS.MIN_FETCH;
    const CLUSTER_ZOOM_THRESHOLD = MAP_ZOOM_LEVELS.CLUSTER;
    const MAP_BOUND_LIST_ZOOM_LEVEL = MAP_ZOOM_LEVELS.MAP_BOUND_LIST;
    const DEFAULT_BOUND = DEFAULT_MAP_BOUNDS;
    const PAGE_SIZE = 20;
    const DRAWER_WIDTH = 350;
    const ALLOWED_SORT_FIELDS = ["id", "priceSale", "confirmedAt"];
    const ALLOWED_SORT_DIRECTIONS = ["asc", "desc"];

    const navigate = useNavigate();

    const [mapBounds, setMapBounds] = useState(DEFAULT_BOUND);
    const [mapZoom, setMapZoom] = useState<number>(MAP_ZOOM_LEVELS.DEFAULT);
    const [isClusterMode, setIsClusterMode] = useState<boolean>(false);
    const [currentLocation, setCurrentLocation] = useState(YEOKSAM_CENTER);
    const [clusters, setClusters] = useState<ClusterInfo[]>([]);
    const [noArticlesInCluster, setNoArticlesInCluster] = useState<boolean>(false);

    const [allPaginatedArticles, setAllPaginatedArticles] = useState<ArticleResponse[]>([]);
    const [visibleMapArticles, setVisibleMapArticles] = useState<ArticleResponse[]>([]);
    const [selectedArticle, setSelectedArticle] = useState<ArticleResponse | null>(null);
    const [selectedComplex, setSelectedComplex] = useState<ComplexResponse | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalArticleCount, setTotalArticleCount] = useState(0);

    // 현재 선택된 클러스터 정보 저장용 상태
    const [currentClusterInfo, setCurrentClusterInfo] = useState<ClusterDetailInfo | null>(null);

    const [loading, setLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [showMap, setShowMap] = useState(true);
    const [showList, setShowList] = useState(true);
    const [detailVisible, setDetailVisible] = useState(false);
    const [showMapBoundList, setShowMapBoundList] = useState(false);
    const [noMatchingArticles, setNoMatchingArticles] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<RealEstateType[]>([]);
    const [tradeTypeFilter, setTradeTypeFilter] = useState<TradeType[]>([]);
    const [minSalePrice, setMinSalePrice] = useState<number>(0);
    const [maxSalePrice, setMaxSalePrice] = useState<number>(0);
    const [minRentPrice, setMinRentPrice] = useState<number>(0);
    const [maxRentPrice, setMaxRentPrice] = useState<number>(0);
    const [sortField, setSortField] = useState<string>("confirmedAt");
    const [sortOrder, setSortOrder] = useState<string>("desc");

    const [regions, setRegions] = useState<Region[]>(KOREA_REGIONS);
    const [selectedCity, setSelectedCity] = useState<string>("");
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<string[]>([]);
    const [cityOptions, setCityOptions] = useState<Region[]>(getCityOptions());
    const [districtOptions, setDistrictOptions] = useState<Region[]>([]);
    const [neighborhoodOptions, setNeighborhoodOptions] = useState<Region[]>([]);
    const [regionPopoverAnchor, setRegionPopoverAnchor] = useState<null | HTMLElement>(null);
    const [regionSelectStep, setRegionSelectStep] = useState<'city' | 'district' | 'neighborhood'>('city');
    const [isRegionFiltered, setIsRegionFiltered] = useState(false);

    const observerRef = useRef<IntersectionObserver | null>(null);
    // 클러스터 전환 이벤트 플래그
    const clusterTransitionRef = useRef(false);

    // 추가 매물 로드 핸들러
    const loadMoreArticles = useCallback(() => {
        if (isLoadingMore || !hasMore) return;

        if (currentClusterInfo) {
            // 클러스터 내 매물 추가 로드 (loadMoreClusterArticlesRef.current 호출)
            if (loadMoreClusterArticlesRef.current) {
                loadMoreClusterArticlesRef.current();
            }
        } else {
            // 일반 매물 추가 로드 (fetchArticlesRef.current 호출)
            if (fetchArticlesRef.current) {
                setIsLoadingMore(true);
                fetchArticlesRef.current(currentPage + 1, undefined, true);
            }
        }
    }, [isLoadingMore, hasMore, currentClusterInfo, currentPage]);

    const loadMoreRef = useCallback((node: HTMLLIElement | null) => {
        if (isLoadingMore || !hasMore || showMapBoundList) return;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                loadMoreArticles();
            }
        });

        if (node) observerRef.current.observe(node);
    }, [isLoadingMore, hasMore, showMapBoundList]);

    const filterArticlesInBounds = useCallback((articlesToFilter: ArticleResponse[], bounds: {
        ne: { lat: number; lng: number };
        sw: { lat: number; lng: number }
    }) => {
        return articlesToFilter.filter(article => {
            const coordinates = createCoordinates(article.latitude, article.longitude);
            if (!coordinates) return false;

            return (
                coordinates.lat >= bounds.sw.lat &&
                coordinates.lat <= bounds.ne.lat &&
                coordinates.lng >= bounds.sw.lng &&
                coordinates.lng <= bounds.ne.lng
            );
        });
    }, []);

    // 함수 참조를 담을 refs
    const fetchArticlesRef = useRef<(pageToFetch: number, currentBounds?: {
        ne: { lat: number; lng: number };
        sw: { lat: number; lng: number }
    }, loadMore?: boolean) => Promise<void>>();
    const fetchClustersRef = useRef<(bounds: {
        ne: { lat: number; lng: number };
        sw: { lat: number; lng: number }
    }, zoom: number) => Promise<void>>();
    const loadMoreClusterArticlesRef = useRef<() => Promise<void>>();

    // 클러스터 처리 로직
    const processedClusters = useMemo(() => {
        // Ensure clusters is always treated as an array
        const clustersArray = Array.isArray(clusters) ? clusters : [];

        const result = clustersArray.map(cluster => ({
            ...cluster,
            color: getClusterColor(cluster)
        }));
        return result;
    }, [clusters]);

    // 지도 관련 상태 업데이트를 처리하는 함수
    const handleMapViewChange = useCallback((newBounds: {
        ne: { lat: number; lng: number };
        sw: { lat: number; lng: number }
    }, newZoom: number) => {
        // 클러스터 전환 플래그가 활성화된 경우는 무시 (클러스터 클릭으로 인한 줌인)
        if (clusterTransitionRef.current) {
            clusterTransitionRef.current = false;
            return;
        }

        // 경계 변경은 항상 반영
        setMapBounds(newBounds);

        // 줌 레벨 변경 감지 (이전과 다른 경우만 상태 업데이트)
        if (newZoom !== mapZoom) {
            // 줌 레벨만 업데이트하고 중심점은 변경하지 않음
            setMapZoom(newZoom);

            // 클러스터 모드 전환 감지 (5 → 6 또는 6 → 5)
            const isTransitioningToCluster = mapZoom < CLUSTER_ZOOM_THRESHOLD && newZoom >= CLUSTER_ZOOM_THRESHOLD;
            const isTransitioningFromCluster = mapZoom >= CLUSTER_ZOOM_THRESHOLD && newZoom < CLUSTER_ZOOM_THRESHOLD;

            // 클러스터 모드 변경이 감지되면 즉시 처리
            if (isTransitioningToCluster) {
                console.log(`클러스터 모드로 전환: 핀 → 클러스터, zoom=${newZoom}`);
                // 클러스터 모드로 즉시 전환
                setIsClusterMode(true);

                // 기존 매물 표시 초기화
                setVisibleMapArticles([]);

                // 클러스터 데이터 즉시 요청
                if (fetchClustersRef.current) {
                    fetchClustersRef.current(newBounds, newZoom);
                }
            } else if (isTransitioningFromCluster) {
                console.log(`매물 핀 모드로 전환: 클러스터 → 핀, zoom=${newZoom}`);
                // 핀 모드로 즉시 전환
                setIsClusterMode(false);

                // 기존 클러스터 제거
                setClusters([]);

                // 매물 데이터 즉시 요청
                if (fetchArticlesRef.current) {
                    fetchArticlesRef.current(0, newBounds, false);
                }
            }
            // 같은 모드 내에서 줌 레벨만 변경된 경우 (클러스터 모드 유지 또는 핀 모드 유지)
            else if (fetchArticlesRef.current) {
                fetchArticlesRef.current(0, newBounds, false);
            }
        }
        // 줌은 같지만 경계만 변경된 경우
        else if (
            newBounds.ne.lat !== mapBounds.ne.lat ||
            newBounds.ne.lng !== mapBounds.ne.lng ||
            newBounds.sw.lat !== mapBounds.sw.lat ||
            newBounds.sw.lng !== mapBounds.sw.lng
        ) {
            // 필터가 적용되었거나 지도 영역 기준으로 리스트가 표시되는 경우 데이터 다시 로드
            const hasFilters = typeFilter.length > 0 ||
                tradeTypeFilter.length > 0 ||
                minSalePrice > 0 ||
                maxSalePrice > 0 ||
                minRentPrice > 0 ||
                maxRentPrice > 0 ||
                isRegionFiltered;

            // 현재 선택된 클러스터가 없고, (필터가 적용되었거나 지도 영역 기준 리스트가 표시되는 경우)에 새로운 매물 요청
            if (!currentClusterInfo && (hasFilters || showMapBoundList)) {
                if (fetchArticlesRef.current) {
                    console.log("지도 이동으로 인한 데이터 다시 로드 (필터 적용 또는 지도 영역 기준 리스트)");
                    fetchArticlesRef.current(0, newBounds, false);
                }
            }
        }
    }, [mapZoom, mapBounds, CLUSTER_ZOOM_THRESHOLD, currentClusterInfo, showMapBoundList, typeFilter, tradeTypeFilter, minSalePrice, maxSalePrice, minRentPrice, maxRentPrice, isRegionFiltered]);

    // 클러스터 클릭 핸들러
    const handleClusterClick = useCallback(async (cluster: ClusterInfo) => {
        try {
            // 클러스터 전환 플래그 설정 (지도 리셋 방지)
            clusterTransitionRef.current = true;

            // 클러스터 중심으로 강하게 줌 인 (개별 매물 핀포인트가 보일 수 있도록)
            // 줌 레벨에 따라 다르게 설정 (낮을수록 더 가까이 줌인)
            let targetZoomLevel;

            if (cluster.isMerged) {
                // 병합된 클러스터는 더 가까이 보여줌 (더 낮은 레벨 = 더 확대)
                targetZoomLevel = 2; // 매우 가까이 확대
            } else if (mapZoom <= 5) {
                // 낮은 줌 레벨에서는 아주 가까이 줌인
                targetZoomLevel = 2;
            } else {
                // 이미 어느 정도 줌인된 상태에서는 더 가까이 줌인
                targetZoomLevel = 1; // 가장 가까운 확대 수준 (개별 매물이 확실히 보임)
            }

            // 명시적으로 중심 위치와 줌 레벨 변경 (지도 이동용)
            if (mapRef.current) {
                try {
                    const kakao = (window as any).kakao;
                    if (kakao && kakao.maps) {
                        const position = new kakao.maps.LatLng(cluster.lat, cluster.lng);
                        mapRef.current.setCenter(position);
                        mapRef.current.setLevel(targetZoomLevel);
                    }
                } catch (err) {
                    console.error("지도 직접 제어 실패:", err);
                }
            }

            // 상태 업데이트 (필요한 경우에만)
            setCurrentLocation({lat: cluster.lat, lng: cluster.lng});
            setMapZoom(targetZoomLevel);

            // 매물 로딩 시작 (병렬로 API 호출)
            setLoading(true);
            setCurrentPage(0);
            setHasMore(true);

            // 정밀도 설정 (클러스터에 있으면 그것을 사용, 아니면 zoom 레벨에 따라 계산)
            const precisionVal = cluster.precision ?? calculatePrecisionByZoom(mapZoom);

            // 클러스터 ID 생성 (유틸리티 함수 사용)
            const clusterId = generateClusterId(cluster.lat, cluster.lng, precisionVal);

            // API 호출 파라미터 준비
            const apiParams = {
                clusterId,
                precision: precisionVal,
                page: 0,
                size: PAGE_SIZE * 10
            };

            // API 호출 및 응답 처리
            try {
                const response = await articleApi.getArticlesByCluster(apiParams);

                // 응답 데이터 검증
                if (!response.data) {
                    throw new Error("API 응답 데이터가 없습니다");
                }

                // 성공 여부 확인
                if ('success' in response.data && response.data.success === false) {
                    throw new Error(`API 오류: ${response.data.error?.message || '알 수 없는 오류'}`);
                }

                // 데이터 추출
                let articles: ArticleResponse[] = [];

                // 표준 API 응답인 경우 {success: true, data: [...]}
                if ('success' in response.data && response.data.success === true && 'data' in response.data) {
                    // response.data.data를 any로 타입 단언하여 content 속성 접근 문제 해결
                    const responseData = response.data.data as any;

                    if (Array.isArray(responseData)) {
                        articles = responseData;
                    } else if (responseData && typeof responseData === 'object' && 'content' in responseData) {
                        // 페이지 객체로 응답된 경우
                        articles = responseData.content;
                    } else if (responseData && typeof responseData === 'object') {
                        // 단일 객체인 경우
                        articles = [responseData as ArticleResponse];
                    }
                }
                // 직접 배열이 반환된 경우
                else if (Array.isArray(response.data)) {
                    articles = response.data;
                }
                // HATEOAS 형식 응답인 경우
                else {
                    // 전체 응답 데이터를 any로 타입 단언
                    const anyData = response.data as any;

                    if (anyData._embedded && anyData._embedded.articles) {
                        articles = anyData._embedded.articles;
                    } else if (anyData._embedded && anyData._embedded.articleResponseList) {
                        articles = anyData._embedded.articleResponseList;
                    } else if (anyData.content && Array.isArray(anyData.content)) {
                        articles = anyData.content;
                    } else if (anyData.data && Array.isArray(anyData.data)) {
                        articles = anyData.data;
                    }
                }

                // 매물 없음 케이스 처리
                if (!articles || articles.length === 0) {
                    setIsClusterMode(false);
                    setNoArticlesInCluster(true);
                    setError("현재 클러스터에 매물이 없습니다. 다른 클러스터를 선택해주세요.");

                    // 빈 데이터 세팅
                    setCurrentClusterInfo({
                        clusterId,
                        precision: precisionVal,
                        center: {lat: cluster.lat, lng: cluster.lng},
                        articles: [],
                        allArticles: [],
                        isEmpty: true
                    });

                    setAllPaginatedArticles([]);
                    setVisibleMapArticles([]);
                    setHasMore(false);
                    setLoading(false);
                    return;
                }

                // 유효한 좌표 데이터 필터링
                const validArticles = articles.filter(article => {
                    return validateCoordinates(article.latitude, article.longitude);
                });

                if (validArticles.length === 0) {
                    setIsClusterMode(false);
                    setError("이 클러스터에 표시할 유효한 좌표의 매물이 없습니다.");
                    setHasMore(false);
                    setAllPaginatedArticles([]);
                    setVisibleMapArticles([]);
                    setShowMapBoundList(false);
                    setLoading(false);
                    return;
                }

                // 클러스터 모드를 해제하고 개별 매물 모드로 전환
                setIsClusterMode(false);
                setNoArticlesInCluster(false);

                // 현재 클러스터 정보 저장
                const clusterInfoRef = {
                    clusterId,
                    precision: precisionVal,
                    center: {lat: cluster.lat, lng: cluster.lng},
                    articles: validArticles,
                    allArticles: validArticles,
                    isEmpty: false
                };
                setCurrentClusterInfo(clusterInfoRef);

                // 지도와 목록에 표시할 데이터 업데이트
                setVisibleMapArticles(validArticles);

                // 매물 목록도 표시 (첫 페이지)
                const firstPageArticles = validArticles.slice(0, PAGE_SIZE);
                setAllPaginatedArticles(firstPageArticles);

                // 페이지네이션 관련 상태 설정
                setHasMore(validArticles.length > PAGE_SIZE);
                setCurrentPage(0);

                // 맵 바운드 리스트 모드 활성화 (개별 매물 모드로 전환)
                setShowMapBoundList(true);

            } catch (apiError) {
                console.error("클러스터 내 매물 조회 실패:", apiError);
                setIsClusterMode(false); // 클러스터 모드 해제
                setError("클러스터 내 매물을 조회하는데 실패했습니다.");
                setHasMore(false);
                setShowMapBoundList(false);
                setAllPaginatedArticles([]);
                setVisibleMapArticles([]);
                setNoArticlesInCluster(true);
            } finally {
                setLoading(false);
            }
        } catch (err) {
            console.error("클러스터 처리 중 오류 발생:", err);
            setIsClusterMode(false); // 클러스터 모드 해제
            setError("클러스터 내 매물을 조회하는데 실패했습니다.");
            setLoading(false);
            setAllPaginatedArticles([]);
            setVisibleMapArticles([]);
            setNoArticlesInCluster(true);
        }
    }, [mapZoom, mapRef, PAGE_SIZE, ensureMapRef]);

    // 클러스터 내 추가 매물 로드 (무한 스크롤)
    const loadMoreClusterArticles = useCallback(async () => {
        if (!currentClusterInfo || loading || !hasMore) return;

        try {
            setIsLoadingMore(true);
            console.log(`클러스터 내 추가 매물 로드 중, 현재 페이지: ${currentPage}, 페이지 크기: ${PAGE_SIZE}`);

            const nextPage = currentPage + 1;

            // 클라이언트 측 페이징 (이미 모든 데이터를 저장하고 있는 경우)
            if (currentClusterInfo.allArticles && currentClusterInfo.allArticles.length > nextPage * PAGE_SIZE) {
                console.log("캐시된 데이터로 클라이언트 측 페이징 사용");

                // 다음 페이지 데이터 추출
                const nextPageArticles = currentClusterInfo.allArticles.slice(
                    nextPage * PAGE_SIZE,
                    (nextPage + 1) * PAGE_SIZE
                );

                // 추가 데이터 병합
                setAllPaginatedArticles(prev => [...prev, ...nextPageArticles]);
                setCurrentPage(nextPage);

                // 더 불러올 데이터가 있는지 체크
                setHasMore(currentClusterInfo.allArticles.length > (nextPage + 1) * PAGE_SIZE);

                setIsLoadingMore(false);
                return;
            }

            // 서버에서 다음 페이지 로드 시도
            try {
                console.log(`서버에서 추가 매물 로드 중: clusterId=${currentClusterInfo.clusterId}, precision=${currentClusterInfo.precision}, page=${nextPage}`);

                // API 호출
                const response = await articleApi.getArticlesByCluster({
                    clusterId: currentClusterInfo.clusterId,
                    precision: currentClusterInfo.precision,
                    page: nextPage,
                    size: PAGE_SIZE
                });

                // 응답 데이터 검증
                if (!response.data) {
                    throw new Error("API 응답 데이터가 없습니다");
                }

                // 성공 여부 확인
                if ('success' in response.data && response.data.success === false) {
                    throw new Error(`API 오류: ${response.data.error?.message || '알 수 없는 오류'}`);
                }

                // 데이터 추출
                let newArticles: ArticleResponse[] = [];

                // 표준 API 응답인 경우 {success: true, data: [...]}
                if ('success' in response.data && response.data.success === true && 'data' in response.data) {
                    // response.data.data를 any로 타입 단언하여 content 속성 접근 문제 해결
                    const responseData = response.data.data as any;

                    if (Array.isArray(responseData)) {
                        newArticles = responseData;
                    } else if (responseData && typeof responseData === 'object' && 'content' in responseData) {
                        newArticles = responseData.content;
                    } else if (responseData && typeof responseData === 'object') {
                        newArticles = [responseData as ArticleResponse];
                    }
                }
                // 직접 배열이 반환된 경우
                else if (Array.isArray(response.data)) {
                    newArticles = response.data;
                }
                // HATEOAS 형식 응답인 경우
                else {
                    // 전체 응답 데이터를 any로 타입 단언
                    const anyData = response.data as any;

                    if (anyData._embedded && anyData._embedded.articles) {
                        newArticles = anyData._embedded.articles;
                    } else if (anyData._embedded && anyData._embedded.articleResponseList) {
                        newArticles = anyData._embedded.articleResponseList;
                    } else if (anyData.content && Array.isArray(anyData.content)) {
                        newArticles = anyData.content;
                    } else if (anyData.data && Array.isArray(anyData.data)) {
                        newArticles = anyData.data;
                    }
                }

                console.log(`처리된 매물 수: ${newArticles.length}`);

                if (newArticles && newArticles.length > 0) {
                    console.log(`추가 매물 ${newArticles.length}개 로드됨`);

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

                    // 더 불러올 데이터가 있는지 체크 (PAGE_SIZE 미만으로 왔다면 더 이상 없음)
                    setHasMore(newArticles.length === PAGE_SIZE);
                } else {
                    // 더 이상 불러올 매물이 없음
                    setHasMore(false);
                }
            } catch (apiError) {
                console.error("추가 매물 로드 실패:", apiError);
                setError("추가 매물을 불러오는데 실패했습니다.");
                setHasMore(false);
            }
        } catch (err) {
            console.error("클러스터 내 추가 매물 로드 중 오류 발생:", err);
            setError("추가 매물을 불러오는데 실패했습니다.");
            setHasMore(false);
        } finally {
            setIsLoadingMore(false);
        }
    }, [currentClusterInfo, loading, hasMore, currentPage, PAGE_SIZE]);

    // 함수 정의 (순환 참조 문제 해결을 위해 별도 선언)
    const fetchClusters = useCallback(async (bounds: {
        ne: { lat: number; lng: number };
        sw: { lat: number; lng: number }
    }, zoom: number) => {
        try {
            console.log(`클러스터 데이터 요청: zoom=${zoom}`);

            // 줌 레벨에 따른 적절한 정밀도 계산 (유틸리티 함수 사용)
            const precision = calculatePrecisionByZoom(zoom);

            // 클러스터 캐시 키 생성
            const cacheKey = `${zoom.toFixed(1)}_${bounds.sw.lat.toFixed(5)}_${bounds.sw.lng.toFixed(5)}_${bounds.ne.lat.toFixed(5)}_${bounds.ne.lng.toFixed(5)}_${precision}`;

            // 즉시 클러스터 모드로 전환 (API 응답을 기다리지 않고)
            setIsClusterMode(zoom >= CLUSTER_ZOOM_THRESHOLD);

            // 캐시에 있는 경우 즉시 사용
            if (clusterCache.current.has(cacheKey)) {
                console.log("캐시된 클러스터 데이터 사용");
                const cachedClusters = clusterCache.current.get(cacheKey) || [];
                setClusters(cachedClusters);
                return;
            }

            try {
                // API 호출 파라미터 준비
                const params = {
                    swLat: bounds.sw.lat,
                    swLng: bounds.sw.lng,
                    neLat: bounds.ne.lat,
                    neLng: bounds.ne.lng,
                    precision,
                    // 줌 레벨에 따라 클러스터 반경 조정
                    clusterRadius: zoom <= 3 ? 100 : zoom <= 4 ? 80 : zoom <= 5 ? 60 : 40,
                    // 줌 레벨에 따라 최소 포인트 수 조정
                    minPoints: zoom <= 3 ? 1 : zoom <= 4 ? 2 : zoom <= 5 ? 2 : 3
                };

                // API 호출 직전 최종 파라미터 로깅
                console.log("최종 API 요청 파라미터:", JSON.stringify(params));

                // API 호출 실행
                const resp = await articleApi.getClusters(params);

                // 클러스터 데이터 검증 및 처리
                const clusterData = resp.data || [];
                if (!Array.isArray(clusterData)) {
                    console.error("유효하지 않은 클러스터 데이터:", clusterData);
                    setClusters([]);
                    return;
                }

                console.log(`클러스터 데이터 수신: ${clusterData.length}개`);

                // 클러스터 상태 업데이트
                setClusters(clusterData);

                // 캐시에 저장 (최대 20개 항목으로 제한)
                clusterCache.current.set(cacheKey, clusterData);
                if (clusterCache.current.size > 20) {
                    // 가장 오래된 항목 제거
                    const firstKey = Array.from(clusterCache.current.keys())[0];
                    clusterCache.current.delete(firstKey);
                }

                // 줌 레벨이 정확히 CLUSTER_ZOOM_THRESHOLD(6)인 경우에는 개별 매물과 클러스터를 모두 가져옴
                if (zoom === CLUSTER_ZOOM_THRESHOLD && fetchArticlesRef.current) {
                    fetchArticlesRef.current(0, bounds, false);
                }

            } catch (err) {
                console.error("클러스터 정보 로드 실패:", err);
                setError("클러스터 정보를 불러오는데 실패했습니다.");
                setClusters([]);
            }
        } catch (err) {
            console.error("클러스터 정보 처리 중 오류 발생:", err);
            setError("클러스터 정보를 불러오는데 실패했습니다.");
            setClusters([]);
        }
    }, [CLUSTER_ZOOM_THRESHOLD]);

    // fetchArticles 정의
    const fetchArticles = useCallback(async (pageToFetch: number, currentBounds?: {
        ne: { lat: number; lng: number };
        sw: { lat: number; lng: number }
    }, loadMore = false) => {
        if (!loadMore) {
            setLoading(true);
        }
        setNoMatchingArticles(false);
        setError(null);

        const effectiveBounds = currentBounds || mapBounds;
        if (!effectiveBounds) {
            setLoading(false);
            return;
        }

        // 즉시 클러스터 모드 해제 (줌 레벨이 6 미만일 때)
        if (mapZoom < CLUSTER_ZOOM_THRESHOLD) {
            // 클러스터 상태 초기화
            setClusters([]);
            setIsClusterMode(false);
            console.log(`매물 핀 모드로 전환: zoom=${mapZoom}`);
        }
        // 줌 레벨이 6 이상이면 클러스터 모드로 유지
        else if (mapZoom >= CLUSTER_ZOOM_THRESHOLD) {
            // 클러스터 데이터 요청 (이미 클러스터 모드로 전환된 상태에서 추가 데이터 요청)
            await fetchClusters(effectiveBounds, mapZoom);

            // 줌 레벨이 CLUSTER_ZOOM_THRESHOLD(6) 이상인 경우, 개별 매물은 표시하지 않고 클러스터만 표시
            if (mapZoom >= CLUSTER_ZOOM_THRESHOLD) {
                setVisibleMapArticles([]);
                setAllPaginatedArticles([]);
                setLoading(false);
                return;
            }
        }

        // 줌 레벨이 CLUSTER_ZOOM_THRESHOLD(6) 이상이고 클러스터 모드인 경우 매물 데이터는 요청하지 않음
        if (mapZoom >= CLUSTER_ZOOM_THRESHOLD && isClusterMode) {
            setLoading(false);
            return;
        }

        console.log(`매물 데이터 요청: zoom=${mapZoom}, 페이지=${pageToFetch}`);

        const params: any = {
            size: showMapBoundList ? 100000 : PAGE_SIZE,
            // 정렬 필드와 방향을 분리하여 전달 (백엔드에 따라 필요할 수 있음)
            sortBy: sortField,
            direction: sortOrder,
            // 기본 정렬 형식도 유지 (백엔드가 이 형식을 사용할 수 있음)
            sort: `${sortField},${sortOrder}`,
            // 필요한 필드만 가져오도록 최적화
            fields: "id,latitude,longitude,title,description,price,priceRent,priceSale,tradeType,realEstateType,address,imageUrls,thumbnail,confirmedAt,complexId"
        };

        if (!showMapBoundList) {
            params.page = pageToFetch;
        }

        // 디버깅: 필터 상태 로깅
        console.log("필터 적용 상태:", {
            typeFilter,
            tradeTypeFilter,
            minSalePrice,
            maxSalePrice,
            minRentPrice,
            maxRentPrice,
            sortField,
            sortOrder
        });

        // 매물 유형 필터 적용
        if (typeFilter && typeFilter.length > 0) {
            params.realEstateType = typeFilter;
            // 백엔드 API와의 호환성을 위해 추가 형식으로도 전송
            params.buildingType = typeFilter;
        }

        // 거래 유형 필터 적용
        if (tradeTypeFilter && tradeTypeFilter.length > 0) {
            params.tradeType = tradeTypeFilter;
            // 백엔드 API와의 호환성을 위해 추가 형식으로도 전송
            params.trade_type = tradeTypeFilter;
        }

        // 가격 필터 적용
        if (minSalePrice > 0) {
            params.minSalePrice = minSalePrice;
            params.min_price_sale = minSalePrice;
        }

        if (maxSalePrice > 0) {
            params.maxSalePrice = maxSalePrice;
            params.max_price_sale = maxSalePrice;
        }

        if (minRentPrice > 0) {
            params.minRentPrice = minRentPrice;
            params.min_price_rent = minRentPrice;
        }

        if (maxRentPrice > 0) {
            params.maxRentPrice = maxRentPrice;
            params.max_price_rent = maxRentPrice;
        }

        let regionFilterApplied = false;
        if (selectedNeighborhood.length > 0) {
            const neighborhood = neighborhoodOptions.find(r => r.cortarName === selectedNeighborhood[0]);
            if (neighborhood?.cortarNo) {
                params.regionPrefix = neighborhood.cortarNo;
                regionFilterApplied = true;
            }
        } else if (selectedDistrict) {
            const district = districtOptions.find(r => r.cortarName === selectedDistrict);
            if (district?.cortarNo) {
                params.regionPrefix = district.cortarNo.substring(0, 5);
                regionFilterApplied = true;
            }
        } else if (selectedCity) {
            const city = cityOptions.find(r => r.cortarName === selectedCity);
            if (city?.cortarNo) {
                params.regionPrefix = city.cortarNo.substring(0, 2);
                regionFilterApplied = true;
            }
        }
        setIsRegionFiltered(regionFilterApplied);

        params.neLat = effectiveBounds.ne.lat;
        params.neLng = effectiveBounds.ne.lng;
        params.swLat = effectiveBounds.sw.lat;
        params.swLng = effectiveBounds.sw.lng;

        // 검색 타입 결정 (bounds, region, default)
        // 지역 필터가 적용된 경우 먼저 region 타입 적용
        if (regionFilterApplied && params.regionPrefix) {
            params.type = 'region';
        }
        // 지도 바운드가 적용된 경우 bounds 타입 적용
        else if (effectiveBounds.ne.lat && effectiveBounds.ne.lng && effectiveBounds.sw.lat && effectiveBounds.sw.lng) {
            params.type = 'bounds';
        }
        // 그 외 모든 경우 default 타입 적용 (일반 필터링)
        else {
            params.type = 'default';
        }

        // 기타 필터가 적용된 경우 default 타입으로 강제 변경
        // 백엔드에서 bounds, region 타입일 때 필터를 무시할 수 있으므로
        const hasAdditionalFilters = (
            (typeFilter && typeFilter.length > 0) ||
            (tradeTypeFilter && tradeTypeFilter.length > 0) ||
            minSalePrice > 0 ||
            maxSalePrice > 0 ||
            minRentPrice > 0 ||
            maxRentPrice > 0
        );

        // 추가 필터가 있고 타입이 bounds이거나 region인 경우 default 타입으로 변경
        if (hasAdditionalFilters && (params.type === 'bounds' || params.type === 'region')) {
            console.log(`필터가 적용되어 검색 타입을 default로 변경: 이전=${params.type}, 필터=`, {
                typeFilter,
                tradeTypeFilter,
                minSalePrice,
                maxSalePrice,
                minRentPrice,
                maxRentPrice
            });
            params.type = 'default';
        }

        console.log(`최종 검색 타입: ${params.type} (지역필터=${regionFilterApplied}, 추가필터=${hasAdditionalFilters})`);

        try {
            // API 호출 직전 최종 파라미터 로깅
            console.log("최종 API 요청 파라미터:", JSON.stringify(params));

            const response = await articleApi.getAllArticles(params);
            console.log(`API 응답 상태: ${response.status} ${response.statusText}`);

            // 원본 데이터 로깅
            const raw = response.data;
            console.log("원본 API 응답 데이터 구조:", {
                has_embedded: !!raw._embedded,
                has_content: !!raw.content,
                is_array: Array.isArray(raw),
                has_data: !!(raw && raw.data),
                data_structure: raw ? Object.keys(raw) : []
            });

            let fetchedArticles: ArticleResponse[] = [];
            let links: any = {};
            let pageInfo: any = {};

            // 응답 구조에 따라 데이터 추출
            if (raw._embedded) {
                fetchedArticles = raw._embedded.articles || raw._embedded.articleResponseList || [];
            } else if (raw.content && Array.isArray(raw.content)) {
                fetchedArticles = raw.content;
                pageInfo = {
                    totalElements: raw.totalElements,
                    totalPages: raw.totalPages,
                    number: raw.number,
                    last: raw.last
                };
            } else if (raw.data && Array.isArray(raw.data)) {
                // API가 { success: true, data: [...] } 형식으로 응답할 경우
                fetchedArticles = raw.data;
            } else if (Array.isArray(raw)) {
                // API가 직접 배열을 반환하는 경우
                fetchedArticles = raw;
            }
            links = raw._links || {};

            // 백엔드 API가 필터를 적용하지 않는 경우를 대비해 프론트엔드에서 추가 필터링
            if (fetchedArticles.length > 0) {
                console.log("백엔드 응답에 대한 추가 필터링 수행");

                // 매물 유형 필터링
                if (typeFilter && typeFilter.length > 0) {
                    console.log(`매물 유형 기준 필터링 전: ${fetchedArticles.length}개, 필터:`, typeFilter);

                    // 필터링 전 데이터의 buildingType 종류 확인
                    const existingTypes = [...new Set(fetchedArticles.map(article => article.buildingType))];
                    console.log(`데이터에 존재하는 매물 유형:`, existingTypes);

                    // 디버깅을 위한 표본 데이터 로깅
                    if (fetchedArticles.length > 0) {
                        console.log(`첫 번째 매물의 buildingType: "${fetchedArticles[0].buildingType}"`);
                    }

                    // 필터링 로직 수정 - 케이스 무시하고 포함 여부 확인
                    fetchedArticles = fetchedArticles.filter(article => {
                        // null 체크
                        if (!article.buildingType) return false;

                        // 대소문자 무시하고 비교
                        const matched = typeFilter.some(type =>
                            article.buildingType.toLowerCase() === type.toLowerCase()
                        );

                        return matched;
                    });
                    console.log(`매물 유형 기준 필터링 후: ${fetchedArticles.length}개`);
                }

                // 거래 유형 필터링
                if (tradeTypeFilter && tradeTypeFilter.length > 0) {
                    console.log(`거래 유형 기준 필터링 전: ${fetchedArticles.length}개, 필터:`, tradeTypeFilter);

                    // 필터링 전 데이터의 tradeType 종류 확인
                    const existingTradeTypes = [...new Set(fetchedArticles.map(article => article.tradeType))];
                    console.log(`데이터에 존재하는 거래 유형:`, existingTradeTypes);

                    // 디버깅을 위한 표본 데이터 로깅
                    if (fetchedArticles.length > 0) {
                        console.log(`첫 번째 매물의 tradeType: "${fetchedArticles[0].tradeType}"`);
                    }

                    // 필터링 로직 수정 - 케이스 무시하고 포함 여부 확인
                    fetchedArticles = fetchedArticles.filter(article => {
                        // null 체크
                        if (!article.tradeType) return false;

                        // 대소문자 무시하고 비교
                        const matched = tradeTypeFilter.some(type =>
                            article.tradeType.toLowerCase() === type.toLowerCase()
                        );

                        return matched;
                    });
                    console.log(`거래 유형 기준 필터링 후: ${fetchedArticles.length}개`);
                }

                // 가격 필터링 - 매매가/보증금
                if (minSalePrice > 0 || maxSalePrice > 0) {
                    console.log(`매매가/보증금 기준 필터링 전: ${fetchedArticles.length}개`);
                    fetchedArticles = fetchedArticles.filter(article => {
                        // 가격 정보가 없으면 제외
                        if (article.priceSale === undefined || article.priceSale === null) return false;

                        // 최소 가격 필터
                        if (minSalePrice > 0 && article.priceSale < minSalePrice) return false;

                        // 최대 가격 필터
                        if (maxSalePrice > 0 && article.priceSale > maxSalePrice) return false;

                        return true;
                    });
                    console.log(`매매가/보증금 기준 필터링 후: ${fetchedArticles.length}개`);
                }

                // 가격 필터링 - 월세
                if (minRentPrice > 0 || maxRentPrice > 0) {
                    console.log(`월세 기준 필터링 전: ${fetchedArticles.length}개`);
                    fetchedArticles = fetchedArticles.filter(article => {
                        // 월세 매물이 아니면 제외하지 않음
                        if (article.tradeType !== "월세") return true;

                        // 가격 정보가 없으면 제외
                        if (article.priceRent === undefined || article.priceRent === null) return false;

                        // 최소 월세 필터
                        if (minRentPrice > 0 && article.priceRent < minRentPrice) return false;

                        // 최대 월세 필터
                        if (maxRentPrice > 0 && article.priceRent > maxRentPrice) return false;

                        return true;
                    });
                    console.log(`월세 기준 필터링 후: ${fetchedArticles.length}개`);
                }

                // 정렬 적용 (프론트엔드에서)
                if (sortField && sortOrder) {
                    console.log(`정렬 적용: ${sortField} ${sortOrder}`);
                    fetchedArticles.sort((a, b) => {
                        const fieldA = a[sortField as keyof ArticleResponse];
                        const fieldB = b[sortField as keyof ArticleResponse];

                        if (fieldA === undefined || fieldB === undefined) return 0;

                        // 문자열 또는 숫자 비교
                        const compareResult =
                            typeof fieldA === 'string' && typeof fieldB === 'string'
                                ? fieldA.localeCompare(fieldB)
                                : (Number(fieldA) - Number(fieldB));

                        // 정렬 방향에 따라 결과 반환
                        return sortOrder.toLowerCase() === 'asc' ? compareResult : -compareResult;
                    });
                }

                // 정렬 및 필터링이 모두 완료된 최종 데이터 로깅
                console.log("필터링 및 정렬 완료 후 매물 데이터:", {
                    최종_매물_수: fetchedArticles.length,
                    매물_유형_종류: [...new Set(fetchedArticles.map(article => article.buildingType))],
                    거래_유형_종류: [...new Set(fetchedArticles.map(article => article.tradeType))],
                    가격_범위_매매: fetchedArticles.length > 0 ? {
                        최소: Math.min(...fetchedArticles.filter(a => a.priceSale !== undefined && a.priceSale !== null).map(a => a.priceSale)),
                        최대: Math.max(...fetchedArticles.filter(a => a.priceSale !== undefined && a.priceSale !== null).map(a => a.priceSale))
                    } : {},
                    가격_범위_월세: fetchedArticles.length > 0 ? {
                        최소: Math.min(...fetchedArticles.filter(a => a.priceRent !== undefined && a.priceRent !== null).map(a => a.priceRent)),
                        최대: Math.max(...fetchedArticles.filter(a => a.priceRent !== undefined && a.priceRent !== null).map(a => a.priceRent))
                    } : {},
                    첫번째_매물: fetchedArticles.length > 0 ? {
                        id: fetchedArticles[0].id,
                        building_type: fetchedArticles[0].buildingType,
                        trade_type: fetchedArticles[0].tradeType,
                        price_sale: fetchedArticles[0].priceSale,
                        price_rent: fetchedArticles[0].priceRent,
                        confirmed_at: fetchedArticles[0].confirmedAt
                    } : null
                });
            }

            console.log("처리된 매물 데이터:", {
                가져온_매물_수: fetchedArticles?.length || 0,
                첫번째_매물: fetchedArticles?.length > 0 ? fetchedArticles[0] : null
            });

            // 데이터가 너무 많은 경우 제한
            fetchedArticles = fetchedArticles.slice(0, 100000);

            if (showMapBoundList) {
                setVisibleMapArticles(fetchedArticles);
                setAllPaginatedArticles([]);
                setTotalArticleCount(fetchedArticles.length);
                if (fetchedArticles.length === 0 && (regionFilterApplied || mapZoom < MAP_BOUND_LIST_ZOOM_LEVEL)) {
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
    }, [isClusterMode, mapZoom, sortField, sortOrder, typeFilter, tradeTypeFilter, minSalePrice, maxSalePrice, minRentPrice, maxRentPrice, selectedNeighborhood, selectedCity, selectedDistrict, showMapBoundList, mapBounds, filterArticlesInBounds, neighborhoodOptions, districtOptions, cityOptions, allPaginatedArticles.length]);

    // 함수 참조 업데이트 (함수 정의 후 참조 저장)
    useEffect(() => {
        fetchClustersRef.current = fetchClusters;
    }, [fetchClusters]);

    useEffect(() => {
        fetchArticlesRef.current = fetchArticles;
    }, [fetchArticles]);

    useEffect(() => {
        loadMoreClusterArticlesRef.current = loadMoreClusterArticles;
    }, [loadMoreClusterArticles]);

    // 필터 상태가 변경될 때마다 데이터 갱신
    useEffect(() => {
        console.log("필터 상태 변경 감지:", {
            typeFilter,
            tradeTypeFilter,
            minSalePrice,
            maxSalePrice,
            minRentPrice,
            maxRentPrice,
            sortField,
            sortOrder
        });

        // 초기 로딩 시에는 실행하지 않음 (컴포넌트 마운트 시)
        if (currentPage === 0 && allPaginatedArticles.length === 0 && visibleMapArticles.length === 0) {
            console.log("초기 로딩 중, 필터 변경으로 인한 데이터 갱신 건너뜀");
            return;
        }

        // 일정 시간 후에 데이터 갱신 (여러 필터가 동시에 변경되는 경우 중복 요청 방지)
        const timer = setTimeout(() => {
            console.log("필터 변경으로 인한 데이터 다시 로드");
            // 필터링 로직 적용을 위해 type 파라미터 조정은 fetchArticles 내부에서 처리됨
            fetchArticles(0, mapBounds, false);
        }, 300); // 300ms 디바운스

        // 클린업 함수로 타이머 제거
        return () => clearTimeout(timer);
    }, [typeFilter, tradeTypeFilter, minSalePrice, maxSalePrice, minRentPrice, maxRentPrice, sortField, sortOrder]);

    // 초기 데이터 로딩
    useEffect(() => {
        fetchArticles(0, mapBounds, false);
    }, []);

    const handleArticleClick = async (article: ArticleResponse) => {
        setSelectedArticle(article);
        setSelectedComplex(null);
        if (article.complexId) {
            try {
                const response = await articleApi.getComplex(article.complexId);
                if (response.data.success) {
                    setSelectedComplex(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching complex:', error);
            }
        }
        setDetailVisible(true);
    };

    const handleBack = () => {
        setSelectedArticle(null);
        setSelectedComplex(null);
        setDetailVisible(false);
        setCurrentClusterInfo(null); // 클러스터 정보 초기화
        navigate(-1);
    };

    const handleDetailClose = () => {
        setDetailVisible(false);
        // 애니메이션이 완료된 후 선택된 매물 정보 초기화
        setTimeout(() => {
            setSelectedArticle(null);
            setSelectedComplex(null);
        }, 500); // 애니메이션 시간(0.5초)과 일치시킴
    };

    const handleRegionFilterChange = () => {
        console.log("지역 필터 변경 감지");
        setShowMapBoundList(true);
        setCurrentPage(0);
        setHasMore(true);
        setAllPaginatedArticles([]);
        setVisibleMapArticles([]);

        // 현재 선택된 지역 필터 정보 로깅
        let regionFilterInfo = '';
        if (selectedNeighborhood.length > 0) {
            regionFilterInfo = selectedNeighborhood[0];
        } else if (selectedDistrict) {
            regionFilterInfo = selectedDistrict;
        } else if (selectedCity) {
            regionFilterInfo = selectedCity;
        }

        console.log(`지역 필터 적용: ${regionFilterInfo || '없음'}`);

        // 지역 필터 적용 여부에 따라 백엔드에서 다른 검색 방식 사용
        // fetchArticles 함수에서 params.type = 'region' 으로 자동 설정
        fetchArticles(0, mapBounds, false);
    };

    const handleCitySelect = (value: string) => {
        setSelectedCity(value);
        setSelectedDistrict("");
        setSelectedNeighborhood([]);
        setRegionSelectStep('district');
        const districts = getDistrictOptions(value);
        setDistrictOptions(districts);
        handleRegionFilterChange();
    };

    const handleDistrictSelect = async (value: string) => {
        setSelectedDistrict(value);
        setSelectedNeighborhood([]);
        setRegionSelectStep('neighborhood');
        const district = districtOptions.find(r => r.cortarName === value);
        if (district?.cortarNo) {
            try {
                const prefix = district.cortarNo.substring(0, 5);
                console.log(`구/군 선택: ${value}, cortarNo: ${district.cortarNo}, prefix: ${prefix}`);

                // 'sec' 레벨 파라미터를 추가하여 동/읍/면 데이터만 요청
                const res = await regionApi.getChildRegions('sec');

                if (res.data.success) {
                    console.log(`지역 API 응답 - 데이터 개수: ${res.data.data.length}`);

                    // 동/읍/면 필터링 - 기본적으로 API에서 필터링되어 오지만 추가 필터링
                    const neighborhoods = res.data.data.filter(r =>
                        r.cortarNo.startsWith(prefix) && !r.cortarNo.endsWith("00000")
                    );

                    console.log(`필터링 후 동/읍/면 개수: ${neighborhoods.length}`);

                    // 결과가 없으면 API를 다시 호출하여 모든 하위 지역 가져오기
                    if (neighborhoods.length === 0) {
                        console.log("동/읍/면 데이터가 없어 모든 하위 지역을 요청합니다.");
                        const fallbackRes = await regionApi.getChildRegions(prefix);

                        if (fallbackRes.data.success) {
                            const fallbackNeighborhoods = fallbackRes.data.data.filter(r =>
                                r.cortarNo.startsWith(prefix) && r.cortarNo !== district.cortarNo
                            );

                            console.log(`대체 방법으로 가져온 지역 개수: ${fallbackNeighborhoods.length}`);

                            // Map RegionResponse to Region
                            const mappedFallbackNeighborhoods = fallbackNeighborhoods.map((r, index) => ({
                                ...r,
                                id: r.cortarNo ? parseInt(r.cortarNo) : index
                            }));

                            setNeighborhoodOptions(mappedFallbackNeighborhoods);
                            handleRegionFilterChange();
                            return;
                        }
                    }

                    // Map RegionResponse to Region by adding required id property
                    const mappedNeighborhoods = neighborhoods.map((r, index) => ({
                        ...r,
                        id: r.cortarNo ? parseInt(r.cortarNo) : index
                    }));
                    setNeighborhoodOptions(mappedNeighborhoods);
                } else {
                    console.error("지역 API 오류:", res.data);
                    setNeighborhoodOptions([]);
                }
            } catch (err) {
                console.error("Failed to load neighborhoods:", err);
                setNeighborhoodOptions([]);
            }
        } else {
            setNeighborhoodOptions([]);
        }
        handleRegionFilterChange();
    };

    const handleNeighborhoodSelect = (value: string) => {
        setSelectedNeighborhood([value]);
        handleRegionPopoverClose();
        handleRegionFilterChange();
    };

    const handleResetRegion = () => {
        setSelectedCity("");
        setSelectedDistrict("");
        setSelectedNeighborhood([]);
        setIsRegionFiltered(false);
        setRegionSelectStep('city');
        setCurrentClusterInfo(null); // 클러스터 정보 초기화
        handleRegionPopoverClose();
        setShowMapBoundList(false);
        setCurrentPage(0);
        setHasMore(true);
        setAllPaginatedArticles([]);
        setVisibleMapArticles([]);
        fetchArticles(0, mapBounds, false);
    };

    const formatPriceToKorean = (price: number): string => {
        if (price >= 10000) {
            const uk = Math.floor(price / 10000);
            const rest = price % 10000;
            if (rest === 0) {
                return `${uk}억`;
            } else {
                const chun = Math.floor(rest / 1000);
                const remainder = rest % 1000;
                if (chun > 0 && remainder === 0) {
                    return `${uk}억 ${chun}천`;
                } else if (chun > 0) {
                    return `${uk}억 ${chun}천${remainder}`;
                } else {
                    return `${uk}억 ${rest}`;
                }
            }
        } else if (price >= 1000) {
            const chun = Math.floor(price / 1000);
            const remainder = price % 1000;
            if (remainder === 0) {
                return `${chun}천`;
            } else {
                return `${chun}천${remainder}`;
            }
        } else {
            return `${price}`;
        }
    };
    const handleSalePriceButtonClick = (price: number) => {
        if (minSalePrice === 0) {
            setMinSalePrice(price);
            setMaxSalePrice(price);
        } else {
            if (price < minSalePrice) {
                setMinSalePrice(price);
            } else if (price > maxSalePrice) {
                setMaxSalePrice(price);
            }
        }
        // useEffect에서 상태 변경을 감지하여 데이터 갱신
    };
    const handleRentPriceButtonClick = (price: number) => {
        if (minRentPrice === 0) {
            setMinRentPrice(price);
            setMaxRentPrice(price);
        } else {
            if (price < minRentPrice) {
                setMinRentPrice(price);
            } else if (price > maxRentPrice) {
                setMaxRentPrice(price);
            }
        }
        // useEffect에서 상태 변경을 감지하여 데이터 갱신
    };
    const handleMinSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMinPrice = e.target.value === '' ? 0 : Number(e.target.value);
        setMinSalePrice(newMinPrice);
        if (!isNaN(newMinPrice) && maxSalePrice > 0) {
            if (newMinPrice > maxSalePrice) {
                setMaxSalePrice(newMinPrice);
            }
        } else if (isNaN(newMinPrice)) {
            setMaxSalePrice(0);
        }
        // useEffect에서 상태 변경을 감지하여 데이터 갱신
    };
    const handleMaxSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMaxPrice = e.target.value === '' ? 0 : Number(e.target.value);
        setMaxSalePrice(newMaxPrice);
        if (!isNaN(newMaxPrice) && minSalePrice > 0) {
            if (newMaxPrice < minSalePrice) {
                setMinSalePrice(newMaxPrice);
            }
        } else if (isNaN(newMaxPrice)) {
            setMaxSalePrice(0);
        }
        // 가격 변경 시 적용 (디바운스를 위해 setTimeout 사용)
        setTimeout(() => fetchArticles(0, mapBounds, false), 500);
    };
    const handleMinRentPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMinPrice = e.target.value === '' ? 0 : Number(e.target.value);
        setMinRentPrice(newMinPrice);
        if (!isNaN(newMinPrice) && maxRentPrice > 0) {
            if (newMinPrice > maxRentPrice) {
                setMaxRentPrice(newMinPrice);
            }
        } else if (isNaN(newMinPrice)) {
            setMaxRentPrice(0);
        }
        // 가격 변경 시 적용 (디바운스를 위해 setTimeout 사용)
        setTimeout(() => fetchArticles(0, mapBounds, false), 500);
    };
    const handleMaxRentPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMaxPrice = e.target.value === '' ? 0 : Number(e.target.value);
        setMaxRentPrice(newMaxPrice);
        if (!isNaN(newMaxPrice) && minRentPrice > 0) {
            if (newMaxPrice < minRentPrice) {
                setMinRentPrice(newMaxPrice);
            }
        } else if (isNaN(newMaxPrice)) {
            setMaxRentPrice(0);
        }
        // 가격 변경 시 적용 (디바운스를 위해 setTimeout 사용)
        setTimeout(() => fetchArticles(0, mapBounds, false), 500);
    };
    const handleResetSalePrices = () => {
        setMinSalePrice(0);
        setMaxSalePrice(0);
        fetchArticles(0, mapBounds, false);
    };
    const handleResetRentPrices = () => {
        setMinRentPrice(0);
        setMaxRentPrice(0);
        fetchArticles(0, mapBounds, false);
    };
    const handleResetAllPrices = () => {
        handleResetSalePrices();
        handleResetRentPrices();
    };

    const handleRegionPopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        setCityOptions(getCityOptions());
        setRegionPopoverAnchor(event.currentTarget);
        setRegionSelectStep('city');
    };
    const handleRegionPopoverClose = () => setRegionPopoverAnchor(null);
    const isRegionPopoverOpen = Boolean(regionPopoverAnchor);
    const articlesToDisplay = (currentClusterInfo || showMapBoundList) ? visibleMapArticles : allPaginatedArticles;

    const getDisplayedTradeTypeCounts = useCallback(() => {
        const counts = {매매: 0, 전세: 0, 월세: 0, 기타: 0, 총계: 0};
        const list = showMapBoundList ? visibleMapArticles : allPaginatedArticles;

        list.forEach(article => {
            counts.총계++;
            if (article.tradeType === "매매") counts.매매++;
            else if (article.tradeType === "전세") counts.전세++;
            else if (article.tradeType === "월세") counts.월세++;
            else counts.기타++;
        });
        return counts;
    }, [showMapBoundList, visibleMapArticles, allPaginatedArticles]);

    const handleFilterChange = (filters: any) => {
        console.log("필터 변경:", filters);
        let hasChanges = false;

        if (filters.typeFilter !== undefined) {
            setTypeFilter(filters.typeFilter);
            hasChanges = true;
        }
        if (filters.tradeTypeFilter !== undefined) {
            setTradeTypeFilter(filters.tradeTypeFilter);
            hasChanges = true;
        }
        if (filters.minSalePrice !== undefined) {
            setMinSalePrice(filters.minSalePrice);
            hasChanges = true;
        }
        if (filters.maxSalePrice !== undefined) {
            setMaxSalePrice(filters.maxSalePrice);
            hasChanges = true;
        }
        if (filters.minRentPrice !== undefined) {
            setMinRentPrice(filters.minRentPrice);
            hasChanges = true;
        }
        if (filters.maxRentPrice !== undefined) {
            setMaxRentPrice(filters.maxRentPrice);
            hasChanges = true;
        }
        if (filters.sortField !== undefined) {
            setSortField(filters.sortField);
            hasChanges = true;
        }
        if (filters.sortOrder !== undefined) {
            setSortOrder(filters.sortOrder);
            hasChanges = true;
        }

        // 필터 변경 즉시 데이터 갱신
        if (hasChanges) {
            console.log("필터가 변경되어 즉시 데이터 갱신 실행");
            // 현재 지도 바운드와 필터 상태 기반으로 검색
            fetchArticles(0, mapBounds, false);
        }
    };

    const [listVisibility, setListVisibility] = useState<'visible' | 'hidden'>('visible');

    useEffect(() => {
        if (showList) {
            setListVisibility('visible');
        } else {
            const timer = setTimeout(() => {
                setListVisibility('hidden');
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [showList]);

    // 필터링된 유효한 매물 목록 메모이제이션 추가
    const validArticles = useMemo(() => {
        const articles = showMapBoundList ? visibleMapArticles : allPaginatedArticles;
        return articles.filter(article =>
            article.latitude && article.longitude &&
            !isNaN(Number(article.latitude)) && !isNaN(Number(article.longitude))
        );
    }, [showMapBoundList, visibleMapArticles, allPaginatedArticles]);

    // 필터 초기화 함수
    const handleResetFilters = useCallback(() => {
        console.log("모든 필터 초기화");
        setTypeFilter([]);
        setTradeTypeFilter([]);
        setMinSalePrice(0);
        setMaxSalePrice(0);
        setMinRentPrice(0);
        setMaxRentPrice(0);
        setSortField("confirmedAt");
        setSortOrder("desc");
        fetchArticles(0, mapBounds, false);
    }, [mapBounds]);

    return (
        <Box
            sx={{
                width: '100%',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            <GlobalStyles
                styles={{
                    '@keyframes slideIn': {
                        '0%': {
                            transform: 'translateX(100%)',
                            opacity: 0
                        },
                        '100%': {
                            transform: 'translateX(0)',
                            opacity: 0.95
                        }
                    },
                    '@keyframes slideOut': {
                        '0%': {
                            transform: 'translateX(0)',
                            opacity: 0.95
                        },
                        '100%': {
                            transform: 'translateX(100%)',
                            opacity: 0
                        }
                    },
                    '@media (max-width: 768px)': {
                        '.article-list-container': {
                            flexDirection: 'column !important',
                            height: '100vh !important',
                            position: 'relative !important'
                        },
                        '.map-container': {
                            flex: '2 !important',
                            height: '50% !important',
                            minHeight: '50vh !important',
                            width: '100% !important',
                            transition: 'height 0.3s ease-in-out !important'
                        },
                        '.list-container': {
                            flex: '1 !important',
                            width: '100% !important',
                            minWidth: '100% !important',
                            maxWidth: '100% !important',
                            height: '25% !important',
                            minHeight: '25vh !important',
                            borderLeft: 'none !important',
                            borderTop: '1px solid #ddd !important',
                            position: 'relative !important',
                            zIndex: '1 !important',
                            transition: 'height 0.3s ease-in-out !important'
                        },
                        // 리스트가 숨겨졌을 때 지도 영역이 전체를 채우도록 함
                        '.list-hidden .map-container': {
                            height: 'calc(100vh - 56px) !important',
                            minHeight: 'calc(100vh - 56px) !important'
                        },
                        // 동일 위치 매물 리스트가 열렸을 때 지도와 리스트의 비율 조정
                        '.same-location-open .map-container': {
                            flex: '2 !important',
                            height: '50% !important'
                        },
                        '.same-location-open .list-container': {
                            flex: '1 !important',
                            height: '25% !important'
                        }
                    }
                }}
            />
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={handleBack}>
                        <ArrowBackIcon/>
                    </IconButton>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleRegionPopoverOpen}
                        startIcon={<LocationOnIcon/>}
                        sx={{
                            borderRadius: '16px',
                            height: '32px',
                            mr: 1,
                            textTransform: 'none',
                            borderColor: '#007AFF',
                            color: '#007AFF'
                        }}
                    >
                        {selectedCity && <span style={{fontWeight: 'bold'}}>{selectedCity}</span>}
                        {selectedDistrict && <span>&nbsp;&gt;&nbsp;{selectedDistrict}</span>}
                        {selectedNeighborhood.length > 0 && <span>&nbsp;&gt;&nbsp;{selectedNeighborhood[0]}</span>}
                        {!selectedCity && '지역 선택'}
                    </Button>
                    <Popover
                        open={isRegionPopoverOpen}
                        anchorEl={regionPopoverAnchor}
                        onClose={handleRegionPopoverClose}
                        anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                        transformOrigin={{vertical: 'top', horizontal: 'center'}}
                        PaperProps={{style: {width: '400px', maxHeight: '500px'}}}
                    >
                        <Box sx={{p: 2}}>
                            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2}}>
                                <Typography variant="h6">지역 선택</Typography>
                                <Button size="small" onClick={handleResetRegion} startIcon={<span>↺</span>}>초기화</Button>
                            </Box>
                            <Box sx={{display: 'flex', borderBottom: '1px solid #eee', mb: 2}}>
                                <Button sx={{
                                    fontWeight: regionSelectStep === 'city' ? 'bold' : 'normal',
                                    color: regionSelectStep === 'city' ? 'primary.main' : 'text.secondary',
                                    borderBottom: regionSelectStep === 'city' ? '2px solid #007AFF' : 'none',
                                    borderRadius: 0,
                                    mr: 1
                                }} onClick={() => setRegionSelectStep('city')}
                                        disabled={regionSelectStep === 'city'}>시/도</Button>
                                <Typography sx={{color: 'text.secondary', my: 'auto'}}>{'>'}</Typography>
                                <Button sx={{
                                    fontWeight: regionSelectStep === 'district' ? 'bold' : 'normal',
                                    color: regionSelectStep === 'district' ? 'primary.main' : 'text.secondary',
                                    borderBottom: regionSelectStep === 'district' ? '2px solid #007AFF' : 'none',
                                    borderRadius: 0,
                                    mx: 1
                                }} onClick={() => setRegionSelectStep('district')}
                                        disabled={!selectedCity || regionSelectStep === 'district'}>시/군/구</Button>
                                <Typography sx={{color: 'text.secondary', my: 'auto'}}>{'>'}</Typography>
                                <Button sx={{
                                    fontWeight: regionSelectStep === 'neighborhood' ? 'bold' : 'normal',
                                    color: regionSelectStep === 'neighborhood' ? 'primary.main' : 'text.secondary',
                                    borderBottom: regionSelectStep === 'neighborhood' ? '2px solid #007AFF' : 'none',
                                    borderRadius: 0,
                                    ml: 1
                                }} onClick={() => setRegionSelectStep('neighborhood')}
                                        disabled={!selectedDistrict || regionSelectStep === 'neighborhood'}>읍/면/동</Button>
                            </Box>
                            {regionSelectStep === 'city' && (
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 1,
                                    maxHeight: '350px',
                                    overflowY: 'auto',
                                    p: 1
                                }}>
                                    {cityOptions.map((city) => <Button key={city.id}
                                                                       variant={selectedCity === city.cortarName ? 'contained' : 'outlined'}
                                                                       onClick={() => handleCitySelect(city.cortarName)}
                                                                       sx={{textTransform: 'none'}}>{city.cortarName}</Button>)}
                                </Box>
                            )}
                            {regionSelectStep === 'district' && (
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 1,
                                    maxHeight: '350px',
                                    overflowY: 'auto',
                                    p: 1
                                }}>
                                    {districtOptions.map((district) => <Button key={district.id}
                                                                               variant={selectedDistrict === district.cortarName ? 'contained' : 'outlined'}
                                                                               onClick={() => handleDistrictSelect(district.cortarName)}
                                                                               sx={{textTransform: 'none'}}>{district.cortarName}</Button>)}
                                </Box>
                            )}
                            {regionSelectStep === 'neighborhood' && (
                                <Box sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 1,
                                    maxHeight: '350px',
                                    overflowY: 'auto',
                                    p: 1
                                }}>
                                    {neighborhoodOptions.length > 0 ? (
                                        neighborhoodOptions.map((neighborhood) => <Button key={neighborhood.id}
                                                                                          variant={selectedNeighborhood[0] === neighborhood.cortarName ? 'contained' : 'outlined'}
                                                                                          onClick={() => handleNeighborhoodSelect(neighborhood.cortarName)}
                                                                                          sx={{textTransform: 'none'}}>{neighborhood.cortarName}</Button>)
                                    ) : <Typography variant="body2"
                                                    sx={{p: 2, gridColumn: '1 / span 2', textAlign: 'center'}}>검색결과가
                                        없습니다.</Typography>}
                                </Box>
                            )}
                        </Box>
                    </Popover>
                    <Box sx={{flexGrow: 1}}/>
                    <IconButton
                        color="inherit"
                        onClick={() => setShowList(!showList)}
                        title={showList ? "지도만 보기" : "목록 보기"}
                        sx={{
                            transition: 'all 0.2s ease-in-out',
                            transform: showList ? 'rotate(0deg)' : 'rotate(180deg)',
                        }}
                    >
                        {showList ? <ViewMapIcon/> : <ViewListIcon/>}
                    </IconButton>
                    <IconButton color="inherit" onClick={() => setIsFilterDrawerOpen(true)} title="필터">
                        <FilterListIcon/>
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box
                className={`article-list-container ${!showList ? 'list-hidden' : ''}`}
                sx={{
                    position: 'relative',
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex'
                }}
            >
                {showMap && (
                    <Box
                        className="map-container"
                        sx={{
                            flex: showList ? 3 : 1,
                            height: '100%',
                            transition: 'flex 0.3s ease-in-out',
                            ...(isMobile && !showList && {
                                height: 'calc(100vh - 56px)',
                                minHeight: 'calc(100vh - 56px)'
                            })
                        }}
                    >
                        <ArticleListMap
                            articles={validArticles}
                            selectedArticle={selectedArticle}
                            selectedRegions={{
                                city: selectedCity,
                                district: selectedDistrict,
                                neighborhoods: selectedNeighborhood
                            }}
                            allRegions={regions}
                            initialCenter={currentLocation}
                            initialZoom={mapZoom}
                            clusterMode={isClusterMode}
                            clusters={processedClusters}
                            onArticleClick={handleArticleClick}
                            onClusterClick={handleClusterClick}
                            onBoundsChanged={handleMapViewChange}
                            mapRef={mapRef}
                            isListHidden={!showList}
                        />
                    </Box>
                )}
                <Box
                    className="list-container"
                    sx={{
                        flex: showList ? 1 : 0,
                        width: showList ? (showMap ? '300px' : '100%') : 0,
                        minWidth: showList ? '300px' : 0,
                        maxWidth: showList ? '300px' : 0,
                        height: '100%',
                        borderLeft: showMap && showList ? '1px solid #ddd' : 'none',
                        opacity: showList ? 0.95 : 0,
                        backgroundColor: 'background.paper',
                        boxShadow: showMap && showList ? '-4px 0 10px rgba(0, 0, 0, 0.05)' : 'none',
                        transform: showList ? 'translateX(0)' : 'translateX(100%)',
                        transition: 'all 0.3s ease-in-out',
                        animation: showList ? 'slideIn 0.3s ease-in-out' : 'slideOut 0.3s ease-in-out',
                        visibility: listVisibility,
                        overflow: 'hidden',
                        position: 'relative',
                        zIndex: 1,
                        '@media (max-width: 768px)': {
                            maxWidth: '100% !important',
                            width: '100% !important',
                            position: 'relative !important',
                            minHeight: '25vh !important',
                            height: '25% !important'
                        }
                    }}
                >
                    {showList && (
                        <ArticleListView
                            articles={articlesToDisplay}
                            selectedArticle={selectedArticle}
                            isLoadingMore={isLoadingMore}
                            hasMore={hasMore}
                            onArticleClick={handleArticleClick}
                            onLoadMore={loadMoreArticles}
                            isClusterView={currentClusterInfo !== null}
                        />
                    )}
                </Box>
            </Box>

            <ArticleDetail
                article={selectedArticle}
                complex={selectedComplex}
                onClose={handleDetailClose}
            />

            <Drawer
                anchor="right"
                open={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                sx={{'& .MuiDrawer-paper': {width: DRAWER_WIDTH, padding: 2}}}
            >
                <Box sx={{p: 2}}>
                    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
                        <Typography variant="h6" gutterBottom>필터</Typography>
                        <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={handleResetFilters}
                            startIcon={<span>↺</span>}
                        >
                            초기화
                        </Button>
                    </Box>
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="sort-field-label">정렬 기준</InputLabel>
                        <Select
                            labelId="sort-field-label"
                            id="sort-field-select"
                            value={`${sortField},${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split(',');
                                const safeField = ALLOWED_SORT_FIELDS.includes(field) ? field : "confirmedAt";
                                const safeOrder = ALLOWED_SORT_DIRECTIONS.includes(order?.toLowerCase()) ? order : "desc";
                                setSortField(safeField);
                                setSortOrder(safeOrder);
                                // useEffect에서 상태 변경을 감지하여 데이터 갱신
                            }}
                        >
                            <MenuItem value="confirmedAt,desc">최신순 - 매물확인일</MenuItem>
                            <MenuItem value="confirmedAt,asc">오래된순 - 매물확인일</MenuItem>
                            <MenuItem value="id,desc">최신순 - 매물등록일</MenuItem>
                            <MenuItem value="id,asc">오래된순 - 매물등록일</MenuItem>
                            <MenuItem value="priceSale,asc">금액낮은순 - 매매가/보증금</MenuItem>
                            <MenuItem value="priceSale,desc">금액높은순 - 매매가/보증금</MenuItem>
                            <MenuItem value="priceRent,asc">금액낮은순 - 월세</MenuItem>
                            <MenuItem value="priceRent,desc">금액높은순 - 월세</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal">
                        <Autocomplete<RealEstateType, true>
                            multiple
                            options={REAL_ESTATE_OPTIONS}
                            value={typeFilter}
                            onChange={(_, newValue) => {
                                console.log("매물 유형 필터 변경:", newValue);
                                setTypeFilter(newValue);
                                // useEffect에서 상태 변경을 감지하여 데이터 갱신
                            }}
                            getOptionLabel={(option) => option}
                            isOptionEqualToValue={(option, value) => option === value}
                            renderInput={(params) => <TextField {...params} label="매물 유형"/>}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => {
                                    const tagProps = getTagProps({index});
                                    return (
                                        <Chip
                                            key={`${option}-${index}`}
                                            label={option}
                                            size="small"
                                            {...Object.fromEntries(
                                                Object.entries(tagProps).filter(([k]) => k !== 'key')
                                            )}
                                        />
                                    );
                                })
                            }
                        />
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <Autocomplete<TradeType, true>
                            multiple
                            options={TRADE_TYPE_OPTIONS}
                            value={tradeTypeFilter}
                            onChange={(_, newValue) => {
                                console.log("거래 유형 필터 변경:", newValue);
                                setTradeTypeFilter(newValue);
                                // useEffect에서 상태 변경을 감지하여 데이터 갱신
                            }}
                            getOptionLabel={(option) => option}
                            isOptionEqualToValue={(option, value) => option === value}
                            renderInput={(params) => <TextField {...params} label="거래 유형"/>}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => {
                                    const tagProps = getTagProps({index});
                                    return (
                                        <Chip
                                            key={`${option}-${index}`}
                                            label={option}
                                            size="small"
                                            {...Object.fromEntries(
                                                Object.entries(tagProps).filter(([k]) => k !== 'key')
                                            )}
                                        />
                                    );
                                })
                            }
                        />
                    </FormControl>

                    <Box sx={{mt: 2}}>
                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>매매가/전세가/보증금</Typography>
                            <Button size="small" variant="text" onClick={handleResetSalePrices}>초기화</Button>
                        </Box>
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
                            {[5000, 6000, 7000, 8000, 9000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000].map((price) => {
                                // 버튼 색상 로직
                                let buttonColor = "primary";
                                let buttonVariant = "outlined";
                                let buttonStyle: { backgroundColor?: string; color?: string } = {};

                                if (minSalePrice > 0 && maxSalePrice > 0 && minSalePrice < maxSalePrice) {
                                    // 최소가격과 최대가격이 모두 설정되고 서로 다른 경우
                                    if (price === minSalePrice) {
                                        // 최소 가격 버튼
                                        buttonVariant = "contained";
                                        buttonColor = "primary";
                                        buttonStyle = {backgroundColor: '#007AFF', color: 'white'};
                                    } else if (price === maxSalePrice) {
                                        // 최대 가격 버튼
                                        buttonVariant = "contained";
                                        buttonColor = "secondary";
                                        buttonStyle = {backgroundColor: '#FF5722', color: 'white'};
                                    } else if (price > minSalePrice && price < maxSalePrice) {
                                        // 범위 내 버튼 (그라데이션 적용)
                                        buttonVariant = "contained";

                                        // 그라데이션 계산 (0~1 사이의 값)
                                        const range = maxSalePrice - minSalePrice;
                                        const position = (price - minSalePrice) / range;

                                        // 시작 색상 (파란색 #007AFF)의 RGB 값
                                        const startRed = 0;
                                        const startGreen = 122;
                                        const startBlue = 255;

                                        // 종료 색상 (주황색 #FF5722)의 RGB 값
                                        const endRed = 255;
                                        const endGreen = 87;
                                        const endBlue = 34;

                                        // 두 색상 사이의 그라데이션 계산
                                        const red = Math.round(startRed + (endRed - startRed) * position);
                                        const green = Math.round(startGreen + (endGreen - startGreen) * position);
                                        const blue = Math.round(startBlue + (endBlue - startBlue) * position);

                                        // 색상 코드로 변환
                                        const gradientColor = `rgb(${red}, ${green}, ${blue})`;

                                        buttonStyle = {backgroundColor: gradientColor, color: 'white'};
                                    }
                                } else if (price === minSalePrice && minSalePrice > 0) {
                                    // 최소 가격만 설정된 경우
                                    buttonVariant = "contained";
                                    buttonColor = "primary";
                                    buttonStyle = {backgroundColor: '#007AFF', color: 'white'};
                                } else if (price === maxSalePrice && maxSalePrice > 0) {
                                    // 최대 가격만 설정된 경우
                                    buttonVariant = "contained";
                                    buttonColor = "secondary";
                                    buttonStyle = {backgroundColor: '#FF5722', color: 'white'};
                                }

                                return (
                                    <Button
                                        key={`sale-${price}`}
                                        variant={buttonVariant as "text" | "outlined" | "contained"}
                                        color={buttonColor as "primary" | "secondary"}
                                        size="small"
                                        onClick={() => handleSalePriceButtonClick(price)}
                                        sx={{
                                            minWidth: '60px',
                                            height: '32px',
                                            fontSize: '0.875rem',
                                            borderRadius: '4px',
                                            ...buttonStyle,
                                            '&:hover': {
                                                backgroundColor: buttonVariant === "contained"
                                                    ? buttonStyle.backgroundColor
                                                    : undefined,
                                                opacity: buttonVariant === "contained" ? 0.9 : undefined
                                            }
                                        }}
                                    >
                                        {price >= 10000 ? `${Math.floor(price / 10000)}억${price % 10000 > 0 ? ` ${Math.floor((price % 10000) / 1000)}천` : ''}` : `${Math.floor(price / 1000)}천`}
                                    </Button>
                                );
                            })}
                        </Box>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 3}}>
                            <TextField size="small" placeholder="최소" value={minSalePrice}
                                       onChange={handleMinSalePriceChange} sx={{width: '120px'}}
                                       InputProps={{endAdornment: <InputAdornment position="end">만원</InputAdornment>}}/>
                            <Typography>~</Typography>
                            <TextField size="small" placeholder="최대" value={maxSalePrice}
                                       onChange={handleMaxSalePriceChange} sx={{width: '120px'}}
                                       InputProps={{endAdornment: <InputAdornment position="end">만원</InputAdornment>}}/>
                        </Box>

                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
                            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>월세</Typography>
                            <Button size="small" variant="text" onClick={handleResetRentPrices}>초기화</Button>
                        </Box>
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
                            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200].map((price) => {
                                // 버튼 색상 로직
                                let buttonColor = "primary";
                                let buttonVariant = "outlined";
                                let buttonStyle: { backgroundColor?: string; color?: string } = {};

                                if (minRentPrice > 0 && maxRentPrice > 0 && minRentPrice < maxRentPrice) {
                                    // 최소가격과 최대가격이 모두 설정되고 서로 다른 경우
                                    if (price === minRentPrice) {
                                        // 최소 가격 버튼
                                        buttonVariant = "contained";
                                        buttonColor = "primary";
                                        buttonStyle = {backgroundColor: '#007AFF', color: 'white'};
                                    } else if (price === maxRentPrice) {
                                        // 최대 가격 버튼
                                        buttonVariant = "contained";
                                        buttonColor = "secondary";
                                        buttonStyle = {backgroundColor: '#FF5722', color: 'white'};
                                    } else if (price > minRentPrice && price < maxRentPrice) {
                                        // 범위 내 버튼 (그라데이션 적용)
                                        buttonVariant = "contained";

                                        // 그라데이션 계산 (0~1 사이의 값)
                                        const range = maxRentPrice - minRentPrice;
                                        const position = (price - minRentPrice) / range;

                                        // 시작 색상 (파란색 #007AFF)의 RGB 값
                                        const startRed = 0;
                                        const startGreen = 122;
                                        const startBlue = 255;

                                        // 종료 색상 (주황색 #FF5722)의 RGB 값
                                        const endRed = 255;
                                        const endGreen = 87;
                                        const endBlue = 34;

                                        // 두 색상 사이의 그라데이션 계산
                                        const red = Math.round(startRed + (endRed - startRed) * position);
                                        const green = Math.round(startGreen + (endGreen - startGreen) * position);
                                        const blue = Math.round(startBlue + (endBlue - startBlue) * position);

                                        // 색상 코드로 변환
                                        const gradientColor = `rgb(${red}, ${green}, ${blue})`;

                                        buttonStyle = {backgroundColor: gradientColor, color: 'white'};
                                    }
                                } else if (price === minRentPrice && minRentPrice > 0) {
                                    // 최소 가격만 설정된 경우
                                    buttonVariant = "contained";
                                    buttonColor = "primary";
                                    buttonStyle = {backgroundColor: '#007AFF', color: 'white'};
                                } else if (price === maxRentPrice && maxRentPrice > 0) {
                                    // 최대 가격만 설정된 경우
                                    buttonVariant = "contained";
                                    buttonColor = "secondary";
                                    buttonStyle = {backgroundColor: '#FF5722', color: 'white'};
                                }

                                return (
                                    <Button
                                        key={`rent-${price}`}
                                        variant={buttonVariant as "text" | "outlined" | "contained"}
                                        color={buttonColor as "primary" | "secondary"}
                                        size="small"
                                        onClick={() => handleRentPriceButtonClick(price)}
                                        sx={{
                                            minWidth: '60px',
                                            height: '32px',
                                            fontSize: '0.875rem',
                                            borderRadius: '4px',
                                            ...buttonStyle,
                                            '&:hover': {
                                                backgroundColor: buttonVariant === "contained"
                                                    ? buttonStyle.backgroundColor
                                                    : undefined,
                                                opacity: buttonVariant === "contained" ? 0.9 : undefined
                                            }
                                        }}
                                    >
                                        {price >= 100 ? `${price / 100}백` : `${price}`}만원
                                    </Button>
                                );
                            })}
                        </Box>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 3}}>
                            <TextField size="small" placeholder="최소" value={minRentPrice}
                                       onChange={handleMinRentPriceChange} sx={{width: '120px'}}
                                       InputProps={{endAdornment: <InputAdornment position="end">만원</InputAdornment>}}/>
                            <Typography>~</Typography>
                            <TextField size="small" placeholder="최대" value={maxRentPrice}
                                       onChange={handleMaxRentPriceChange} sx={{width: '120px'}}
                                       InputProps={{endAdornment: <InputAdornment position="end">만원</InputAdornment>}}/>
                        </Box>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
};

export default ArticleList;