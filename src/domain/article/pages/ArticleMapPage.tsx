import {
  ArrowBack as ArrowBackIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Add as ZoomInIcon,
  Remove as ZoomOutIcon,
  MyLocation as MyLocationIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Drawer, 
  Box, 
  CssBaseline, 
  createTheme, 
  ThemeProvider,
  Fade,
  LinearProgress,
  Button,
  Popover,
} from '@mui/material';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import ArticleFilter, { ArticleFilterData } from '../components/ArticleFilter';
import KakaoMap from '../components/KakaoMap';
import RegionFilterComponent from '../components/RegionFilter';
import { fetchMarkersAPI, fetchFilteredMarkersAPI, fetchClustersAPI, getRegionBoundaries, fetchRegionPolygonsAPI } from '../services/articleApi';
import { TradeType, BuildingType, Marker, Cluster, RegionPolygon } from '../types/article.types';
import { BoundingBox } from '../types/article.types';

// 기본 테마 (필요에 따라 커스터마이징)
const theme = createTheme({
  palette: {
    primary: {
      main: '#3E54AC',
    },
    secondary: {
      main: '#ECF2FF',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Pretendard", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          boxShadow: 'none',
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.06)',
        }
      }
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          padding: '6px',
          color: '#999',
          '&.Mui-checked': {
            color: '#3E54AC',
          }
        }
      }
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: '14px',
          color: '#333',
        }
      }
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          padding: '8px 14px',
          fontSize: '14px',
          color: '#333',
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: 'rgba(0, 0, 0, 0.12)'
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: 'rgba(0, 0, 0, 0.23)'
          },
        }
      }
    }
  }
});

interface PriceFilterState {
  salePrice?: { min?: number; max?: number };
  leasePrice?: { min?: number; max?: number };
  rentDeposit?: { min?: number; max?: number };
  monthlyRent?: { min?: number; max?: number };
}

// 필터 전체 상태 타입
export interface ArticleFilters {
  regionCode?: string | null;
  regionName?: string | null;
  tradeType?: TradeType | null;
  buildingTypes?: BuildingType[];
  prices?: PriceFilterState;
  sortField?: string;
  sortOrder?: string;
}

const DRAWER_WIDTH = 360; // 필터 Drawer 너비

// KakaoMap에서 onBoundsChanged가 전달하는 파라미터 타입 정의
interface KakaoMapBounds {
  ne: { lat: number; lng: number };
  sw: { lat: number; lng: number };
}

const ArticleMapPage: React.FC = () => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [zoomLevel, setZoomLevel] = useState(5); // 기본값 5 (클러스터 표시 수준)
  const mapRef = useRef<any>(null);
  const currentBoundingBox = useRef<BoundingBox | null>(null);
  const loadDataRequestIdRef = useRef(0);

  const [markers, setMarkers] = useState<Marker[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [regionPolygons, setRegionPolygons] = useState<RegionPolygon[]>([]);

  // 행정구역 데이터 관련 상태 추가
  const dongGeoJsonDataRef = useRef<any>(null);
  const guGeoJsonDataRef = useRef<any>(null);
  const [boundariesLoading, setBoundariesLoading] = useState(true);
  const [showRegionPolygons, setShowRegionPolygons] = useState(false); // 초기값 false

  const [activeFilters, setActiveFilters] = useState<ArticleFilterData>({
    tradeTypes: [],
    buildingTypeCodes: [],
    minSalePrice: undefined,
    maxSalePrice: undefined,
    minRentPrice: undefined,
    maxRentPrice: undefined,
    sortField: "confirmedAt",
    sortOrder: "desc",
  });
  
  const [regionCode, setRegionCode] = useState<string | null>(null);
  const [regionName, setRegionName] = useState<string | null>("전체 지역");
  const [regionPopoverAnchor, setRegionPopoverAnchor] = useState<null | HTMLElement>(null);
  
  // 필터 팝오버를 위한 상태 추가
  const [filterPopoverAnchor, setFilterPopoverAnchor] = useState<HTMLButtonElement | null>(null);
  const filterPopoverOpen = Boolean(filterPopoverAnchor);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // 필터 팝오버를 열기 위한 핸들러
  const handleFilterPopoverOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterPopoverAnchor(event.currentTarget);
  };

  // 필터 팝오버를 닫기 위한 핸들러
  const handleFilterPopoverClose = () => {
    setFilterPopoverAnchor(null);
  };

  // showRegionPolygons 상태 토글 함수
  const handleToggleShowRegionPolygons = useCallback((checked: boolean) => {
    setShowRegionPolygons(checked);
  }, []);

  const handleRegionChange = useCallback((
    code: string | null, 
    name?: string | null
  ) => {
    setRegionCode(code);
    setRegionName(name || "전체 지역");
    setRegionPopoverAnchor(null);
  }, []);

  // 초기 행정구역 데이터 로드
  useEffect(() => {
    if (showRegionPolygons) {
      setBoundariesLoading(true);
      (async () => {
        try {
          if (!dongGeoJsonDataRef.current) {
            dongGeoJsonDataRef.current = await getRegionBoundaries('dong');
          }
          if (!guGeoJsonDataRef.current) {
            guGeoJsonDataRef.current = await getRegionBoundaries('gu');
          }
        } catch {
          // 에러 처리
        } finally {
          setBoundariesLoading(false);
        }
      })();
    } else {
      setBoundariesLoading(false);
    }
  }, [showRegionPolygons]);

  const loadData = useCallback(async (
    bounds: BoundingBox | null,
    currentFilters: ArticleFilterData,
    currentZoom: number,
    currentRegionCode: string | null,
    currentShowRegionPolygons: boolean
  ) => {
    if (!bounds) return;
    const requestId = ++loadDataRequestIdRef.current;
    setIsLoading(true);

    const filterParams: any = {
      swLat: bounds.swLat,
      swLng: bounds.swLng,
      neLat: bounds.neLat,
      neLng: bounds.neLng,
    };
    if (currentFilters.tradeTypes.length) filterParams.tradeTypes = currentFilters.tradeTypes.map(t => encodeURIComponent(t));
    if (currentFilters.buildingTypeCodes.length) filterParams.buildingTypeCodes = currentFilters.buildingTypeCodes.join(',');
    if (currentFilters.minSalePrice !== undefined) filterParams.minSalePrice = currentFilters.minSalePrice;
    if (currentFilters.maxSalePrice !== undefined) filterParams.maxSalePrice = currentFilters.maxSalePrice;
    if (currentFilters.minRentPrice !== undefined) filterParams.minRentPrice = currentFilters.minRentPrice;
    if (currentFilters.maxRentPrice !== undefined) filterParams.maxRentPrice = currentFilters.maxRentPrice;

    // 초기 상태 클리어
    if (requestId === loadDataRequestIdRef.current) {
      setMarkers([]);
      setClusters([]);
    }

    // Polygons
    if (currentShowRegionPolygons) {
      const boundaryType = currentZoom >= 6 ? 'gu' : 'dong';
      const data = boundaryType === 'dong' ? dongGeoJsonDataRef.current : guGeoJsonDataRef.current;
      if (!boundariesLoading && data) {
        try {
          const polygons = await fetchRegionPolygonsAPI(data, boundaryType);
          if (requestId === loadDataRequestIdRef.current) setRegionPolygons(polygons);
        } catch {
          if (requestId === loadDataRequestIdRef.current) setRegionPolygons([]);
        }
      }
    } else {
      if (requestId === loadDataRequestIdRef.current) setRegionPolygons([]);
    }

    // API 호출 분기
    try {
      if (currentZoom <= 2) {
        if (
          currentFilters.tradeTypes.length ||
          currentFilters.buildingTypeCodes.length ||
          currentFilters.minSalePrice !== undefined ||
          currentFilters.maxSalePrice !== undefined ||
          currentFilters.minRentPrice !== undefined ||
          currentFilters.maxRentPrice !== undefined
        ) {
          setLoadingMessage("필터링된 매물 정보를 가져오는 중...");
          const data = await fetchFilteredMarkersAPI(filterParams);
          if (requestId === loadDataRequestIdRef.current) setMarkers(data);
        } else {
          setLoadingMessage("매물 정보를 가져오는 중...");
          const data = await fetchMarkersAPI(bounds);
          if (requestId === loadDataRequestIdRef.current) setMarkers(data);
        }
        if (requestId === loadDataRequestIdRef.current) setClusters([]);
      } else if (currentZoom <= 8) {
        setLoadingMessage("클러스터 정보를 가져오는 중...");
        const data = await fetchClustersAPI(bounds, currentZoom, undefined);
        if (requestId === loadDataRequestIdRef.current) {
          setClusters(data);
          setMarkers([]);
        }
      } else {
        setLoadingMessage("매물 정보를 가져오는 중...");
        const data = await fetchMarkersAPI(bounds);
        if (requestId === loadDataRequestIdRef.current) {
          setMarkers(data);
          setClusters([]);
        }
      }
    } catch {
      if (requestId === loadDataRequestIdRef.current) {
        setLoadingMessage("데이터 로드 실패");
      }
    } finally {
      if (requestId === loadDataRequestIdRef.current) {
        setIsLoading(false);
        setLoadingMessage("");
      }
    }
  }, [boundariesLoading]);

  // 지도가 생성될 때 최초 한 번 호출되는 콜백
  const handleMapLoad = useCallback((map: any) => {
    mapRef.current = map;
    const bounds = map.getBounds();
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    const initialBounds: BoundingBox = {
      swLat: sw.getLat(),
      swLng: sw.getLng(),
      neLat: ne.getLat(),
      neLng: ne.getLng(),
    };
    currentBoundingBox.current = initialBounds;
    const initialZoom = map.getLevel();
    setZoomLevel(initialZoom);
    loadData(initialBounds, activeFilters, initialZoom, regionCode, showRegionPolygons);
  }, [activeFilters, regionCode, loadData, showRegionPolygons]);

  // 지도 경계/줌 변경 시 호출
  const handleBoundsChanged = useCallback(
    (boundsFromMap: KakaoMapBounds, newZoom: number) => {
      const newBounds: BoundingBox = {
        swLat: boundsFromMap.sw.lat,
        swLng: boundsFromMap.sw.lng,
        neLat: boundsFromMap.ne.lat,
        neLng: boundsFromMap.ne.lng,
      };
      currentBoundingBox.current = newBounds;
      setZoomLevel(newZoom);
      loadData(newBounds, activeFilters, newZoom, regionCode, showRegionPolygons);
    },
    [activeFilters, regionCode, loadData, showRegionPolygons]
  );

  const handleRegionPopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    setRegionPopoverAnchor(event.currentTarget);
  };

  const handleRegionPopoverClose = () => {
    setRegionPopoverAnchor(null);
  };
  
  const goToMyLocation = () => {
    if (mapRef.current && mapRef.current.panToMyLocation) { 
      mapRef.current.panToMyLocation();
    } else if (navigator.geolocation) {
        setIsLoading(true);
        setLoadingMessage("현재 위치를 찾는 중...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                if (mapRef.current) { 
                    const kakao = (window as any).kakao;
                    if (kakao && kakao.maps) {
                        const latLng = new kakao.maps.LatLng(latitude, longitude);
                        mapRef.current.setCenter(latLng);
                        mapRef.current.setLevel(3); 
                    }
                }
                setIsLoading(false);
                setLoadingMessage("");
            },
            (error) => {
                console.error("Error getting current location: ", error);
                setIsLoading(false);
                setLoadingMessage("위치 정보를 가져올 수 없습니다.");
                setTimeout(() => setLoadingMessage(""), 2000);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    } else {
        setLoadingMessage("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
        setTimeout(() => setLoadingMessage(""), 2000);
    }
  };

  // Filter change handler
  const handleFilterChange = useCallback((newFilters: Partial<ArticleFilterData>) => {
    setActiveFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Center change handler for RegionFilter
  const handleCenterChange = useCallback((coordinates: { latitude: number; longitude: number; zoomLevel: number }) => {
    if (mapRef.current) {
      const kakaoMap = window.kakao.maps;
      const latLng = new kakaoMap.LatLng(coordinates.latitude, coordinates.longitude);
      mapRef.current.setCenter(latLng);
      if (coordinates.zoomLevel != null) {
        mapRef.current.setLevel(coordinates.zoomLevel);
      }
    }
  }, []);

  // KakaoMap props
  const kakaoMapProps = {
    markers,
    clusters,
    regionPolygons,
    onBoundsChanged: handleBoundsChanged,
    onLoad: handleMapLoad,
    showRegionPolygons,
    onToggleShowRegionPolygons: (checked: boolean) => setShowRegionPolygons(checked),
    isLoading,
    loadingMessage,
    boundariesLoading,
    mapRef,
  };

  // 리전 팝오버 내용
  const regionPopoverContent = (
    <Box sx={{ p: 1, width: '100%', maxWidth: 360, height: 'auto', maxHeight: '80vh', overflow: 'auto' }}>
      <RegionFilterComponent 
        onRegionChange={handleRegionChange} 
        onCenterChange={handleCenterChange}
      />
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 2, 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(8px)',
            color: '#000000',
            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="뒤로 가기"
              edge="start"
              onClick={() => navigate(-1)}
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Button
              color="inherit"
              startIcon={<LocationOnIcon />}
              onClick={handleRegionPopoverOpen}
              sx={{ textTransform: 'none', fontSize: '1rem', mr: 'auto' }} 
            >
              {regionName || "전체 지역"}
              <ArrowDownIcon sx={{ ml: 0.5 }} />
            </Button>
            {/* <IconButton
              color="inherit"
              aria-label="필터 열기"
              edge="end"
              onClick={handleFilterPopoverOpen}
            >
              <FilterListIcon />
            </IconButton> */}
          </Toolbar>
        </AppBar>
        
        {/* 지역 선택 팝오버 */}
        <Popover
          open={Boolean(regionPopoverAnchor)}
          anchorEl={regionPopoverAnchor}
          onClose={handleRegionPopoverClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left', 
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          sx={{ '& .MuiPopover-paper': { width: { xs: '90%', sm: 360 }, boxShadow: 3 } }}
        >
          {regionPopoverContent}
        </Popover>

        {/* 필터 팝오버 추가 */}
        <ArticleFilter
          initialFilters={activeFilters}
          onFilterChange={handleFilterChange}
          isPopoverOpen={filterPopoverOpen}
          anchorEl={filterPopoverAnchor}
          onClose={handleFilterPopoverClose}
          zoomLevel={zoomLevel}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: '100%',
            height: '100vh', 
            pt: '64px', 
            position: 'relative', 
          }}
        >
          {(isLoading || loadingMessage) && ( 
            <Fade in={isLoading || !!loadingMessage} timeout={300}>
              <Box sx={{
                position: 'absolute',
                top: 0, 
                left: 0,
                right: 0,
                zIndex: 10, 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                {isLoading && (
                  <LinearProgress sx={{ width: '100%', height: 4 }} color="primary" />
                )}
                {loadingMessage && !isLoading && ( 
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      bgcolor: loadingMessage.includes("실패") || loadingMessage.includes("없습니다") ? 'error.main' : 'rgba(0, 0, 0, 0.7)', 
                      color: 'white', 
                      py: 0.5, 
                      px: 2, 
                      width: '100%',
                      textAlign: 'center',
                    }}
                  >
                    {loadingMessage}
                  </Typography>
                )}
              </Box>
            </Fade>
          )}

          <KakaoMap {...kakaoMapProps} />
          
          <Box
            sx={{
              position: 'absolute',
              right: '16px',
              bottom: '24px', 
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              zIndex: 5 
            }}
          >
            <IconButton
              size="medium"
              onClick={goToMyLocation}
              sx={{
                backgroundColor: '#fff',
                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)',
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
              aria-label="현재 위치"
            >
              <MyLocationIcon fontSize="medium" />
            </IconButton>
             <IconButton
              size="medium"
              onClick={() => mapRef.current?.setLevel(mapRef.current.getLevel() - 1)}
              sx={{ backgroundColor: '#fff', boxShadow: '0px 1px 3px rgba(0,0,0,0.2)', '&:hover': { backgroundColor: '#f5f5f5'}}}
              aria-label="확대"
            >
              <ZoomInIcon fontSize="medium" />
            </IconButton>
            <IconButton
              size="medium"
              onClick={() => mapRef.current?.setLevel(mapRef.current.getLevel() + 1)}
              sx={{ backgroundColor: '#fff', boxShadow: '0px 1px 3px rgba(0,0,0,0.2)', '&:hover': { backgroundColor: '#f5f5f5'}}}
              aria-label="축소"
            >
              <ZoomOutIcon fontSize="medium" />
            </IconButton>
          </Box>
        </Box>
        
        <Drawer
          variant="temporary" 
          anchor="right"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              zIndex: (theme) => theme.zIndex.drawer + 1, 
              boxShadow: '-2px 0px 5px rgba(0,0,0,0.1)',
            },
          }}
          ModalProps={{
            keepMounted: true, 
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}>
            <Typography sx={{ fontWeight: 600, fontSize: '1.125rem' }}>필터</Typography>
            <IconButton onClick={handleDrawerToggle} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
            <ArticleFilter 
              initialFilters={activeFilters} 
              onFilterChange={handleFilterChange} 
              zoomLevel={zoomLevel}
            />
          </Box>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
};

export default ArticleMapPage; 