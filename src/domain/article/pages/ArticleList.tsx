import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import FilterListIcon from '@mui/icons-material/FilterList'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ViewMapIcon from '@mui/icons-material/Map'
import ViewListIcon from '@mui/icons-material/ViewList'
import {AppBar, Box, Button, GlobalStyles, IconButton, Toolbar, useMediaQuery, useTheme} from "@mui/material"
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {useNavigate} from 'react-router-dom'

import ArticleDetail from "@/domain/article/components/ArticleDetail"
import ArticleListView from '@/domain/article/components/ArticleListView'
import FilterDrawer from "@/domain/article/components/FilterDrawer"
import RegionSelector from "@/domain/article/components/RegionSelector"
import {useArticleApi} from '@/domain/article/hooks/useArticleApi'
import {useArticleFilters} from '@/domain/article/hooks/useArticleFilters'
import {useArticles} from '@/domain/article/hooks/useArticles'
import {useClusters} from '@/domain/article/hooks/useClusters'
import {useMapView} from '@/domain/article/hooks/useMapView'
import ArticleListMap from '@/domain/article/map/components/ArticleListMap'
import {MAP_ZOOM_LEVELS} from '@/domain/article/map/constants/mapConstants'
import {calculatePrecisionByZoom, getClusterColor} from '@/domain/article/map/utils/clusterUtils'
import {KOREA_REGIONS} from '@/domain/article/map/utils/regionData'
import type {ArticleResponse, ClusterInfo, ComplexResponse} from "@/domain/article/types/article"
import {validateCoordinates} from "@/domain/article/utils/articleFormat"

const ArticleList: React.FC = () => {
    const mapRef = useRef<any>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    // 상수 정의
    const CLUSTER_ZOOM_THRESHOLD = MAP_ZOOM_LEVELS.CLUSTER;
    const MAP_BOUND_LIST_ZOOM_LEVEL = MAP_ZOOM_LEVELS.MAP_BOUND_LIST;
    const PAGE_SIZE = 20;
    const DRAWER_WIDTH = 350;

    // 상태 변수들
    const [regions] = useState<any[]>(KOREA_REGIONS);
    const [selectedComplex, setSelectedComplex] = useState<ComplexResponse | null>(null);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [showMap] = useState(true);
    const [showList, setShowList] = useState(true);
    const [, setDetailVisible] = useState(false);
    const [regionPopoverAnchor, setRegionPopoverAnchor] = useState<null | HTMLElement>(null);
    const [listVisibility, setListVisibility] = useState<'visible' | 'hidden'>('visible');

    // 커스텀 훅 사용
    const {
        mapBounds, mapZoom, currentLocation, isClusterMode,
        handleMapViewChange, setClusterTransition
    } = useMapView({
        onBoundsChanged: (bounds, zoom) => handleBoundsChanged(bounds, zoom),
        clusterZoomThreshold: CLUSTER_ZOOM_THRESHOLD
    });

    const {
        clusters, fetchClusters
    } = useClusters({
        clusterZoomThreshold: CLUSTER_ZOOM_THRESHOLD
    });

    const {
        typeFilter, setTypeFilter,
        tradeTypeFilter, setTradeTypeFilter,
        minSalePrice, maxSalePrice,
        minRentPrice, maxRentPrice,
        handleMinSalePriceChange, handleMaxSalePriceChange,
        handleMinRentPriceChange, handleMaxRentPriceChange,
        handleSalePriceButtonClick, handleRentPriceButtonClick,
        handleResetSalePrices, handleResetRentPrices,
        sortField, sortOrder, setSortField, setSortOrder,
        selectedCity, selectedDistrict, selectedNeighborhood,
        cityOptions, districtOptions, neighborhoodOptions,
        isRegionFiltered, regionSelectStep, setRegionSelectStep,
        handleCitySelect, handleDistrictSelect, handleNeighborhoodSelect,
        handleResetRegion, resetAllFilters
    } = useArticleFilters({
        onFilterChange: () => handleFilterChange()
    });

    const {
        allPaginatedArticles, visibleMapArticles, selectedArticle,
        hasMore, isLoadingMore, showMapBoundList, currentClusterInfo,
        setShowMapBoundList, setSelectedArticle, setCurrentClusterInfo,
        fetchArticles, fetchArticlesByCluster, loadMoreArticles,
        handleArticleClick: handleArticleClickInternal, handleDetailClose
    } = useArticles({
        pageSize: PAGE_SIZE
    });

    const {
        fetchComplex
    } = useArticleApi();

    // 필터링 파라미터 얻기
    const getFilterParams = useCallback(() => {
        return {
            typeFilter,
            tradeTypeFilter,
            minSalePrice,
            maxSalePrice,
            minRentPrice,
            maxRentPrice,
            sortField,
            sortOrder,
            selectedCity,
            selectedDistrict,
            selectedNeighborhood,
            cityOptions,
            districtOptions,
            neighborhoodOptions,
            isRegionFiltered,
            mapZoom,
            mapBoundListZoomLevel: MAP_BOUND_LIST_ZOOM_LEVEL
        };
    }, [
        typeFilter, tradeTypeFilter, minSalePrice,
        maxSalePrice, minRentPrice, maxRentPrice,
        sortField, sortOrder, selectedCity,
        selectedDistrict, selectedNeighborhood, cityOptions,
        districtOptions, neighborhoodOptions, isRegionFiltered,
        mapZoom, MAP_BOUND_LIST_ZOOM_LEVEL
    ]);

    // 필터 변경 핸들러
    const handleFilterChange = useCallback(() => {
        fetchArticles(0, mapBounds, getFilterParams(), false);
    }, [fetchArticles, mapBounds, getFilterParams]);

    // 지도 경계 변경 핸들러
    const handleBoundsChanged = useCallback((newBounds: any, newZoom: number) => {
        // 디버그 로그 제거
        
        // 클러스터 모드 전환 확인
        const isTransitioningToCluster = mapZoom < CLUSTER_ZOOM_THRESHOLD && newZoom >= CLUSTER_ZOOM_THRESHOLD;
        const isTransitioningFromCluster = mapZoom >= CLUSTER_ZOOM_THRESHOLD && newZoom < CLUSTER_ZOOM_THRESHOLD;
        
        // 현재 클러스터 정보가 있는 경우, 클러스터 모드를 그대로 유지하지만 필요 시 API 호출 실행
        if (currentClusterInfo && !isTransitioningFromCluster) {
            return;
        }

        // 클러스터 모드 상태에 따른 데이터 요청
        if (isTransitioningToCluster || (newZoom >= 5 && newZoom <= 7)) {
            // 매물 핀에서 클러스터로 전환
            fetchClusters(newBounds, newZoom);
            return;
        } else if (isTransitioningFromCluster) {
            // 클러스터에서 매물 핀으로 전환
            fetchArticles(0, newBounds, getFilterParams(), false);
            setShowMapBoundList(true);
            return;
        }
        
        // 모든 줌 레벨에서 매물 데이터 요청
        if (!currentClusterInfo) {
            fetchArticles(0, newBounds, getFilterParams(), false);
            setShowMapBoundList(true);
        }
    }, [
        mapZoom, CLUSTER_ZOOM_THRESHOLD, fetchClusters, fetchArticles,
        getFilterParams, currentClusterInfo, setShowMapBoundList
    ]);

    // 클러스터 클릭 핸들러
    const handleClusterClick = useCallback(async (cluster: ClusterInfo) => {
        try {
            // 클러스터 전환 플래그 설정 (지도 리셋 방지)
            setClusterTransition(true);

            // 클러스터 중심으로 강하게 줌 인
            let targetZoomLevel;
            if (cluster.isMerged) {
                targetZoomLevel = 2; // 매우 가까이 확대
            } else if (mapZoom <= 5) {
                targetZoomLevel = 2;
            } else {
                targetZoomLevel = 1; // 가장 가까운 확대 수준
            }

            // 지도 중심 및 줌 레벨 변경
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

            // 클러스터 내 매물 조회
            await fetchArticlesByCluster(cluster, calculatePrecisionByZoom(targetZoomLevel));

            // 맵 바운드 리스트 모드 활성화
            setShowMapBoundList(true);

        } catch (err) {
            console.error("클러스터 처리 중 오류 발생:", err);
        }
    }, [setClusterTransition, mapZoom, fetchArticlesByCluster, setShowMapBoundList]);

    // 기타 핸들러들
    const handleArticleClick = async (article: ArticleResponse) => {
        handleArticleClickInternal(article);
        if (article.complexId) {
            try {
                const complex = await fetchComplex(article.complexId);
                if (complex) {
                    setSelectedComplex(complex);
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
        setCurrentClusterInfo(null);
        navigate(-1);
    };

    const handleDetailCloseWithAnimation = () => {
        setDetailVisible(false);
        // 애니메이션이 완료된 후 선택된 매물 정보 초기화
        setTimeout(() => {
            handleDetailClose();
            setSelectedComplex(null);
        }, 500); // 애니메이션 시간(0.5초)과 일치시킴
    };

    const handleRegionPopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
        setRegionPopoverAnchor(event.currentTarget);
    };

    const handleRegionPopoverClose = () => setRegionPopoverAnchor(null);

    const isRegionPopoverOpen = Boolean(regionPopoverAnchor);

    // 매물 표시 관련 메모이제이션
    const processedClusters = useMemo(() => {
        const clustersArray = Array.isArray(clusters) ? clusters : [];
        console.log("클러스터 처리:", clustersArray.length, "개");
        
        if (clustersArray.length === 0) {
            return [];
        }
        
        return clustersArray.map(cluster => ({
            ...cluster,
            color: getClusterColor(cluster)
        }));
    }, [clusters]);

    const validArticles = useMemo(() => {
        const articles = showMapBoundList ? visibleMapArticles : allPaginatedArticles;
        return articles.filter(article =>
            validateCoordinates(article.latitude, article.longitude)
        );
    }, [showMapBoundList, visibleMapArticles, allPaginatedArticles]);

    // 초기 데이터 로딩
    useEffect(() => {
        fetchArticles(0, mapBounds, getFilterParams(), false);
    }, [fetchArticles, mapBounds, getFilterParams]);

    // 리스트 보기/숨김 애니메이션 처리
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

    const articlesToDisplay = (currentClusterInfo || showMapBoundList) ? visibleMapArticles : allPaginatedArticles;

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
                        '.list-hidden .map-container': {
                            height: 'calc(100vh - 56px) !important',
                            minHeight: 'calc(100vh - 56px) !important'
                        },
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

                    <RegionSelector
                        regionPopoverAnchor={regionPopoverAnchor}
                        isRegionPopoverOpen={isRegionPopoverOpen}
                        onRegionPopoverClose={handleRegionPopoverClose}
                        selectedCity={selectedCity}
                        selectedDistrict={selectedDistrict}
                        selectedNeighborhood={selectedNeighborhood}
                        cityOptions={cityOptions}
                        districtOptions={districtOptions}
                        neighborhoodOptions={neighborhoodOptions}
                        regionSelectStep={regionSelectStep}
                        setRegionSelectStep={setRegionSelectStep}
                        handleCitySelect={handleCitySelect}
                        handleDistrictSelect={handleDistrictSelect}
                        handleNeighborhoodSelect={handleNeighborhoodSelect}
                        handleResetRegion={handleResetRegion}
                    />

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
                            clusterMode={processedClusters.length > 0}
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
                onClose={handleDetailCloseWithAnimation}
            />

            <FilterDrawer
                isOpen={isFilterDrawerOpen}
                onClose={() => setIsFilterDrawerOpen(false)}
                drawerWidth={DRAWER_WIDTH}
                typeFilter={typeFilter}
                tradeTypeFilter={tradeTypeFilter}
                minSalePrice={minSalePrice}
                maxSalePrice={maxSalePrice}
                minRentPrice={minRentPrice}
                maxRentPrice={maxRentPrice}
                sortField={sortField}
                sortOrder={sortOrder}
                setTypeFilter={setTypeFilter}
                setTradeTypeFilter={setTradeTypeFilter}
                handleMinSalePriceChange={handleMinSalePriceChange}
                handleMaxSalePriceChange={handleMaxSalePriceChange}
                handleMinRentPriceChange={handleMinRentPriceChange}
                handleMaxRentPriceChange={handleMaxRentPriceChange}
                handleSalePriceButtonClick={handleSalePriceButtonClick}
                handleRentPriceButtonClick={handleRentPriceButtonClick}
                handleResetSalePrices={handleResetSalePrices}
                handleResetRentPrices={handleResetRentPrices}
                setSortField={setSortField}
                setSortOrder={setSortOrder}
                resetAllFilters={resetAllFilters}
            />
        </Box>
    );
};

export default ArticleList;