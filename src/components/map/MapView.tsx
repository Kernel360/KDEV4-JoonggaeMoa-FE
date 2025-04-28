import { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Alert, Popover, Typography, Button } from '@mui/material';
import type { ArticleResponse } from '../../types/article';
import MarkerPopup from './MarkerPopup';
import { formatPrice, getTypeColor, getTypeEmoji, getTradeTypeColor } from '../../utils/articleUtils';
import ArticleDetail from '../ArticleDetail';

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
    selectedRegions?: {
        city: string;
        district: string;
        neighborhoods: string[];
    };
    allRegions?: Region[];
    initialCenter?: {lat: number, lng: number};
    initialZoom?: number;
    fixedInitialView?: boolean;
}

const MapView = ({
    articles,
    selectedArticle,
    onArticleClick,
    selectedRegions,
    allRegions,
    initialCenter,
    initialZoom,
    fixedInitialView
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
    const [mapBounds, setMapBounds] = useState<any>(null);
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
                center: new (window as any).kakao.maps.LatLng(
                    initialCenter?.lat || 37.5665, 
                    initialCenter?.lng || 126.9780
                ),
                level: initialZoom || 8
            };
            
            const kakaoMap = new (window as any).kakao.maps.Map(container, options);
            mapInstance.current = kakaoMap;
            setMap(kakaoMap);

            // 초기 지도 경계 설정
            const bounds = kakaoMap.getBounds();
            setMapBounds(bounds);

            // 지도 이동 완료 시 경계 업데이트 이벤트 추가
            (window as any).kakao.maps.event.addListener(kakaoMap, 'idle', () => {
                const newBounds = kakaoMap.getBounds();
                setMapBounds(newBounds);
                console.log('Map bounds updated');
            });

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
    }, [isScriptLoaded, initialCenter, initialZoom]);

    // 거래 유형에 따른 마커 SVG를 생성하는 함수
    const getMarkerSvg = useCallback((article: ArticleResponse): string => {
        // 가격 숫자로 변환
        const numPrice = typeof article.priceSale === 'string' ? parseFloat(article.priceSale) : (article.priceSale || 0);
        const numRentPrice = article.priceRent || 0;
        
        // 거래 유형 판단
        let displayType;
        if (numPrice > 0 && numRentPrice === 0) {
            displayType = "매매"; // 원형
        } else if (numPrice > 0 && numRentPrice > 0) {
            displayType = "전세"; // 정사각형
        } else if (numPrice === 0 && numRentPrice > 0) {
            displayType = "월세"; // 정삼각형
        } else {
            displayType = article.tradeType; // 기본값은 원래 tradeType
        }
        
        const color = getTypeColor(article.buildingType);
        const emoji = getTypeEmoji(article.buildingType);
        
        // 선택된 매물인지 확인하고 opacity 설정
        const isSelected = selectedArticle && selectedArticle.id === article.id;
        const opacity = isSelected ? 0.7 : 1.0;
        
        if (displayType === "전세") {
            // 정사각형 - iOS 스타일 둥근 모서리 추가
            return `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="42" height="42" rx="10" ry="10" fill="${color}" stroke="white" stroke-width="2" opacity="${opacity}"/><text x="25" y="32" font-size="24" text-anchor="middle" fill="white">${emoji}</text></svg>`;
        } else if (displayType === "월세") {
            // 정삼각형 - 둥근 모서리를 위해 path 사용
            return `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><defs><filter id="round-triangle"><feGaussianBlur in="SourceGraphic" stdDeviation="1.3" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="rounded"/><feComposite in="SourceGraphic" in2="rounded" operator="atop"/></filter></defs><polygon points="25,4 46,42 4,42" fill="${color}" stroke="white" stroke-width="2" filter="url(#round-triangle)" opacity="${opacity}"/><text x="25" y="35" font-size="24" text-anchor="middle" fill="white">${emoji}</text></svg>`;
        } else {
            // 원형 (매매 또는 기본값)
            return `<svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"><circle cx="25" cy="25" r="23" fill="${color}" stroke="white" stroke-width="2" opacity="${opacity}"/><text x="25" y="32" font-size="24" text-anchor="middle" fill="white">${emoji}</text></svg>`;
        }
    }, [selectedArticle]);

    // 현재 마우스 오버된 마커의 위치를 화면 좌표로 업데이트하는 함수
    const updateHoveredMarkerPosition = useCallback(() => {
        if (!hoveredArticle || !mapInstance.current || !mapRef.current) return;
        
        // 현재 hoveredArticle의 위치 찾기
        const article = articles.find(a => a.id === hoveredArticle.id);
        if (!article || !article.latitude || !article.longitude) return;
        
        const lat = typeof article.latitude === 'number' ? article.latitude : parseFloat(article.latitude);
        const lng = typeof article.longitude === 'number' ? article.longitude : parseFloat(article.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        const position = new (window as any).kakao.maps.LatLng(lat, lng);
        const projection = mapInstance.current.getProjection();
        
        if (projection) {
            const point = projection.pointFromCoords(position);
            const mapRect = mapRef.current.getBoundingClientRect();
            
            // 마커 위치를 화면 좌표로 변환
            const screenX = mapRect.left + point.x;
            const screenY = mapRect.top + point.y - 10;
            
            console.log('Updating marker position:', { screenX, screenY });
            setAnchorPosition({ top: screenY, left: screenX });
        }
    }, [hoveredArticle, articles, mapInstance, mapRef]);

    // 현재 지도 경계 내에 있는 매물만 필터링하는 함수
    const filterVisibleArticles = useCallback((articles: ArticleResponse[]) => {
        if (!mapBounds) return articles;
        
        return articles.filter(article => {
            if (!article.latitude || !article.longitude) return false;
            
            const lat = typeof article.latitude === 'number' ? article.latitude : parseFloat(article.latitude);
            const lng = typeof article.longitude === 'number' ? article.longitude : parseFloat(article.longitude);
            
            if (isNaN(lat) || isNaN(lng)) return false;
            
            const position = new (window as any).kakao.maps.LatLng(lat, lng);
            return mapBounds.contain(position);
        });
    }, [mapBounds]);

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
                
                try {
                    // 마커 이미지 생성 - 거래 유형에 따라 다른 도형 사용
                    const svgString = getMarkerSvg(article);
                    // 개행 문자와 공백 제거로 URI 인코딩 오류 방지
                    const cleanedSvg = svgString.replace(/\n\s*/g, '');
                    const markerImage = new (window as any).kakao.maps.MarkerImage(
                        `data:image/svg+xml;base64,${btoa(cleanedSvg)}`,
                        new (window as any).kakao.maps.Size(50, 50),
                        { offset: new (window as any).kakao.maps.Point(25, 25) }
                    );
                    
                    // 마커 생성
                    const marker = new (window as any).kakao.maps.Marker({
                        position: markerPosition,
                        image: markerImage, // 생성된 마커 이미지 설정
                        map: null, // 클러스터러에 추가될 것이므로 map 속성은 null로 설정
                        title: article.articleName
                    });

                    // 마커에 이벤트 등록
                    (window as any).kakao.maps.event.addListener(marker, 'mouseover', () => {
                        setHoveredArticle(article);
                        
                        // 마커 위치를 화면 좌표로 변환
                        if (mapInstance.current && mapRef.current) {
                            const position = marker.getPosition();
                            const projection = mapInstance.current.getProjection();
                            if (projection) {
                                const point = projection.pointFromCoords(position);
                                const mapRect = mapRef.current.getBoundingClientRect();
                                
                                // 마커 위치를 화면 좌표로 변환
                                const screenX = mapRect.left + point.x;
                                const screenY = mapRect.top + point.y - 10; // 마커 위에 표시하기 위해 10px 위로
                                
                                console.log('Initial marker position:', { screenX, screenY });
                                setAnchorPosition({ top: screenY, left: screenX });
                            }
                        }
                    });

                    (window as any).kakao.maps.event.addListener(marker, 'mouseout', () => {
                        setHoveredArticle(null);
                        setAnchorPosition(null);
                    });

                    (window as any).kakao.maps.event.addListener(marker, 'click', () => {
                        // 마커 클릭 시 해당 매물의 상세 정보를 보여줍니다
                        onArticleClick(article);
                        
                        // 선택된 마커로 지도 이동
                        if (mapInstance.current && markerPosition) {
                            mapInstance.current.setCenter(markerPosition);
                            mapInstance.current.setLevel(3);
                        }
                    });

                    newMarkers.push(marker);
                } catch (error) {
                    console.error('Error creating marker for article:', article.id, error);
                }
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
    }, [articles, selectedArticle, isMapLoaded, clusterer, infoWindow, onArticleClick, getMarkerSvg]);

    // 선택된 매물이 변경될 때 해당 위치로 이동
    useEffect(() => {
        if (!isMapLoaded || !mapInstance.current || !selectedArticle || !selectedArticle.latitude || !selectedArticle.longitude) return;
        
        try {
            const lat = typeof selectedArticle.latitude === 'number' ? selectedArticle.latitude : parseFloat(selectedArticle.latitude);
            const lng = typeof selectedArticle.longitude === 'number' ? selectedArticle.longitude : parseFloat(selectedArticle.longitude);
            
            if (isNaN(lat) || isNaN(lng)) return;
            
            const position = new (window as any).kakao.maps.LatLng(lat, lng);
            mapInstance.current.setCenter(position);
            mapInstance.current.setLevel(3); // 맵 줌 레벨 3으로 설정
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

    // 지도 이동/줌 이벤트 처리
    useEffect(() => {
        if (!isMapLoaded || !mapInstance.current) return;
        
        // 지도 이동/줌 시 팝오버 위치 업데이트
        const moveHandler = () => {
            if (hoveredArticle) {
                updateHoveredMarkerPosition();
            }
        };
        
        (window as any).kakao.maps.event.addListener(mapInstance.current, 'drag', moveHandler);
        (window as any).kakao.maps.event.addListener(mapInstance.current, 'zoom_changed', moveHandler);
        
        return () => {
            if (mapInstance.current) {
                (window as any).kakao.maps.event.removeListener(mapInstance.current, 'drag', moveHandler);
                (window as any).kakao.maps.event.removeListener(mapInstance.current, 'zoom_changed', moveHandler);
            }
        };
    }, [isMapLoaded, hoveredArticle, updateHoveredMarkerPosition]);

    // 마커 렌더링 (지도가 로드되고 articles가 있을 때)
    useEffect(() => {
        if (!map || !clusterer || !articles.length || !mapBounds) return;
        
        console.log('Rendering markers for', articles.length, 'articles');
        
        // 기존 마커 모두 제거
        clusterer.clear();
        
        // 현재 지도 영역에 보이는 매물만 필터링
        const visibleArticles = filterVisibleArticles(articles);
        console.log('Visible articles:', visibleArticles.length, '/', articles.length);
        
        // 마커와 인포윈도우 생성
        const markers: any[] = [];
        const markerInfoMap = new Map();
        
        visibleArticles.forEach(article => {
            if (!article.latitude || !article.longitude) return;
            
            const lat = typeof article.latitude === 'number' ? article.latitude : parseFloat(article.latitude);
            const lng = typeof article.longitude === 'number' ? article.longitude : parseFloat(article.longitude);
            
            if (isNaN(lat) || isNaN(lng)) return;
            
            const position = new (window as any).kakao.maps.LatLng(lat, lng);
            
            try {
                // 마커 아이콘 생성 (SVG로 생성하고 Base64 인코딩)
                const svgString = getMarkerSvg(article);
                // URI malformed 에러 방지를 위한 안전한 인코딩
                const encodedSvg = encodeURIComponent(svgString.replace(/\n\s*/g, ''));
                const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodedSvg;
                
                const marker = new (window as any).kakao.maps.Marker({
                    position: position,
                    image: new (window as any).kakao.maps.MarkerImage(
                        svgUrl,
                        new (window as any).kakao.maps.Size(50, 50),
                        { offset: new (window as any).kakao.maps.Point(25, 25) }
                    ),
                    clickable: true,
                    title: article.articleName
                });
                
                // 마커 정보 저장 (추후 이벤트에서 사용)
                markerInfoMap.set(marker, article);
                
                // 마커 클릭 이벤트 추가
                (window as any).kakao.maps.event.addListener(marker, 'click', () => {
                    onArticleClick(article);
                });
                
                // 마커 마우스오버 이벤트 추가
                (window as any).kakao.maps.event.addListener(marker, 'mouseover', () => {
                    setHoveredArticle(article);
                    setPopoverArticle(article);
                });
                
                // 마커 마우스아웃 이벤트 추가
                (window as any).kakao.maps.event.addListener(marker, 'mouseout', () => {
                    setHoveredArticle(null);
                    setPopoverArticle(null);
                });
                
                markers.push(marker);
            } catch (error) {
                console.error('Error creating marker for article:', article.id, error);
            }
        });
        
        // 생성한 마커를 클러스터러에 추가
        clusterer.addMarkers(markers);
        
        // 지도 범위 조정 (마커가 모두 보이게) - 초기 로드 또는 필터 변경 시에만 적용
        if (markers.length > 0 && !fixedInitialView) {
            const bounds = new (window as any).kakao.maps.LatLngBounds();
            markers.forEach(marker => {
                bounds.extend(marker.getPosition());
            });
            map.setBounds(bounds);
        }
        
        return () => {
            // 이벤트 리스너 제거 및 마커 정보 맵 초기화
            markers.forEach(marker => {
                (window as any).kakao.maps.event.removeListener(marker, 'click');
                (window as any).kakao.maps.event.removeListener(marker, 'mouseover');
                (window as any).kakao.maps.event.removeListener(marker, 'mouseout');
            });
            markerInfoMap.clear();
        };
    }, [map, clusterer, articles, onArticleClick, getMarkerSvg, fixedInitialView, mapBounds, filterVisibleArticles, selectedArticle]);

    return (
        <>
            {mapErrorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {mapErrorMessage}
                </Alert>
            )}
            <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
                <Popover
                    open={Boolean(hoveredArticle) && Boolean(anchorPosition)}
                    anchorReference="anchorPosition"
                    anchorPosition={anchorPosition || { top: 0, left: 0 }}
                    onClose={() => {
                        setHoveredArticle(null);
                        setAnchorPosition(null);
                    }}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    sx={{ 
                        pointerEvents: 'none',
                        zIndex: 9999,
                        '& .MuiPaper-root': {
                            maxWidth: 'none',
                            opacity: 0.8
                        }
                    }}
                    disableRestoreFocus
                >
                    {hoveredArticle && (
                        <MarkerPopup article={hoveredArticle} />
                    )}
                </Popover>
            </Box>
        </>
    );
};

export default MapView; 
