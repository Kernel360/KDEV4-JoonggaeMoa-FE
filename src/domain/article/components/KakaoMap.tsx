import {
  Home as HomeIcon,
  LocationOn as LocationIcon,
  Close as CloseIcon,
  Apartment as ApartmentIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import {
  CircularProgress,
  Box,
  Snackbar,
  Alert,
  AlertTitle,
  Typography,
  Paper,
  Chip,
  IconButton,
  List,
  ListItem,
  Slide,
  useMediaQuery,
  useTheme,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import React, { useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { Map, MapMarker, CustomOverlayMap, useKakaoLoader, Polygon } from 'react-kakao-maps-sdk';

import ArticleDetailModal from './ArticleDetailModal';
import { ArticleFilters } from '../pages/ArticleMapPage';
import { fetchMarkersAPI, fetchClustersAPI, fetchArticleDetail, fetchRegionPolygonsAPI, getRegionBoundaries } from '../services/articleApi';
import { BoundingBox, Marker as MarkerData, Cluster as ClusterData, Article, RegionPolygon } from '../types/article.types';


interface KakaoMapProps {
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  activeFilters: ArticleFilters;
  mapRef?: MutableRefObject<any>;
  onBoundsChanged?: (bounds: {
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number }
  }, zoom: number) => void;
}

interface SnackbarError {
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info';
}

// 스타일링된 마커 오버레이
const MarkerInfoWindow = styled(Paper)(() => ({
  minWidth: '280px',
  maxWidth: '320px',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  padding: 0,
  overflow: 'hidden',
}));

// 클러스터 스타일링 (수정됨)
const ClusterBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  // backgroundColor 는 getClusterColor 함수에서 동적으로 rgba 형식으로 설정됩니다.
  color: '#FFFFFF', // 텍스트 색상은 흰색 유지 또는 배경 밝기에 따라 조정
  fontSize: '14px',
  fontWeight: 'bold', // 글씨 두께 강조
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)', // 그림자 부드럽게
  cursor: 'pointer',
  transition: 'transform 0.2s ease, background-color 0.2s ease', // 배경색 변경 시 부드러운 전환 추가
  '&:hover': {
    transform: 'scale(1.05)',
    // 호버 시 미세한 밝기 변화나 그림자 강조를 추가할 수 있습니다.
  },
  // 숫자가 잘 보이도록 텍스트 그림자 추가 (선택적)
  textShadow: '0px 0px 2px rgba(0, 0, 0, 0.5)',
}));

// 구역 이름 라벨 스타일링 (수정됨)
const RegionLabel = styled(Box)(({ theme }) => ({
  padding: '5px 10px', // 패딩 약간 증가
  borderRadius: '6px',  // 모서리 둥글기 약간 증가
  backgroundColor: 'rgba(255, 255, 255, 0.9)', // 배경은 좀 더 불투명하게 하여 가독성 확보
  color: '#212121', // 글자색 약간 진하게
  fontWeight: '600', // 글씨 두께
  fontSize: '13px',   // 글씨 크기 약간 증가
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // 기존 그림자 유지 또는 약간 강화
  whiteSpace: 'nowrap',
  pointerEvents: 'none', // 클릭 이벤트 통과
  opacity: 0.85, // 전체적인 투명도 (0.75 보다 약간 더 진하게 하여 가독성 확보)
  textShadow: '0px 1px 1px rgba(255,255,255,0.5)', // 아래쪽으로 흰색 그림자를 살짝 주어 입체감
  // textShadow: '1px 1px 2px rgba(0,0,0,0.3)', // 또는 어두운 그림자로 입체감
  transform: 'translateY(-50%)', // 수직 중앙 정렬 (필요시)
}));

// 건물 유형에 따른 색상 반환 (컴포넌트 간 공유)
const getTypeColor = (type?: string): string => {
  switch (type) {
    case 'APT':
    case '아파트':
      return '#2196f3';
    case 'OFFICETEL':
    case '오피스텔':
      return '#4caf50';
    case 'VILLA':
    case '빌라':
      return '#ff9800';
    case 'HOUSE':
    case '단독/다가구':
      return '#9c27b0';
    case 'RETAIL':
    case '상가':
      return '#f44336';
    case 'OFFICE':
    case '사무실':
      return '#607d8b';
    default:
      return '#3E54AC';
  }
};

// 건물 유형에 따른 아이콘 SVG 경로 반환
const getTypeIconPath = (type?: string): string => {
  switch (type) {
    case 'APT':
    case '아파트':
      return 'M7 10.9V17H4v-6.1l3-3L10 10.9V17h3v-6.1l3-3 3 3V17h3V9.5L12 3 7 9.5v1.4z M5 19h14v2H5v-2z';
    case 'OFFICETEL':
    case '오피스텔':
      return 'M15 11V5.83c0-.53-.21-1.04-.59-1.41L12 2 9.59 4.41c-.37.38-.59.89-.59 1.42V11h6m-3 8h2v-4h-2v4M11 5.83V9h2V5.83l.59-.59L12 3.66 10.41 5.24l.59.59z M7 12H3V3h4v9m10 0h4V3h-4v9';
    case 'VILLA':
    case '빌라':
      return 'M19 9.3V4h-3v2.6L12 3 2 12h3v8h14v-8h3l-3-2.7zM10 10c0-1.1.9-2 2-2s2 .9 2 2H10z';
    case 'HOUSE':
    case '단독/다가구':
      return 'M19 9.3V4h-3v2.6L12 3 2 12h3v8h14v-8h3l-3-2.7zM10 10c0-1.1.9-2 2-2s2 .9 2 2H10z';
    case 'RETAIL':
    case '상가':
    case '상가주택':
      return 'M20 4H4v2h16V4zm0 14v-6H4v6h16z M2 16h20v2H2z M9 6h2v4H9z M13 6h2v4h-2z';
    case 'OFFICE':
    case '사무실':
      return 'M15 11V5.83c0-.53-.21-1.04-.59-1.41L12 2 9.59 4.41c-.37.38-.59.89-.59 1.42V11h6m-3 8h2v-4h-2v4M11 5.83V9h2V5.83l.59-.59L12 3.66 10.41 5.24l.59.59z M7 12H3V3h4v9m10 0h4V3h-4v9';
    default:
      return 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';
  }
};

// 매물 개수에 따른 색상 반환 (레인보우 스펙트럼)
const getCountColor = (count: number): string => {
  if (count <= 1) return getTypeColor('default');
  
  if (count <= 5) return '#FF0000'; // 빨강 (2~5)
  if (count <= 10) return '#FF4500'; // 주황 (6~10)
  if (count <= 15) return '#FFA500'; // 주황-노랑 (11~15)
  if (count <= 20) return '#FFD700'; // 노랑 (16~20)
  if (count <= 25) return '#ADFF2F'; // 연두 (21~25)
  if (count <= 30) return '#32CD32'; // 라임 (26~30)
  if (count <= 35) return '#008000'; // 녹색 (31~35)
  if (count <= 40) return '#20B2AA'; // 청록 (36~40)
  if (count <= 45) return '#00BFFF'; // 하늘 (41~45)
  if (count <= 50) return '#0000FF'; // 파랑 (46~50)
  if (count <= 55) return '#4B0082'; // 남색 (51~55)
  if (count <= 60) return '#800080'; // 보라 (56~60)
  if (count <= 65) return '#C71585'; // 자주 (61~65)
  if (count <= 70) return '#FF1493'; // 분홍 (66~70)
  
  return '#FF00FF'; // 그 이상
};

// 클러스터 개수에 따른 색상 반환 (수정됨 - 안정적인 색상 및 투명도 조절)
const getClusterColorWithOpacity = (count: number): string => {
  const baseGray = 120; // 기본 회색 값 (0-255)
  const alpha = 0.5; // 기본 투명도 (사용자 수정: 0.75 -> 0.5)

  if (count <= 10) return `rgba(${baseGray + 40}, ${baseGray + 40}, ${baseGray + 40}, ${alpha - 0.05})`; // 밝은 회색
  if (count <= 20) return `rgba(${baseGray + 20}, ${baseGray + 20}, ${baseGray + 20}, ${alpha})`;
  if (count <= 30) return `rgba(${baseGray}, ${baseGray}, ${baseGray}, ${alpha + 0.05})`; // 중간 회색
  if (count <= 40) return `rgba(${baseGray - 20}, ${baseGray - 20}, ${baseGray - 20}, ${alpha + 0.1})`;
  if (count <= 50) return `rgba(${baseGray - 40}, ${baseGray - 40}, ${baseGray - 40}, ${alpha + 0.15})`; // 진한 회색
  if (count <= 60) return `rgba(${baseGray - 60}, ${baseGray - 60}, ${baseGray - 60}, ${alpha + 0.2})`;
  
  return `rgba(${baseGray - 80}, ${baseGray - 80}, ${baseGray - 80}, ${alpha + 0.25})`; // 가장 진한 회색 (최대 투명도)
};

// SVG 마커 생성 유틸리티 함수
const createMarkerIcon = (buildingType?: string, isSelected: boolean = false, sameLocationCount: number = 0): string => {
  const color = getTypeColor(buildingType);
  const iconPath = getTypeIconPath(buildingType);
  const backgroundColor = sameLocationCount > 1 ? getCountColor(sameLocationCount) : color;
  
  // 기본 사이즈 설정
  const baseSize = 30; // 기본 정사각형 크기
  const cornerRadius = 8; // 아이폰 스타일 모서리 둥글기
  const svgViewBoxSize = baseSize * 1.2; // SVG viewBox 크기 (아이콘이 잘리지 않도록 여유 공간 포함)
  
  // 실제 렌더링될 SVG의 크기
  const renderSvgWidth = svgViewBoxSize;
  const renderSvgHeight = svgViewBoxSize;
  
  // 사각형 위치 계산
  const rectX = (svgViewBoxSize - baseSize) / 2;
  const rectY = (svgViewBoxSize - baseSize) / 2;
  
  // 선택 효과 스타일
  const selectedStyle = isSelected 
    ? `<rect x="${rectX - 2}" y="${rectY - 2}" width="${baseSize + 4}" height="${baseSize + 4}" 
          rx="${cornerRadius + 2}" ry="${cornerRadius + 2}" 
          fill="none" stroke="#FF5722" stroke-width="2" stroke-dasharray="4,2" opacity="0.8"/>`
    : '';
    
  // 동일 위치 매물 배지
  const badgeMarkup = sameLocationCount > 1 
    ? `<circle cx="${svgViewBoxSize - rectX - 5}" cy="${rectY + 5}" r="${baseSize * 0.25}" 
        fill="#f44336" stroke="none"/>
       <text x="${svgViewBoxSize - rectX - 5}" y="${rectY + 8}" 
        font-size="${baseSize * 0.25}" text-anchor="middle" fill="white" font-weight="bold">${sameLocationCount}</text>`
    : '';
  
  return `
    <svg width="${renderSvgWidth}" height="${renderSvgHeight}" viewBox="0 0 ${svgViewBoxSize} ${svgViewBoxSize}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${rectX}" y="${rectY}" width="${baseSize}" height="${baseSize}" 
        rx="${cornerRadius}" ry="${cornerRadius}" 
        fill="${backgroundColor}" stroke="none"/>
      <path d="${iconPath}" transform="translate(${svgViewBoxSize/2 - 12}, ${svgViewBoxSize/2 - 12}) scale(1)" fill="white"/>
      ${badgeMarkup}
      ${selectedStyle}
    </svg>
  `;
};

// SVG 문자열을 Data URL로 변환하는 함수
const svgToDataUrl = (svgString: string): string => {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
};

// GeoJSON 좌표 파싱 함수 - API 응답에 맞게 [위도, 경도] 순서로 처리
const parseGeoJsonCoordinates = (geoJsonString: string | any): { lat: number; lng: number } | undefined => {
  if (!geoJsonString) return undefined;

  try {
    if (typeof geoJsonString === 'object') {
      if (geoJsonString.lat !== undefined && geoJsonString.lng !== undefined) {
        return { lat: geoJsonString.lat, lng: geoJsonString.lng };
      }
      if (geoJsonString.type === 'Point' && Array.isArray(geoJsonString.coordinates) && geoJsonString.coordinates.length === 2) {
        return { lat: geoJsonString.coordinates[0], lng: geoJsonString.coordinates[1] };
      }
      if (geoJsonString.geometry && geoJsonString.geometry.type === 'Point' &&
        Array.isArray(geoJsonString.geometry.coordinates) && geoJsonString.geometry.coordinates.length === 2) {
        return { lat: geoJsonString.geometry.coordinates[0], lng: geoJsonString.geometry.coordinates[1] };
      }
    }
    if (typeof geoJsonString === 'string') {
      try {
        const geoJson = JSON.parse(geoJsonString);
        if (geoJson.type === 'Point' && Array.isArray(geoJson.coordinates) && geoJson.coordinates.length === 2) {
          return { lat: geoJson.coordinates[0], lng: geoJson.coordinates[1] };
        }
        if (geoJson.geometry && geoJson.geometry.type === 'Point' &&
          Array.isArray(geoJson.geometry.coordinates) && geoJson.geometry.coordinates.length === 2) {
          return { lat: geoJson.geometry.coordinates[0], lng: geoJson.geometry.coordinates[1] };
        }
        if (geoJson.lat !== undefined && geoJson.lng !== undefined) {
          return { lat: geoJson.lat, lng: geoJson.lng };
        }
      } catch {
        if (geoJsonString.includes(',')) {
          const parts = geoJsonString.split(',');
          if (parts.length === 2) {
            const lat = parseFloat(parts[0].trim());
            const lng = parseFloat(parts[1].trim());
            if (!isNaN(lat) && !isNaN(lng)) {
              return { lat, lng };
            }
          }
        }
      }
    }
    if (Array.isArray(geoJsonString) && geoJsonString.length === 2 &&
      typeof geoJsonString[0] === 'number' && typeof geoJsonString[1] === 'number') {
      return { lat: geoJsonString[0], lng: geoJsonString[1] };
    }
  } catch (e) {
    console.error("GeoJSON 파싱 오류:", e);
  }

  return undefined;
};

// 동일 위치 매물 리스트 컴포넌트
interface SameLocationArticleListProps {
  articles: Article[];
  isOpen: boolean;
  onClose: () => void;
  onArticleClick: (article: Article) => void;
  selectedArticle: Article | null;
  location: { lat: number; lng: number };
}

const SameLocationArticleList = ({
  articles,
  isOpen,
  onClose,
  onArticleClick,
  selectedArticle,
  location
}: SameLocationArticleListProps) => {
  const [transition, setTransition] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (isOpen) {
      setTransition(true);
    } else {
      setTimeout(() => {
        setTransition(false);
      }, 300); // 트랜지션이 완료된 후 상태 업데이트
    }
  }, [isOpen]);

  // 가격 포맷팅 함수
  const formatPrice = (price?: number): string => {
    if (!price) return '-';

    if (price >= 10000) {
      const eok = Math.floor(price / 10000);
      const cheonman = price % 10000;
      return cheonman > 0 ? `${eok}억 ${cheonman.toLocaleString()}만원` : `${eok}억원`;
    }

    return `${price.toLocaleString()}만원`;
  };

  // 건물 유형에 따른 아이콘 반환
  const getBuildingIcon = (buildingType?: string) => {
    const color = getTypeColor(buildingType);
    switch (buildingType) {
      case 'APT':
      case '아파트':
        return <ApartmentIcon sx={{ color }} />;
      case 'OFFICETEL':
      case '오피스텔':
        return <BusinessIcon sx={{ color }} />;
      case 'VILLA':
      case '빌라':
      case 'HOUSE':
      case '단독/다가구':
        return <HomeIcon sx={{ color }} />;
      case 'RETAIL':
      case '상가':
      case '상가주택':
        return <StoreIcon sx={{ color }} />;
      case 'OFFICE':
      case '사무실':
        return <BusinessIcon sx={{ color }} />;
      default:
        return <LocationIcon sx={{ color }} />;
    }
  };

  if (!transition && !isOpen) return null;

  return (
    <Slide direction={isMobile ? "up" : "left"} in={isOpen} mountOnEnter unmountOnExit>
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          ...(isMobile ? {
            // 모바일에서의 스타일
            bottom: 0,
            left: 0,
            right: 0,
            height: '40%',
            width: '100%',
            borderRadius: '16px 16px 0 0',
            zIndex: 1300,
            boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.1)',
            transform: 'translate3d(0, 0, 0)'
          } : {
            // 데스크톱에서의 스타일
            right: 0,
            top: 0,
            width: '300px',
            height: '100%',
            borderLeft: '1px solid',
            borderColor: 'divider',
            zIndex: 1000
          }),
          overflowY: 'auto',
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: isMobile ? 1 : 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          backgroundColor: 'background.paper',
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"}>
            동일 위치 매물 ({articles.length}개)
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon/>
          </IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <List sx={{p: isMobile ? 1 : 2}}>
            {articles.map((article) => (
              <ListItem 
                key={article.id}
                disablePadding
                sx={{
                  mb: 1,
                  bgcolor: selectedArticle?.id === article.id ? 'action.selected' : 'background.paper',
                  borderRadius: 1,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
                onClick={() => onArticleClick(article)}
              >
                <Box sx={{ p: 1, width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    {getBuildingIcon(article.buildingType)}
                    <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 'bold' }}>
                      {article.articleName || '이름 없는 매물'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip 
                      label={article.tradeType} 
                      size="small" 
                      color={
                        article.tradeType === 'SALE' || article.tradeType === '매매' ? 'primary' :
                        article.tradeType === 'LEASE' || article.tradeType === '전세' ? 'secondary' : 'default'
                      }
                      sx={{ fontSize: '0.7rem', height: '20px' }}
                    />
                    
                    <Typography variant="subtitle2" color="primary" fontWeight="bold">
                      {formatPrice(article.priceSale)}
                      {article.priceRent > 0 && article.tradeType !== 'SALE' && ` / ${article.priceRent}만`}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.5 }}>
                    {article.addressFullRoad || article.addressFullLot || '-'}
                  </Typography>
                  
                  {article.areaExclusive && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                      {article.areaExclusive}㎡ {article.floors && `/ ${article.floors}`}
                    </Typography>
                  )}
                  
                  <Divider sx={{ my: 0.5 }} />
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>
    </Slide>
  );
};

const KakaoMap: React.FC<KakaoMapProps> = ({
  initialCenter = { lat: 37.505, lng: 127.045 }, // 강남 초기 위치
  initialZoom = 5, // 클러스터 보이는 줌 레벨
  activeFilters,
  mapRef: externalMapRef,
  onBoundsChanged,
}) => {
  useKakaoLoader({ appkey: import.meta.env.VITE_KAKAO_APP_KEY, libraries: ["services", "clusterer"] });

  const internalMapRef = useRef<kakao.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const [mapZoom, setMapZoom] = useState(initialZoom);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [clusters, setClusters] = useState<ClusterData[]>([]);
  const [regionPolygons, setRegionPolygons] = useState<RegionPolygon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [snackbarInfo, setSnackbarInfo] = useState<SnackbarError | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null); // 선택된 마커 ID 상태
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [articleLoading, setArticleLoading] = useState<boolean>(false);
  const [sameLocationMarkers, setSameLocationMarkers] = useState<{[key: string]: number}>({});
  
  // 동일 위치 매물 리스트 상태
  const [sameLocationArticles, setSameLocationArticles] = useState<Article[]>([]);
  const [sameLocationListOpen, setSameLocationListOpen] = useState<boolean>(false);
  const [sameLocationPosition, setSameLocationPosition] = useState<{lat: number, lng: number}>({lat: 0, lng: 0});
  
  const loadMapDataRequestIdRef = useRef(0); // 요청 ID 추적을 위한 ref
  
  // 각 구역별 폴리곤 색상 캐싱 (리렌더링 시 색상 유지)
  const regionColors = useRef<{[key: string]: string}>({});

  // 행정구역 GeoJSON 데이터 저장을 위한 Ref 및 로딩 상태
  const dongGeoJsonDataRef = useRef<any>(null);
  const guGeoJsonDataRef = useRef<any>(null);
  const [boundariesLoading, setBoundariesLoading] = useState(true);
  const [showRegionPolygons, setShowRegionPolygons] = useState(true); // 폴리곤 표시 상태

  // 초기 행정구역 데이터 로드 useEffect
  useEffect(() => {
    const loadInitialBoundaries = async () => {
      try {
        setBoundariesLoading(true);
        console.log('초기 행정구역 데이터 로드 시작: 동');
        const dongData = await getRegionBoundaries('dong');
        dongGeoJsonDataRef.current = dongData;
        console.log('동 데이터 로드 완료, 데이터 일부:', dongData?.features?.[0]?.properties);
        
        console.log('초기 행정구역 데이터 로드 시작: 구');
        const guData = await getRegionBoundaries('gu');
        guGeoJsonDataRef.current = guData;
        console.log('구 데이터 로드 완료, 데이터 일부:', guData?.features?.[0]?.properties);

      } catch (error) {
        console.error("초기 행정구역 데이터 로드 실패:", error);
        setSnackbarInfo({
          title: '경계 로드 오류',
          message: '행정구역 경계 정보를 불러오는데 실패했습니다.',
          type: 'error'
        });
      } finally {
        setBoundariesLoading(false);
        console.log('초기 행정구역 데이터 로드 종료');
      }
    };
    loadInitialBoundaries();
  }, []); // 빈 의존성 배열로 마운트 시 1회 실행

  const getRandomColor = (alphaParam: number = 0.3): string => {
    const r = Math.floor(Math.random() * 200);
    const g = Math.floor(Math.random() * 200);
    const b = Math.floor(Math.random() * 200);
    return `rgba(${r}, ${g}, ${b}, ${alphaParam})`;
  };

  const getRegionColor = (regionId: string): string => {
    if (!regionColors.current[regionId]) {
      regionColors.current[regionId] = getRandomColor(0.2); // 폴리곤 색상 투명도 조절
    }
    return regionColors.current[regionId];
  };

  useEffect(() => {
    if (internalMapRef.current && externalMapRef) {
      externalMapRef.current = internalMapRef.current;
    }
  }, [externalMapRef]);

  const loadMapData = useCallback(async (boundingBox: BoundingBox, zoomLevel: number) => {
    const currentRequestId = ++loadMapDataRequestIdRef.current;
    setIsLoading(true);
    setSnackbarInfo(null);
    setMarkers([]);
    setClusters([]);
    setRegionPolygons([]); // 폴리곤도 초기화

    try {
      const boundaryType = zoomLevel >= 6 ? 'gu' : 'dong';
      const selectedGeoJsonData = boundaryType === 'dong' ? dongGeoJsonDataRef.current : guGeoJsonDataRef.current;

      if (boundariesLoading) {
        setLoadingMessage('행정구역 정보 로딩 중...');
        // 경계 데이터가 아직 로딩 중이면, 폴리곤 관련 처리를 잠시 보류하거나 로딩 메시지만 표시
      } else if (selectedGeoJsonData) {
        setLoadingMessage('지역 폴리곤 정보 처리 중...');
        const regionPolygonData = await fetchRegionPolygonsAPI(selectedGeoJsonData, boundaryType);
        if (loadMapDataRequestIdRef.current === currentRequestId) {
          setRegionPolygons(regionPolygonData);
        }
      } else {
        console.warn(`${boundaryType} 경계 데이터 사용 불가.`);
        // 경계 데이터 로드 실패 시 사용자에게 알림 또는 대체 로직 (현재는 콘솔 경고만)
      }
      if (loadMapDataRequestIdRef.current !== currentRequestId) return; // 중간에 요청 ID 변경 시 중단

      // 마커 및 클러스터 로직 (기존과 유사하게 진행)
      if (zoomLevel <= 2) {
        setLoadingMessage('매물 정보를 불러오는 중...');
        const markerDataList = await fetchMarkersAPI(boundingBox, activeFilters);
        if (loadMapDataRequestIdRef.current !== currentRequestId) return;
        setMarkers(markerDataList);
        setClusters([]);
        const locationCounts: {[key: string]: number} = {};
        markerDataList.forEach(marker => {
          const position = parseGeoJsonCoordinates(marker.geoJson);
          if (position) {
            const locationKey = `${position.lat.toFixed(6)},${position.lng.toFixed(6)}`;
            locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;
          }
        });
        setSameLocationMarkers(locationCounts);
        if (markerDataList.length === 0 && !boundariesLoading && selectedGeoJsonData) {
          // 폴리곤은 있지만 마커가 없을 수 있음
        }
      } else { // zoomLevel > 2
        setLoadingMessage('매물 클러스터를 불러오는 중...');
        const clusterDataList = await fetchClustersAPI(boundingBox, zoomLevel, activeFilters);
        if (loadMapDataRequestIdRef.current !== currentRequestId) return;
        setClusters(clusterDataList);
        setMarkers([]);
        if (clusterDataList.length === 0 && !boundariesLoading && selectedGeoJsonData) {
          // 폴리곤은 있지만 클러스터가 없을 수 있음
        }
      }
    } catch (err) {
      if (loadMapDataRequestIdRef.current !== currentRequestId) return;
      console.error("지도 데이터 로드 중 오류:", err);
      setSnackbarInfo({
        title: '오류',
        message: '지도 데이터를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        type: 'error'
      });
    } finally {
      if (loadMapDataRequestIdRef.current === currentRequestId) {
        setIsLoading(false);
        setLoadingMessage('');
      }
    }
  }, [activeFilters, boundariesLoading]); // boundariesLoading 의존성 추가

  // 지도 데이터 로딩을 위한 useEffect (초기 로드 및 activeFilters 변경 시)
  useEffect(() => {
    if (internalMapRef.current) {
      const map = internalMapRef.current;
      const bounds = map.getBounds();
      const swLatLng = bounds.getSouthWest();
      const neLatLng = bounds.getNorthEast();
      const zoom = map.getLevel();
      const currentBoundingBox: BoundingBox = {
        swLat: swLatLng.getLat(),
        swLng: swLatLng.getLng(),
        neLat: neLatLng.getLat(),
        neLng: neLatLng.getLng(),
      };
      loadMapData(currentBoundingBox, zoom);
    }
  }, [activeFilters, loadMapData]);

  // 지도 유휴 상태 이벤트 핸들러 (useCallback으로 메모이즈)
  const handleMapIdle = useCallback((mapInstance: kakao.maps.Map) => {
    const bounds = mapInstance.getBounds();
    const swLatLng = bounds.getSouthWest();
    const neLatLng = bounds.getNorthEast();
    const zoom = mapInstance.getLevel();

    const currentBoundingBox: BoundingBox = {
      swLat: swLatLng.getLat(),
      swLng: swLatLng.getLng(),
      neLat: neLatLng.getLat(),
      neLng: neLatLng.getLng(),
    };

    // 외부 bounds 변경 콜백 호출
    if (onBoundsChanged) {
      onBoundsChanged({
        sw: { lat: swLatLng.getLat(), lng: swLatLng.getLng() },
        ne: { lat: neLatLng.getLat(), lng: neLatLng.getLng() }
      }, zoom);
    }

    loadMapData(currentBoundingBox, zoom);
  }, [loadMapData, onBoundsChanged]);

  // 지도 생성 시 호출될 콜백 (useCallback으로 메모이즈, 안정적인 참조 유지)
  const onMapCreate = useCallback((map: kakao.maps.Map) => {
    internalMapRef.current = map;
    if (externalMapRef) {
      externalMapRef.current = map;
    }

    // 지도 생성 후 즉시 현재 경계 정보를 가져와 데이터 로드
    const bounds = map.getBounds();
    const swLatLng = bounds.getSouthWest();
    const neLatLng = bounds.getNorthEast();
    const zoom = map.getLevel();

    const initialBoundingBox: BoundingBox = {
      swLat: swLatLng.getLat(),
      swLng: swLatLng.getLng(),
      neLat: neLatLng.getLat(),
      neLng: neLatLng.getLng(),
    };

    // 초기 데이터 로드
    loadMapData(initialBoundingBox, zoom);
  }, [externalMapRef, loadMapData]);

  // 확대 수준 변경 핸들러 (메모이즈)
  const onMapZoomChanged = useCallback((map: kakao.maps.Map) => {
    setMapZoom(map.getLevel());
  }, []);

  // 중심점 변경 핸들러 (메모이즈)
  const onMapCenterChanged = useCallback((map: kakao.maps.Map) => {
    setMapCenter({ lat: map.getCenter().getLat(), lng: map.getCenter().getLng() });
  }, []);

  // 지도 클릭 핸들러 (메모이즈) - 마커 선택 해제 로직 제거
  const onMapClick = useCallback(() => {
    // setSelectedMarkerId(null); // 데이터 로드 시 선택 해제는 UX에 따라 결정 (주석 처리)
  }, []);

  // 스낵바 닫기 핸들러
  const handleSnackbarClose = () => {
    setSnackbarInfo(null);
  };

  // 가격 포맷팅 함수
  const formatPrice = (price?: number): string => {
    if (!price) return '-';

    if (price >= 10000) {
      const eok = Math.floor(price / 10000);
      const cheonman = price % 10000;
      return cheonman > 0 ? `${eok}억 ${cheonman.toLocaleString()}만원` : `${eok}억원`;
    }

    return `${price.toLocaleString()}만원`;
  };

  // 매물 상세정보 불러오기
  const handleShowArticleDetail = useCallback(async (markerId: number) => {
    try {
      setArticleLoading(true);
      const article = await fetchArticleDetail(markerId);
      setSelectedArticle(article);
      setDetailModalOpen(true);
      setSelectedMarkerId(markerId); // 상세 정보 보기 시 마커 선택 상태 유지
    } catch (error) {
      setSnackbarInfo({
        title: '오류',
        message: '매물 상세정보를 불러오는데 실패했습니다.',
        type: 'error'
      });
    } finally {
      setArticleLoading(false);
    }
  }, []);

  // 모달 닫기
  const handleCloseDetailModal = useCallback(() => {
    setDetailModalOpen(false);
    setSelectedMarkerId(null); // 모달 닫을 때 마커 선택 해제
  }, []);

  // 매물 상세정보 아이템 변환 함수
  const getArticleDetailItems = useCallback(() => {
    if (!selectedArticle) return [];

    return [
      { label: '매물명', value: selectedArticle.articleName || '-' },
      { label: '거래 유형', value: selectedArticle.tradeType || '-' },
      { label: '건물 유형', value: selectedArticle.buildingType || '-' },
      { label: '매매가/보증금', value: formatPrice(selectedArticle.priceSale) },
      { label: '월세', value: selectedArticle.priceRent ? `${selectedArticle.priceRent}만원` : '-' },
      { label: '층수', value: selectedArticle.floors || '-' },
      { label: '공급면적', value: selectedArticle.areaSupply ? `${selectedArticle.areaSupply}㎡` : '-' },
      { label: '전용면적', value: selectedArticle.areaExclusive ? `${selectedArticle.areaExclusive}㎡` : '-' },
      { label: '방향', value: selectedArticle.direction || '-' },
      { label: '주소(지번)', value: selectedArticle.addressFullLot || '-' },
      { label: '주소(도로명)', value: selectedArticle.addressFullRoad || '-' },
      { label: '매물 설명', value: selectedArticle.articleDesc || '-' },
      { label: '공인중개사', value: selectedArticle.agency || '-' },
      { label: '정보 제공 출처', value: selectedArticle.companyName || '-' },
      { label: '주변 지하철역', value: selectedArticle.subway || '-' },
      { label: '사용승인일', value: selectedArticle.confirmedAt || '-' },
    ];
  }, [selectedArticle]);

  // 동일 위치 매물 목록 불러오기
  const handleShowSameLocationArticles = useCallback(async (markerId: number, position: {lat: number, lng: number}) => {
    try {
      setArticleLoading(true);
      
      // 위경도가 같은 모든 마커 아이디 찾기
      const locationKey = `${position.lat.toFixed(6)},${position.lng.toFixed(6)}`;
      const sameLocationMarkerIds: number[] = [];
      
      markers.forEach(marker => {
        const markerPosition = parseGeoJsonCoordinates(marker.geoJson);
        if (!markerPosition) return;
        
        const markerLocationKey = `${markerPosition.lat.toFixed(6)},${markerPosition.lng.toFixed(6)}`;
        if (markerLocationKey === locationKey) {
          sameLocationMarkerIds.push(marker.id);
        }
      });
      
      // 모든 매물 상세 정보 불러오기
      const articlesPromises = sameLocationMarkerIds.map(id => fetchArticleDetail(id));
      const articles = await Promise.all(articlesPromises);
      
      // 매물 리스트 및 위치 설정
      setSameLocationArticles(articles);
      setSameLocationPosition(position);
      setSameLocationListOpen(true);
      setSelectedMarkerId(markerId); // 클릭한 마커는 하이라이트
      
    } catch (error) {
      setSnackbarInfo({
        title: '오류',
        message: '동일 위치 매물 정보를 불러오는데 실패했습니다.',
        type: 'error'
      });
    } finally {
      setArticleLoading(false);
    }
  }, [markers]);

  // 동일 위치 매물 목록에서 선택
  const handleSameLocationArticleClick = useCallback((article: Article) => {
    setSelectedArticle(article);
    setDetailModalOpen(true);
    setSelectedMarkerId(article.id);
  }, []);
  
  // 동일 위치 매물 목록 닫기
  const handleCloseSameLocationList = useCallback(() => {
    setSameLocationListOpen(false);
    setSelectedMarkerId(null);
  }, []);

  const handleToggleRegionPolygons = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowRegionPolygons(event.target.checked);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 폴리곤 표시 토글 버튼 */}
      <Box 
        sx={{
          position: 'absolute',
          top: '16px', // 조정 가능
          left: '16px', // 조정 가능
          zIndex: 15, // 다른 UI 요소들보다 위에 오도록 설정
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '4px 8px 4px 4px',
          borderRadius: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Tooltip title={showRegionPolygons ? "구역 경계 숨기기" : "구역 경계 표시"} placement="right">
          <FormControlLabel
            control={<Switch checked={showRegionPolygons} onChange={handleToggleRegionPolygons} size="small" />}
            labelPlacement="start"
            label={<Typography variant="caption" sx={{ color: 'text.secondary', mr: 0.5 }}>구역경계</Typography>}
            sx={{ mr: 0 }} // 기본 마진 제거
          />
        </Tooltip>
      </Box>

      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 20, // 로딩 인디케이터는 최상단에 위치
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <CircularProgress sx={{ color: '#3E54AC' }} />
          {loadingMessage && <Typography variant="subtitle1" sx={{ mt: 2, color: '#3E54AC', fontWeight: '500' }}>{loadingMessage}</Typography>}
        </Box>
      )}

      <Map
        center={mapCenter}
        style={{ width: "100%", height: "100%" }}
        level={mapZoom}
        onCreate={onMapCreate}
        onIdle={handleMapIdle}
        onZoomChanged={onMapZoomChanged}
        onCenterChanged={onMapCenterChanged}
        onClick={onMapClick}
        ref={internalMapRef}
      >
        {!boundariesLoading && showRegionPolygons && regionPolygons.map((region) => {
          const regionColor = getRegionColor(region.regionId);
          return (
            <React.Fragment key={region.regionId}>
              {region.multiPolygon.map((polygon, polyIdx) => 
                polygon.map((ring, ringIdx) => {
                  const path = ring.map(coord => ({
                    lat: coord[1],
                    lng: coord[0]
                  }));
                  return (
                    <Polygon
                      key={`${region.regionId}-${polyIdx}-${ringIdx}`}
                      path={path}
                      strokeColor="#333"
                      strokeOpacity={0.6}
                      strokeWeight={1}
                      fillColor={regionColor} 
                      fillOpacity={0.7} 
                    />
                  );
                })
              )}
              <CustomOverlayMap 
                position={{lat: region.centerLat, lng: region.centerLng}} 
                zIndex={5} // 클러스터보다 위에 오도록 zIndex 설정 (클러스터 기본 zIndex 고려)
              >
                <RegionLabel>
                  {region.regionName}
                </RegionLabel>
              </CustomOverlayMap>
            </React.Fragment>
          );
        })}

        {markers.map((marker) => {
          const position = parseGeoJsonCoordinates(marker.geoJson);
          if (!position) return null;
          const locationKey = `${position.lat.toFixed(6)},${position.lng.toFixed(6)}`;
          const sameLocationCount = sameLocationMarkers[locationKey] || 0;
          const isSelected = selectedMarkerId === marker.id;
          const markerSvg = createMarkerIcon(marker.buildingType, isSelected, sameLocationCount);
          const markerUrl = svgToDataUrl(markerSvg);
          const baseSvgSize = 36;
          const imageDisplaySize = isSelected ? baseSvgSize * 1.5 : baseSvgSize;

          return (
            <MapMarker
              key={marker.id} // React.Fragment에서 key를 MapMarker로 이동
              position={position}
              onClick={() => {
                if (sameLocationCount > 1) {
                  handleShowSameLocationArticles(marker.id, position);
                } else {
                  handleShowArticleDetail(marker.id);
                }
              }}
              image={{
                src: markerUrl,
                size: { width: imageDisplaySize, height: imageDisplaySize },
                options: { offset: { x: imageDisplaySize / 2, y: imageDisplaySize / 2 } }
              }}
              zIndex={isSelected ? 10 : 1} // 선택된 마커가 최상단, 일반 마커는 RegionLabel 아래
            />
          );
        })}

        {clusters.map((cluster, index) => {
          const position = parseGeoJsonCoordinates(cluster.geoJson);
          if (!position) return null;
          const bgColor = getClusterColorWithOpacity(cluster.count || 0);

          return (
            <CustomOverlayMap 
              key={`cluster-${index}`} 
              position={position}
              zIndex={4} // RegionLabel(5) 보다는 아래, 일반 마커(1) 보다는 위
            >
              <ClusterBox
                onClick={() => {
                  if (internalMapRef.current) {
                    internalMapRef.current.setCenter(new kakao.maps.LatLng(position.lat, position.lng));
                    internalMapRef.current.setLevel(2);
                    setSelectedMarkerId(null); 
                  }
                }}
                sx={{ backgroundColor: bgColor }}
              >
                {cluster.count || 0}
              </ClusterBox>
            </CustomOverlayMap>
          );
        })}
      </Map>

      {/* 동일 위치 매물 리스트 */}
      <SameLocationArticleList
        articles={sameLocationArticles}
        isOpen={sameLocationListOpen}
        onClose={handleCloseSameLocationList}
        onArticleClick={handleSameLocationArticleClick}
        selectedArticle={selectedArticle}
        location={sameLocationPosition}
      />

      {snackbarInfo && (
        <Snackbar
          open={!!snackbarInfo}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snackbarInfo.type}
            onClose={handleSnackbarClose}
            sx={{ width: '100%' }}
          >
            <AlertTitle>{snackbarInfo.title}</AlertTitle>
            {snackbarInfo.message}
          </Alert>
        </Snackbar>
      )}

      {selectedArticle && (
        <ArticleDetailModal
          open={detailModalOpen}
          onClose={handleCloseDetailModal}
          article={selectedArticle}
        />
      )}
    </Box>
  );
}

export default KakaoMap;
