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
import { fetchMarkersAPI, fetchFilteredMarkersAPI, fetchClustersAPI } from '../services/articleApi';
import { TradeType, BuildingType } from '../types/article.types';
import { BoundingBox, Marker, Cluster } from '../types/article.types';

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

  const [markers, setMarkers] = useState<Marker[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);

  const [activeFilters, setActiveFilters] = useState<ArticleFilterData>({
    tradeType: null,
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

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleRegionChange = useCallback((
    code: string | null, 
    name?: string | null, 
    coordinates?: { latitude: number, longitude: number, zoomLevel?: number }
  ) => {
    setRegionCode(code);
    setRegionName(name || "전체 지역");
    
    if (coordinates && mapRef.current) {
      const kakao = (window as any).kakao;
      if (kakao && kakao.maps) {
        const latLng = new kakao.maps.LatLng(
          coordinates.latitude,
          coordinates.longitude
        );
        mapRef.current.setCenter(latLng);
        if (coordinates.zoomLevel) {
            mapRef.current.setLevel(coordinates.zoomLevel);
        }
      }
    }
    setRegionPopoverAnchor(null);
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<ArticleFilterData>) => {
    setActiveFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  }, []);

  const loadData = useCallback(async (bounds: BoundingBox | null, currentFilters: ArticleFilterData, currentZoom: number, currentRegionCode: string | null) => {
    if (!bounds) return;
    setIsLoading(true);
    setLoadingMessage("데이터를 불러오는 중...");

    const isAnyNonGeoFilterApplied = 
        currentFilters.tradeType !== null ||
        currentFilters.buildingTypeCodes.length > 0 ||
        currentFilters.minSalePrice !== undefined ||
        currentFilters.maxSalePrice !== undefined ||
        currentFilters.minRentPrice !== undefined ||
        currentFilters.maxRentPrice !== undefined;

    const filtersForApi = { ...currentFilters };

    try {
      if (currentZoom <= 8) { 
        setLoadingMessage("클러스터 정보를 가져오는 중...");
        const clusterData = await fetchClustersAPI(bounds, currentZoom);
        setClusters(clusterData);
        setMarkers([]);
      } else {
        setLoadingMessage("매물 정보를 가져오는 중...");
        let markerData;
        if (isAnyNonGeoFilterApplied) { 
          markerData = await fetchFilteredMarkersAPI(bounds, filtersForApi);
        } else { 
          markerData = await fetchMarkersAPI(bounds); 
        }
        setMarkers(markerData);
        setClusters([]);
      }
    } catch (error) {
      console.error("Error loading map data:", error);
      setLoadingMessage("데이터 로드 실패");
    } finally {
      setIsLoading(false);
      if (loadingMessage === "데이터를 불러오는 중...") {
        setLoadingMessage("");
      }
    }
  }, [loadingMessage]); 
  
  const handleBoundsChanged: (boundsFromMap: KakaoMapBounds, newZoomFromMap: number) => void = useCallback((boundsFromMap, newZoomFromMap) => {
    const newBounds: BoundingBox = {
        swLat: boundsFromMap.sw.lat,
        swLng: boundsFromMap.sw.lng,
        neLat: boundsFromMap.ne.lat,
        neLng: boundsFromMap.ne.lng,
    };
    currentBoundingBox.current = newBounds;
    if (zoomLevel !== newZoomFromMap) {
        setZoomLevel(newZoomFromMap);
    } else {
      if (currentBoundingBox.current) {
        loadData(currentBoundingBox.current, activeFilters, newZoomFromMap, regionCode);
      }
    }
  }, [activeFilters, regionCode, loadData, zoomLevel]); 

  const handleZoomChanged = useCallback((newZoomLevel: number) => {
    setZoomLevel(newZoomLevel);
  }, []);

   useEffect(() => {
     if (currentBoundingBox.current) {
       loadData(currentBoundingBox.current, activeFilters, zoomLevel, regionCode);
     }
   }, [activeFilters, zoomLevel, regionCode, loadData]);

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

  const handleMapLoad = (map: any) => { 
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
    loadData(initialBounds, activeFilters, initialZoom, regionCode);
  };
  
  // KakaoMap에 전달할 props 객체 생성
  const kakaoMapProps = {
    markers,
    clusters,
    onBoundsChanged: handleBoundsChanged,
    onZoomChanged: handleZoomChanged,
    onLoad: handleMapLoad,
    showControls: false,
    activeFilters: activeFilters, // KakaoMap이 이 prop을 받는다고 가정 (실제 KakaoMapProps 확인 필요)
    // initialCenter, initialZoom 등은 KakaoMap 내부 로직 또는 onLoad로 처리
  };

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
            <IconButton
              color="inherit"
              aria-label="필터 열기"
              edge="end"
              onClick={handleDrawerToggle} 
            >
              <FilterListIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
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
          <Box sx={{ p: 2 }}>
            <RegionFilterComponent onRegionChange={handleRegionChange} />
          </Box>
        </Popover>

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

          <KakaoMap {...(kakaoMapProps as any)} />
          
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
            />
          </Box>
        </Drawer>
      </Box>
    </ThemeProvider>
  );
};

export default ArticleMapPage; 