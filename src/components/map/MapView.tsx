import { useEffect, useRef, useState } from 'react';
import { Box, Alert, Popover, Typography, Button } from '@mui/material';
import type { ArticleResponse } from '../../types/article';
import MarkerPopup from './MarkerPopup';

interface Region {
    id: number;
    cortarNo: string;
    centerLat: number;
    centerLon: number;
    cortarName: string;
    areaFull?: string;
    cortarType: string | null;
}

interface MapViewProps {
    articles: ArticleResponse[];
    selectedArticle: ArticleResponse | null;
    onArticleClick: (article: ArticleResponse) => void;
    getTypeColor: (type: string) => string;
    getTypeEmoji: (type: string) => string;
    getTradeTypeColor: (type: string) => string;
    formatPrice: (price: number | string | null) => string;
    selectedRegions?: {
        city: string;
        district: string;
        neighborhoods: string[];
    };
    allRegions?: Region[];
}

const MapView = ({
    articles,
    selectedArticle,
    onArticleClick,
    getTypeColor,
    getTypeEmoji,
    getTradeTypeColor,
    formatPrice,
    selectedRegions,
    allRegions
}: MapViewProps) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const [map, setMap] = useState<any>(null);
    const [clusterer, setClusterer] = useState<any>(null);
    const [hoveredArticle, setHoveredArticle] = useState<ArticleResponse | null>(null);
    const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
    const [infoWindow, setInfoWindow] = useState<any>(null);
    const [mapErrorMessage, setMapErrorMessage] = useState<string | null>(null);
    const [popoverArticle, setPopoverArticle] = useState<ArticleResponse | null>(null);
    const [anchorPosition, setAnchorPosition] = useState<{ top: number, left: number } | null>(null);
    const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY;
    
    // 카카오맵 스크립트 로드
    useEffect(() => {
        if (!KAKAO_APP_KEY) {
            console.error('Kakao API key is not defined');
            return;
        }

        // 이미 스크립트 요소가 있는지 확인
        const kakaoMapScript = document.getElementById('kakao-map-script');
        
        // 이미 로드된 경우 완료 플래그 설정
        if (kakaoMapScript && (window as any).kakao && (window as any).kakao.maps) {
            console.log('Kakao Maps script is already loaded');
            setIsScriptLoaded(true);
            return;
        }
        
        // 스크립트가 없거나 불완전하게 로드된 경우, 기존 스크립트 제거
        if (kakaoMapScript) {
            kakaoMapScript.remove();
        }

        // 새 스크립트 생성 및 로드
        const script = document.createElement('script');
        script.id = 'kakao-map-script';
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services,clusterer,drawing&autoload=false`;
        script.async = true;
        
        script.onload = () => {
            console.log('Kakao Maps script loaded');
            (window as any).kakao.maps.load(() => {
                console.log('Kakao Maps API loaded');
                setIsScriptLoaded(true);
            });
        };

        script.onerror = (error) => {
            console.error('Failed to load Kakao Map SDK:', error);
            setMapErrorMessage("Kakao 맵 스크립트 로드에 실패했습니다. 기능을 정상적으로 이용하기 위해 브라우저의 서드파티 쿠키 사용(또는 Partitioned 쿠키 설정)을 허용해 주세요.");
        };

        document.head.appendChild(script);

        // 클린업 함수에서는 스크립트를 제거하지 않음 (다른 컴포넌트에서 재사용)
    }, [KAKAO_APP_KEY]);

    // 맵 초기화 (스크립트 로드 완료 후)
    useEffect(() => {
        if (!isScriptLoaded || !mapRef.current) return;

        try {
            console.log('Initializing map...');
            const container = mapRef.current;
            const options = {
                center: new (window as any).kakao.maps.LatLng(37.5665, 126.9780),
                level: 8
            };
            
            const kakaoMap = new (window as any).kakao.maps.Map(container, options);
            mapInstance.current = kakaoMap;
            setMap(kakaoMap);

            // 인포윈도우 초기화
            const infoWindowInstance = new (window as any).kakao.maps.InfoWindow({
                removable: true,
                zIndex: 1
            });
            setInfoWindow(infoWindowInstance);

            // 클러스터러 초기화
            const markerClusterer = new (window as any).kakao.maps.MarkerClusterer({
                map: kakaoMap,
                averageCenter: true,
                minLevel: 6,
                disableClickZoom: true,
                gridSize: 50,
                styles: [{
                    width: '50px',
                    height: '50px',
                    background: 'rgba(255, 107, 107, 0.8)',
                    borderRadius: '50%',
                    color: '#fff',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    lineHeight: '50px',
                    fontSize: '16px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    border: '2px solid white'
                }]
            });
            
            setClusterer(markerClusterer);
            setIsMapLoaded(true);
            console.log('Map initialized successfully');

            // 클러스터 클릭 이벤트 추가
            (window as any).kakao.maps.event.addListener(markerClusterer, 'clusterclick', (cluster: any) => {
                const clusterMarkers = cluster.getMarkers();
                if (clusterMarkers.length > 0) {
                    // 클러스터의 중심으로 지도 이동
                    const bounds = new (window as any).kakao.maps.LatLngBounds();
                    clusterMarkers.forEach((marker: any) => {
                        bounds.extend(marker.getPosition());
                    });
                    kakaoMap.setBounds(bounds);
                    kakaoMap.setLevel(3);
                }
            });
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }, [isScriptLoaded]);

    // 마커 업데이트 (articles 변경 시)
    useEffect(() => {
        if (!isMapLoaded || !mapInstance.current || !clusterer || articles.length === 0) {
            return;
        }

        try {
            console.log('Updating markers for', articles.length, 'articles');
            // 기존 마커 제거
            clusterer.clear();
            const newMarkers: any[] = [];

            articles.forEach(article => {
                if (!article.latitude || !article.longitude) return;
                
                // 좌표값 유효성 검사
                const lat = typeof article.latitude === 'number' ? article.latitude : parseFloat(article.latitude);
                const lng = typeof article.longitude === 'number' ? article.longitude : parseFloat(article.longitude);
                
                if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                    console.error('Invalid coordinates:', article.latitude, article.longitude);
                    return;
                }

                const markerPosition = new (window as any).kakao.maps.LatLng(lat, lng);
                
                // 마커 이미지 생성
                const markerImage = new (window as any).kakao.maps.MarkerImage(
                    `data:image/svg+xml,${encodeURIComponent(`
                        <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="25" cy="25" r="23" fill="${getTypeColor(article.realEstateType)}" stroke="white" stroke-width="2" />
                            <text x="25" y="32" font-size="24" text-anchor="middle" fill="white">
                                ${getTypeEmoji(article.realEstateType)}
                            </text>
                        </svg>
                    `)}`,
                    new (window as any).kakao.maps.Size(50, 50),
                    { offset: new (window as any).kakao.maps.Point(25, 25) }
                );
                
                // 마커 생성
                const marker = new (window as any).kakao.maps.Marker({
                    position: markerPosition,
                    image: markerImage, // 생성된 마커 이미지 설정
                    map: null, // 클러스터러에 추가될 것이므로 map 속성은 null로 설정
                    title: article.name
                });

                // 마커에 이벤트 등록
                (window as any).kakao.maps.event.addListener(marker, 'mouseover', () => {
                    setHoveredArticle(article);
                });

                (window as any).kakao.maps.event.addListener(marker, 'mouseout', () => {
                    setHoveredArticle(null);
                });

                (window as any).kakao.maps.event.addListener(marker, 'click', () => {
                    if (mapInstance.current && markerPosition) {
                        const projection = mapInstance.current.getProjection && mapInstance.current.getProjection();
                        let containerPoint = { x: 0, y: 0 };
                        if (projection && projection.pointFromCoords) {
                            containerPoint = projection.pointFromCoords(markerPosition);
                        } else if (mapRef.current) {
                            const rect = mapRef.current.getBoundingClientRect();
                            containerPoint = { x: rect.width / 2, y: rect.height / 2 };
                        }
                        setAnchorPosition({ top: containerPoint.y, left: containerPoint.x });
                        setPopoverArticle(article);
                    }
                    mapInstance.current.setCenter(markerPosition);
                    mapInstance.current.setLevel(3);
                });

                newMarkers.push(marker);
            });

            // 클러스터러에 마커 추가
            if (newMarkers.length > 0) {
                console.log('Adding', newMarkers.length, 'markers to clusterer');
                clusterer.addMarkers(newMarkers);
                
                // 모든 마커가 보이도록 지도 범위 조정
                const bounds = new (window as any).kakao.maps.LatLngBounds();
                newMarkers.forEach(marker => {
                    bounds.extend(marker.getPosition());
                });
                mapInstance.current.setBounds(bounds);
            }
        } catch (error) {
            console.error('Error updating markers:', error);
        }
    }, [articles, selectedArticle, isMapLoaded, clusterer, infoWindow, getTypeColor, getTypeEmoji, getTradeTypeColor, formatPrice, onArticleClick]);

    // 선택된 매물이 변경될 때 해당 위치로 이동
    useEffect(() => {
        if (!isMapLoaded || !mapInstance.current || !selectedArticle || !selectedArticle.latitude || !selectedArticle.longitude) return;
        
        try {
            const lat = typeof selectedArticle.latitude === 'number' ? selectedArticle.latitude : parseFloat(selectedArticle.latitude);
            const lng = typeof selectedArticle.longitude === 'number' ? selectedArticle.longitude : parseFloat(selectedArticle.longitude);
            
            if (isNaN(lat) || isNaN(lng)) return;
            
            const position = new (window as any).kakao.maps.LatLng(lat, lng);
            mapInstance.current.setCenter(position);
            mapInstance.current.setLevel(3);
        } catch (error) {
            console.error('Error focusing on selected article:', error);
        }
    }, [selectedArticle, isMapLoaded]);

    // 선택된 지역이 변경될 때 지도 중심 이동
    useEffect(() => {
        if (!isMapLoaded || !mapInstance.current || !selectedRegions || !allRegions || allRegions.length === 0) return;

        try {
            // 선택된 지역 정보로 중심점 찾기
            let targetRegion: Region | undefined;
            
            if (selectedRegions.neighborhoods.length > 0) {
                // 선택된 동이 있으면 해당 동의 중심점으로 이동
                const neighborhood = selectedRegions.neighborhoods[0];
                targetRegion = allRegions.find(r => 
                    r.cortarName === neighborhood && 
                    r.areaFull?.includes(selectedRegions.district) &&
                    r.areaFull?.includes(selectedRegions.city)
                );
            } else if (selectedRegions.district) {
                // 선택된 구가 있으면 해당 구의 중심점으로 이동
                targetRegion = allRegions.find(r => 
                    r.cortarName === selectedRegions.district && 
                    r.areaFull?.includes(selectedRegions.city)
                );
            } else if (selectedRegions.city) {
                // 선택된 시가 있으면 해당 시의 중심점으로 이동
                targetRegion = allRegions.find(r => 
                    r.cortarName === selectedRegions.city ||
                    (r.areaFull && r.areaFull.startsWith(selectedRegions.city))
                );
            }

            if (targetRegion && targetRegion.centerLat && targetRegion.centerLon) {
                console.log('Moving map to selected region:', targetRegion.cortarName);
                const position = new (window as any).kakao.maps.LatLng(
                    targetRegion.centerLat, 
                    targetRegion.centerLon
                );
                mapInstance.current.setCenter(position);
                
                // 지역 크기에 따라 확대 레벨 조정
                if (selectedRegions.neighborhoods.length > 0) {
                    mapInstance.current.setLevel(3); // 동 레벨은 가장 확대
                } else if (selectedRegions.district) {
                    mapInstance.current.setLevel(5); // 구 레벨은 중간 확대
                } else {
                    mapInstance.current.setLevel(8); // 시 레벨은 넓게 표시
                }
            }
        } catch (error) {
            console.error('Error focusing on selected region:', error);
        }
    }, [isMapLoaded, selectedRegions, allRegions]);

    return (
        <>
            {mapErrorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {mapErrorMessage}
                </Alert>
            )}
            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                {hoveredArticle && (
                    <Box sx={{ 
                        position: 'absolute', 
                        top: 20, 
                        left: 20, 
                        pointerEvents: 'none',
                        zIndex: 999
                    }}>
                        <MarkerPopup
                            article={hoveredArticle}
                            getTypeColor={getTypeColor}
                            getTypeEmoji={getTypeEmoji}
                            getTradeTypeColor={getTradeTypeColor}
                            formatPrice={formatPrice}
                        />
                    </Box>
                )}
            </Box>
            <Popover
                open={Boolean(popoverArticle)}
                anchorReference="anchorPosition"
                anchorPosition={anchorPosition ? { top: anchorPosition.top, left: anchorPosition.left } : { top: 0, left: 0 }}
                onClose={() => setPopoverArticle(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                {popoverArticle && (
                    <Box sx={{ p: 2, maxWidth: 300 }}>
                        <Typography variant="h6">
                            {popoverArticle.name || popoverArticle.buildingName || '매물'}
                        </Typography>
                        <Typography variant="subtitle2">
                            {popoverArticle.cortarName || ''}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                            {popoverArticle.tradeType}: {formatPrice(popoverArticle.price)}
                        </Typography>
                        {(popoverArticle.tradeType === "전세" || popoverArticle.tradeType === "월세" || popoverArticle.tradeType === "단기임대") && popoverArticle.rentPrice > 0 && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                                월세: {formatPrice(popoverArticle.rentPrice)}
                            </Typography>
                        )}
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            sx={{ mt: 2 }}
                            onClick={() => { onArticleClick(popoverArticle); setPopoverArticle(null); }}
                        >
                            상세정보 보기
                        </Button>
                    </Box>
                )}
            </Popover>
        </>
    );
};

export default MapView; 
