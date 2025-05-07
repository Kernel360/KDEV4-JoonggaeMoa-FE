import { Alert, Box, Button, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import type { ArticleResponse, ClusterInfo, RealEstateType } from '../types/article';
import { createArticleMarkerSvg } from '../utils/articleDisplay';
import { validateCoordinates, createCoordinates } from "../utils/articleFormat";
import SameLocationArticleList from './SameLocationArticleList';
import { YEOKSAM_CENTER, MAP_ZOOM_LEVELS, PROPERTY_TYPE_STYLES, HEATMAP_COLORS } from '../utils/mapUtils';
import type { Region } from '../utils/regionUtils';
import { regionApi } from '../services/regionApi';

declare global {
    interface Window {
        _customMarkers: any[];
    }
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
    onViewChange?: (center: {lat: number, lng: number}, zoom: number) => void;
    onBoundsChanged?: (bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }, zoom: number) => void;
    /**
     * 클러스터 모드 여부 (true면 클러스터만 표시)
     */
    clusterMode?: boolean;
    /**
     * 클러스터 데이터
     */
    clusters?: (ClusterInfo & {
        weight?: number;
        radius?: number;
        color?: string;
    })[];
    onClusterClick?: (cluster: ClusterInfo) => void;
    mapRef?: React.MutableRefObject<any>;
    /**
     * 리스트 숨김 상태
     */
    isListHidden?: boolean;
}

// debounce 함수 구현
const debounce = <F extends (...args: any[]) => any>(
    func: F,
    wait: number
): ((...args: Parameters<F>) => void) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    return function(...args: Parameters<F>) {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
};

// 유형에 맞는 스타일 가져오기 (없으면 기본값 반환)
const getPropertyTypeStyle = (type?: string) => {
    if (!type || !(type in PROPERTY_TYPE_STYLES)) {
        return PROPERTY_TYPE_STYLES.default;
    }
    return PROPERTY_TYPE_STYLES[type as keyof typeof PROPERTY_TYPE_STYLES];
};

// 매물 수에 따른 히트맵 색상 가져오기
const getHeatmapColorByCount = (count: number): string => {
    if (count <= 10) return HEATMAP_COLORS[0];
    else if (count <= 20) return HEATMAP_COLORS[1];
    else if (count <= 30) return HEATMAP_COLORS[2];
    else if (count <= 40) return HEATMAP_COLORS[3];
    else if (count <= 50) return HEATMAP_COLORS[4];
    else if (count <= 60) return HEATMAP_COLORS[5];
    else if (count <= 70) return HEATMAP_COLORS[6];
    else if (count <= 80) return HEATMAP_COLORS[7];
    else if (count <= 90) return HEATMAP_COLORS[8];
    else return HEATMAP_COLORS[9]; // 90개 초과
};

// 매물 수에 따른 채도(opacity) 가져오기
const getOpacityByCount = (count: number): number => {
    if (count <= 10) return 0.4;
    else if (count <= 20) return 0.45;
    else if (count <= 30) return 0.5;
    else if (count <= 40) return 0.55;
    else if (count <= 50) return 0.6;
    else if (count <= 60) return 0.65;
    else if (count <= 70) return 0.7;
    else if (count <= 80) return 0.75;
    else if (count <= 90) return 0.8;
    else return 0.85; // 90개 초과
};

const MapView = ({
    articles,
    selectedArticle,
    onArticleClick,
    selectedRegions,
    allRegions,
    initialCenter,
    initialZoom,
    onViewChange,
    onBoundsChanged,
    clusterMode,
    clusters,
    onClusterClick,
    mapRef,
    isListHidden
}: MapViewProps) => {
    const mapRefInternal = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
    const [mapErrorMessage, setMapErrorMessage] = useState<string | null>(null);
    const [mapBounds, setMapBounds] = useState<any>(null);
    const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(initialZoom || MAP_ZOOM_LEVELS.DEFAULT);
    const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY;
    
    // 동일 좌표 매물 그룹 관련 상태
    const [sameLocationArticles, setSameLocationArticles] = useState<ArticleResponse[]>([]);
    const [sameLocationPopupOpen, setSameLocationPopupOpen] = useState<boolean>(false);
    const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
    const [isLocating, setIsLocating] = useState<boolean>(false);
    const [myLocationMarker, setMyLocationMarker] = useState<any>(null);
    
    // 행정구역 경계 관련 상태
    const [dongBoundaries, setDongBoundaries] = useState<any>(null);
    const [guBoundaries, setGuBoundaries] = useState<any>(null);
    const polygonsRef = useRef<any[]>([]);
    const labelsRef = useRef<any[]>([]);
    const colorMapRef = useRef<Map<string, string>>(new Map());
    
    // 카카오맵 스크립트 로드
    useEffect(() => {
        if (!KAKAO_APP_KEY) {
            console.error('Kakao API key is not defined');
            setMapErrorMessage("Kakao API 키가 설정되지 않았습니다");
            return;
        }

        const kakaoMapScript = document.getElementById('kakao-map-script');
        
        // 스크립트가 이미 로드되었고 API가 사용 가능한 경우
        if (
            kakaoMapScript && 
            (window as any).kakao && 
            (window as any).kakao.maps
        ) {
            setIsScriptLoaded(true);
            return;
        }
        
        // 이전 스크립트 제거
        if (kakaoMapScript) {
            kakaoMapScript.remove();
        }

        // 새 스크립트 요소 생성
        const script = document.createElement('script');
        script.id = 'kakao-map-script';
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services,clusterer,drawing&autoload=false`;
        script.async = true;
        
        // 스크립트 로드 성공
        script.onload = () => {
            (window as any).kakao.maps.load(() => {
                setIsScriptLoaded(true);
            });
        };

        // 스크립트 로드 실패
        script.onerror = () => {
            console.error("Failed to load Kakao Maps script");
            setMapErrorMessage("Kakao 맵 스크립트 로드에 실패했습니다");
        };

        document.head.appendChild(script);

        // 클린업 함수
        return () => {};
    }, [KAKAO_APP_KEY]);

    // 맵 초기화
    useEffect(() => {
        if (!isScriptLoaded || !mapRefInternal.current) return;

        try {
            // 이미 지도 인스턴스가 존재하는지 확인
            if (mapInstance.current) {
                // 지도가 존재하면 초기 세팅이 완료된 상태로 표시
                setIsMapLoaded(true);
                
                // 외부 참조도 업데이트
                if (mapRef) {
                    mapRef.current = mapInstance.current;
                }
                return;
            }

            // 새 지도 인스턴스 생성 (처음 마운트될 때만)
            const container = mapRefInternal.current;
            const options = {
                center: new (window as any).kakao.maps.LatLng(
                    initialCenter?.lat || YEOKSAM_CENTER.lat,
                    initialCenter?.lng || YEOKSAM_CENTER.lng
                ),
                level: initialZoom || MAP_ZOOM_LEVELS.DEFAULT,
                mapTypeControl: false,
                zoomControl: false,
                scaleControl: false  // 스케일 컨트롤 비활성화
            };
            
            const kakaoMap = new (window as any).kakao.maps.Map(container, options);
            
            // 스케일 컨트롤 비활성화 (줌 레벨 표시 제거)
            if ((window as any).kakao.maps.ScaleControl) {
                const scaleControl = kakaoMap.getScaleControl();
                if (scaleControl) {
                    scaleControl.setMap(null);
                }
            }
            
            // 맵 인스턴스 저장 - 내부 및 외부 참조 모두 업데이트
            mapInstance.current = kakaoMap;
            if (mapRef) {
                mapRef.current = kakaoMap;
            }

            // 지도 이동 이벤트
            const handleMapIdle = debounce(() => {
                try {
                    const bounds = kakaoMap.getBounds();
                    setMapBounds(bounds);
                    
                    const center = kakaoMap.getCenter();
                    const level = kakaoMap.getLevel();
                    setCurrentZoomLevel(level);
                    
                    if (onViewChange) {
                        onViewChange({
                            lat: center.getLat(),
                            lng: center.getLng()
                        }, level);
                    }
                    
                    if (onBoundsChanged) {
                        const ne = bounds.getNorthEast();
                        const sw = bounds.getSouthWest();
                        
                        onBoundsChanged({
                            ne: {
                                lat: ne.getLat(),
                                lng: ne.getLng()
                            },
                            sw: {
                                lat: sw.getLat(),
                                lng: sw.getLng()
                            }
                        }, level);
                    }
                } catch (error) {
                    console.error("Error in handleMapIdle:", error);
                }
            }, 300);

            (window as any).kakao.maps.event.addListener(kakaoMap, 'idle', handleMapIdle);
            
            // 초기 줌 레벨 설정
            setCurrentZoomLevel(kakaoMap.getLevel());
            setIsMapLoaded(true);

            return () => {
                try {
                    const kakao = (window as any).kakao;
                    if (kakao && kakao.maps && kakao.maps.event && kakaoMap) {
                        kakao.maps.event.removeListener(kakaoMap, 'idle', handleMapIdle);
                    }
                } catch (error) {
                    console.error('idle 이벤트 리스너 제거 중 오류:', error);
                }
            };
        } catch (error) {
            console.error('Error initializing map:', error);
            setMapErrorMessage("지도 초기화에 실패했습니다.");
        }
    }, [isScriptLoaded]);
    
    // initialCenter가 변경될 때 한 번만 실행되는 효과
    const initialCenterRef = useRef(initialCenter);
    useEffect(() => {
        // 첫 렌더링 이후에는 initialCenter 무시
        if (!isMapLoaded || !initialCenter) return;
        
        // 매우 처음 한 번만 실행
        if (!initialCenterRef.current) {
            initialCenterRef.current = initialCenter;
            
            if (mapInstance.current) {
                try {
                    const position = new (window as any).kakao.maps.LatLng(
                        initialCenter.lat,
                        initialCenter.lng
                    );
                    mapInstance.current.setCenter(position);
                } catch (error) {
                    console.error('Error setting initial center:', error);
                }
            }
        }
    }, [isMapLoaded, initialCenter]);

    // 초기 줌 레벨 설정
    const initialZoomRef = useRef(initialZoom);
    useEffect(() => {
        // 지도가 로드된 후에만 실행
        if (!isMapLoaded || !mapInstance.current) return;
        
        // initialZoom이 변경되었고, 사용자 상호작용이 아닌 경우에만 줌 레벨 업데이트
        if (initialZoom !== undefined && initialZoom !== currentZoomLevel) {
            // 클러스터나 매물 선택으로 인한 변경일 때만 실행
            if (initialZoom !== initialZoomRef.current) {
                initialZoomRef.current = initialZoom;
                
                try {
                    mapInstance.current.setLevel(initialZoom);
                    setCurrentZoomLevel(initialZoom);
                } catch (error) {
                    console.error('Error setting zoom level:', error);
                }
            }
        }
    }, [isMapLoaded, initialZoom, currentZoomLevel]);

    // 클러스터 마커 클릭 이벤트 처리 함수
    const handleClusterClick = (cluster: ClusterInfo) => {
        if (onClusterClick) {
            onClusterClick(cluster);
        }
        if (mapInstance.current) {
            const kakao = (window as any).kakao;
            if (kakao && kakao.maps) {
                const position = new kakao.maps.LatLng(cluster.lat, cluster.lng);
                mapInstance.current.setCenter(position);
                mapInstance.current.setLevel(3); // Or an appropriate zoom level
            }
        }
    };

    // 매물 마커 생성 및 업데이트
    useEffect(() => {
        if (!isMapLoaded || !mapInstance.current) {
            return;
        }

        const map = mapInstance.current;
        
        // 전역 매커 배열 초기화 (없는 경우)
        if (!window._customMarkers) {
            window._customMarkers = [];
        }
        
        // 기존 마커 제거 함수
        const clearMarkers = () => {
            if (window._customMarkers) {
                window._customMarkers.forEach(marker => {
                    if (marker && marker.setMap) {
                        marker.setMap(null);
                    }
                });
                window._customMarkers = [];
            }
        };
        
        // 기존 마커 제거
        clearMarkers();

        // 클러스터 모드가 활성화되고 클러스터 데이터가 있으면 클러스터 표시
        if (clusterMode && clusters && clusters.length > 0) {
            try {
                // 클러스터끼리의 거리 계산 함수
                const calculateDistance = (c1: ClusterInfo, c2: ClusterInfo) => {
                    const R = 6371; // 지구 반경 (km)
                    const dLat = (c2.lat - c1.lat) * Math.PI / 180;
                    const dLon = (c2.lng - c1.lng) * Math.PI / 180;
                    const a =
                        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    const distance = R * c;
                    return distance * 1000; // 미터 단위로 변환
                };
                    
                // 작은 클러스터 (count ≤ 5)만 필터링
                const smallClusters = clusters.filter(c => c.count <= 5);
                const largeClusters = clusters.filter(c => c.count > 5);
                    
                // 가까운 작은 클러스터들을 묶기 위한 처리
                const mergeRadius = 1000; // 1km 이내의 작은 클러스터들을 병합
                const processedIndices = new Set<number>();
                const mergedClusters: ClusterInfo[] = [];
                    
                // 작은 클러스터끼리 병합
                for (let i = 0; i < smallClusters.length; i++) {
                    if (processedIndices.has(i)) continue;
                    
                    const baseCluster = smallClusters[i];
                    const nearbyIndices: number[] = [];
                    
                    // 주변 클러스터 찾기
                    for (let j = 0; j < smallClusters.length; j++) {
                        if (i === j || processedIndices.has(j)) continue;
                        
                        const otherCluster = smallClusters[j];
                        const distance = calculateDistance(baseCluster, otherCluster);
                        
                        // 특정 거리 이내의 클러스터 병합
                        if (distance <= mergeRadius) {
                            nearbyIndices.push(j);
                        }
                    }
                    
                    // 병합할 클러스터가 있는 경우
                    if (nearbyIndices.length > 0) {
                        // 기준 클러스터 포함
                        let totalCount = baseCluster.count;
                        let weightedLat = baseCluster.lat * baseCluster.count;
                        let weightedLng = baseCluster.lng * baseCluster.count;
                        
                        // 유형 분포 병합
                        const typeDistribution: Record<string, number> = { ...(baseCluster.typeDistribution || {}) };
                        let maxType = baseCluster.mainRealEstateType || 'default';
                        let maxCount = typeDistribution[maxType] || 0;
                        
                        // 주변 클러스터 병합
                        nearbyIndices.forEach(idx => {
                            const nearbyCluster = smallClusters[idx];
                            totalCount += nearbyCluster.count;
                            weightedLat += nearbyCluster.lat * nearbyCluster.count;
                            weightedLng += nearbyCluster.lng * nearbyCluster.count;
                            
                            // 유형 분포 병합
                            if (nearbyCluster.typeDistribution) {
                                Object.entries(nearbyCluster.typeDistribution).forEach(([type, count]) => {
                                    typeDistribution[type] = (typeDistribution[type] || 0) + count;
                                    
                                    // 가장 많은 유형 업데이트
                                    if (typeDistribution[type] > maxCount) {
                                        maxType = type;
                                        maxCount = typeDistribution[type];
                                    }
                                });
                            }
                            
                            processedIndices.add(idx);
                        });
                        
                        // 가중 평균으로 중심 좌표 계산
                        const mergedCluster: ClusterInfo = {
                            lat: weightedLat / totalCount,
                            lng: weightedLng / totalCount,
                            count: totalCount,
                            isMerged: true,
                            mainRealEstateType: maxType as RealEstateType,
                            typeDistribution: typeDistribution,
                            color: getPropertyTypeStyle(maxType).color,
                            // 병합된 클러스터 크기 결정 (매물 수에 따라)
                            radius: calculateRadiusByCount(totalCount)
                        };
                        
                        mergedClusters.push(mergedCluster);
                        processedIndices.add(i);
                    } else {
                        // 병합되지 않은 작은 클러스터
                        if (!processedIndices.has(i)) {
                            mergedClusters.push({
                                ...baseCluster,
                                radius: calculateRadiusByCount(baseCluster.count) // 매물 수에 따라 반경 결정
                            });
                            processedIndices.add(i);
                        }
                    }
                }
                    
                // 최종 클러스터 = 큰 클러스터들 + 병합된 작은 클러스터들
                const initialProcessedClusters = [...largeClusters, ...mergedClusters];
         
                // 클러스터 겹침 방지 알고리즘
                const MIN_CLUSTER_DISTANCE = 50; // 픽셀 단위, 클러스터간 최소 거리
                
                // 현재 줌 레벨 가져오기
                const currentZoomLevel = map.getLevel();
                
                // 줌 레벨에 따른 클러스터 필터링
                let processedClusters;
                if (currentZoomLevel <= 6) { // 카카오맵에서는 작은 값이 더 확대된 상태
                    processedClusters = initialProcessedClusters;
                } else {
                    // 줌 레벨 6 초과에서는 카운트 50 이하 클러스터 제외
                    processedClusters = initialProcessedClusters.filter(cluster => cluster.count > 50);
                    console.log(`줌 레벨 ${currentZoomLevel}에서 클러스터 필터링: ${initialProcessedClusters.length}개 -> ${processedClusters.length}개`);
                }
                
                try {
                    // 픽셀 거리 계산 함수
                    const getPixelDistance = (c1: ClusterInfo, c2: ClusterInfo) => {
                        if (!map) return 0;
                        try {
                            const p1 = map.getProjection().pointFromCoords(new (window as any).kakao.maps.LatLng(c1.lat, c1.lng));
                            const p2 = map.getProjection().pointFromCoords(new (window as any).kakao.maps.LatLng(c2.lat, c2.lng));
                            return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
                        } catch (err) {
                            console.error("Error calculating pixel distance:", err);
                            return Infinity; // 오류 발생 시 무한대 거리 반환하여 겹침 방지 로직 비활성화
                        }
                    };

                    // 겹침 감지 및 클러스터 위치 조정 함수
                    const adjustClusterPositions = (clusters: ClusterInfo[]): ClusterInfo[] => {
                        // 카카오맵 투영 객체가 없으면 조정 불가
                        if (!map || !map.getProjection) return clusters;
                        
                        const adjustedClusters = [...clusters];
                        
                        // 카운트 기준으로 클러스터 정렬 (큰 클러스터가 먼저 배치됨)
                        adjustedClusters.sort((a, b) => b.count - a.count);
                        
                        // 각 클러스터에 대해 겹침 검사
                        for (let i = 0; i < adjustedClusters.length; i++) {
                            const cluster = adjustedClusters[i];
                            
                            // 다른 모든 클러스터와 비교
                            for (let j = 0; j < i; j++) {
                                const otherCluster = adjustedClusters[j];
                                
                                try {
                                    const distance = getPixelDistance(cluster, otherCluster);
                                    
                                    // 겹침 발생 시 위치 조정
                                    if (distance < MIN_CLUSTER_DISTANCE) {
                                        // 이동 방향 계산 (현재 클러스터에서 다른 클러스터 방향으로)
                                        const angle = Math.atan2(
                                            otherCluster.lat - cluster.lat, 
                                            otherCluster.lng - cluster.lng
                                        );
                                        
                                        // 이동할 거리 계산
                                        const moveDistance = (MIN_CLUSTER_DISTANCE - distance) / 2;
                                        
                                        // Kakao Maps API에서는 getScale이 지원되지 않으므로 
                                        // 직접 좌표 이동 계산
                                        // 현재 줌 레벨에 따른 적절한 이동 거리 계수 조정
                                        const zoomLevel = map.getLevel();
                                        const moveFactorByZoom = 0.00001 * Math.pow(2, (14 - zoomLevel));
                                        
                                        // 클러스터 위치 조정 (반대 방향으로 이동)
                                        const moveLatLng = (latLng: {lat: number, lng: number}, angle: number, distance: number) => {
                                            // 반대 방향으로 이동 (180도 회전)
                                            const moveAngle = angle + Math.PI;
                                            
                                            // 이동 후 좌표 계산
                                            return {
                                                lat: latLng.lat + Math.sin(moveAngle) * distance * moveFactorByZoom,
                                                lng: latLng.lng + Math.cos(moveAngle) * distance * moveFactorByZoom
                                            };
                                        };
                                        
                                        // 작은 클러스터 이동
                                        const newPosition = moveLatLng(cluster, angle, moveDistance);
                                        adjustedClusters[i] = {
                                            ...cluster,
                                            lat: newPosition.lat,
                                            lng: newPosition.lng
                                        };
                                    }
                                } catch (err) {
                                    console.error("Error adjusting cluster position:", err);
                                    // 오류 발생 시 원래 위치 유지
                                    continue;
                                }
                            }
                        }
                        
                        return adjustedClusters;
                    };

                    // 클러스터 위치 조정 시도
                    processedClusters = adjustClusterPositions(processedClusters);
                } catch (err) {
                    console.error("Failed to adjust cluster positions, using original clusters:", err);
                    // 오류 발생 시 원본 클러스터 사용
                    processedClusters = initialProcessedClusters;
                }
                    
                // 클러스터 마커 생성
                processedClusters.forEach(cluster => {
                    try {
                        // HTML 요소로 클러스터 마커 생성
                        const element = document.createElement('div');
                        
                        // 히트맵 색상 사용
                        const color = getHeatmapColorByCount(cluster.count);
                        
                        // 클러스터 크기 결정 - 10단위로 크기 구분
                        let radius: number;
                        let opacity: number;
                        
                        if (cluster.radius) {
                            // 이미 지정된 반경이 있으면 그대로 사용
                            radius = cluster.radius;
                            opacity = getOpacityByCount(cluster.count);
                        } else {
                            // 매물 수에 따라 반경 결정 (10단위로 크기 증가)
                            const count = cluster.count;
                            
                            if (count <= 10) radius = 40;
                            else if (count <= 20) radius = 45;
                            else if (count <= 30) radius = 50;
                            else if (count <= 40) radius = 55;
                            else if (count <= 50) radius = 60;
                            else if (count <= 60) radius = 65;
                            else if (count <= 70) radius = 70;
                            else if (count <= 80) radius = 75;
                            else if (count <= 90) radius = 80;
                            else if (count <= 100) radius = 85;
                            else radius = 90; // 100개 초과
                            
                            // 매물 수에 따라 투명도 조정
                            opacity = getOpacityByCount(cluster.count);
                        }
                        
                        // 글자 크기 조정
                        const fontSize = Math.max(radius * 0.35, 14); // 최소 글자 크기 보장
                        
                        // 클러스터 마커 스타일 (SVG)
                        const markerHtml = `
                            <div 
                                style="
                                    position: absolute;
                                    cursor: pointer;
                                    width: ${radius}px;
                                    height: ${radius}px;
                                    transform: translate(-50%, -50%);
                                "
                            >
                                <svg width="${radius}" height="${radius}" viewBox="0 0 100 100">
                                    <circle 
                                        cx="50" 
                                        cy="50" 
                                        r="45" 
                                        fill="${color}" 
                                        opacity="${opacity}"
                                        stroke="#ffffff"
                                        stroke-width="4"
                                    />
                                    <text 
                                        x="50" 
                                        y="55" 
                                        text-anchor="middle" 
                                        font-size="${fontSize}px" 
                                        font-weight="bold"
                                        fill="white"
                                    >${cluster.count}</text>
                                </svg>
                        </div>
                    `;
                        element.innerHTML = markerHtml;
                        
                        // 클릭 이벤트 추가
                        element.firstElementChild?.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleClusterClick(cluster);
                        });
                        
                        // 클러스터 커스텀 마커 생성
                        const marker = new (window as any).kakao.maps.CustomOverlay({
                            position: new (window as any).kakao.maps.LatLng(cluster.lat, cluster.lng),
                            content: element,
                            zIndex: 2,
                            map: map
                        });

                        window._customMarkers.push(marker);
                    } catch (error) {
                        console.error("Error creating cluster marker:", error);
                    }
                });
            } catch (error) {
                console.error("Error processing clusters:", error);
            }
        } 
        // 클러스터 모드가 비활성화되고 매물 데이터가 있으면 매물 핀 표시
        else if (articles?.length > 0) {
            // 개별 매물 표시 모드
            // 유효한 좌표가 있는 매물만 필터링
            const beforeFilterCount = articles.length;
            const validArticles = articles.filter(article => {
                const isValid = validateCoordinates(article.latitude, article.longitude);
                if (!isValid) {
                    console.warn(`Invalid coordinates for article ${article.id}: lat=${article.latitude}, lng=${article.longitude}`);
                }
                return isValid;
            });
            
            if (validArticles.length === 0) {
                console.error("No valid articles to display on map!");
                return;
            }
            
            // 동일한 좌표에 있는 매물들을 그룹화
            const locationGroups: Record<string, ArticleResponse[]> = {};
            
            validArticles.forEach(article => {
                const locationKey = `${article.latitude},${article.longitude}`;
                if (!locationGroups[locationKey]) {
                    locationGroups[locationKey] = [];
                }
                locationGroups[locationKey].push(article);
            });
            
            // 각 위치 그룹별로 마커 생성
            Object.entries(locationGroups).forEach(([locationKey, articleGroup]) => {
                try {
                    const [latStr, lngStr] = locationKey.split(',');
                    const lat = parseFloat(latStr);
                    const lng = parseFloat(lngStr);
                    
                    // 좌표가 유효하지 않은 경우 건너뛰기
                    if (isNaN(lat) || isNaN(lng)) {
                        console.error(`Invalid location key: ${locationKey}`);
                        return;
                    }
                    
                    // 그룹 내 첫 번째 매물의 유형으로 마커 생성
                    const representativeArticle = articleGroup[0];
                    const isSelectedLocation = selectedArticle && 
                        selectedArticle.latitude === lat && 
                        selectedArticle.longitude === lng;
                    
                    // 마커 DOM 엘리먼트 생성
                    const element = document.createElement('div');
                    
                    element.innerHTML = `
                        <div 
                            style="
                                position: absolute;
                                width: 40px;
                                height: 40px;
                                transform: translate(-50%, -50%);
                                cursor: pointer;
                                z-index: ${isSelectedLocation ? 5 : 1};
                            "
                        >
                            ${createArticleMarkerSvg(
                                representativeArticle.buildingType, 
                                isSelectedLocation,
                                undefined,
                                undefined,
                                articleGroup.length // 그룹 내 매물 수를 전달
                            )}
                        </div>
                    `;

                    // 클릭 이벤트 추가
                    element.firstElementChild?.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // 동일 위치에 매물이 여러 개인 경우
                        if (articleGroup.length > 1) {
                            console.log(`${articleGroup.length}개의 동일 위치 매물 그룹 클릭됨`);
                            // 동일 위치 매물 목록 표시
                            setSameLocationArticles(articleGroup);
                            setCurrentLocation({ lat, lng });
                            setSameLocationPopupOpen(true);
                        } else {
                            // 단일 매물인 경우 바로 선택
                            console.log("Article clicked:", representativeArticle.id);
                            onArticleClick(representativeArticle);
                        }
                    });

                    // kakao LatLng 객체 생성
                    let position;
                    try {
                        position = new (window as any).kakao.maps.LatLng(lat, lng);
                    } catch (err) {
                        console.error(`Failed to create LatLng for location ${locationKey}: ${err}`);
                        return;
                    }

                    // 마커 생성
                    try {
                        const marker = new (window as any).kakao.maps.CustomOverlay({
                            position: position,
                            content: element,
                            map: map,
                            zIndex: isSelectedLocation ? 5 : 1
                        });

                        window._customMarkers.push(marker);
                    } catch (err) {
                        console.error(`Failed to create marker for location ${locationKey}: ${err}`);
                    }
                } catch (err) {
                    console.error("Error creating location group marker:", err);
                }
            });

            // 마커 표시 결과 확인
            if (window._customMarkers.length === 0) {
                console.error("Failed to create any markers even though validArticles were found");
            }
        } else {
            console.log(`마커 표시 모드: ${clusterMode ? '클러스터' : '매물 핀'}, 데이터 개수: ${clusterMode ? (clusters?.length || 0) : (articles?.length || 0)}`);
        }
        
        return clearMarkers;
    }, [isMapLoaded, articles, selectedArticle, clusterMode, clusters, onArticleClick, onClusterClick]);

    // 선택된 매물로 이동
    useEffect(() => {
        if (!isMapLoaded || !mapInstance.current || !selectedArticle) return;

        try {
            const map = mapInstance.current;
            if (selectedArticle.latitude && selectedArticle.longitude) {
                const position = new (window as any).kakao.maps.LatLng(
                    selectedArticle.latitude,
                    selectedArticle.longitude
                );
                
                // 먼저 중심점 변경
                map.setCenter(position);
                
                // 그 다음 줌 레벨 설정 (현재 레벨이 이미 충분히 가까우면 변경하지 않음)
                const currentLevel = map.getLevel();
                if (currentLevel > 3) {
                    map.setLevel(3);
                    setCurrentZoomLevel(3);
                }
            }
        } catch (error) {
            console.error("Failed to move to selected article:", error);
        }
    }, [isMapLoaded, selectedArticle]);

    // 선택된 지역으로 이동
    useEffect(() => {
        if (!isMapLoaded || !mapInstance.current || !selectedRegions || !allRegions) return;

        try {
            const map = mapInstance.current;
            const targetRegion = allRegions.find(region => {
                if (selectedRegions.neighborhoods.length > 0) {
                    return region.cortarName === selectedRegions.neighborhoods[0];
                }
                if (selectedRegions.district) {
                    return region.cortarName === selectedRegions.district;
                }
                return region.cortarName === selectedRegions.city;
            });

            if (targetRegion) {
                const position = new (window as any).kakao.maps.LatLng(
                    targetRegion.centerLat,
                    targetRegion.centerLon
                );
                
                // 중심점 이동
                map.setCenter(position);

                // 지역에 따른 적절한 줌 레벨 설정
                const zoomLevel = selectedRegions.neighborhoods.length > 0 ? 3 
                    : selectedRegions.district ? 5 
                    : 8;
                
                // 현재 줌 레벨과 목표 줌 레벨이 다른 경우에만 변경
                const currentLevel = map.getLevel();
                if (currentLevel !== zoomLevel) {
                    map.setLevel(zoomLevel);
                    setCurrentZoomLevel(zoomLevel);
                }
            }
        } catch (error) {
            console.error("Failed to move to selected region:", error);
        }
    }, [isMapLoaded, selectedRegions, allRegions]);

    // 매물 수에 따른 반경 계산 함수
    const calculateRadiusByCount = (count: number): number => {
        // 10단위로 크기 증가
        if (count <= 10) return 40;
        else if (count <= 20) return 45;
        else if (count <= 30) return 50;
        else if (count <= 40) return 55;
        else if (count <= 50) return 60;
        else if (count <= 60) return 65;
        else if (count <= 70) return 70;
        else if (count <= 80) return 75;
        else if (count <= 90) return 80;
        else if (count <= 100) return 85;
        else return 90; // 100개 초과
    };

    // 확대/축소 버튼 클릭 핸들러
    const handleZoomIn = () => {
        if (!mapInstance.current) return;
        const currentLevel = mapInstance.current.getLevel();
        if (currentLevel > 1) { // 최소 줌 레벨은 1
            mapInstance.current.setLevel(currentLevel - 1);
            setCurrentZoomLevel(currentLevel - 1);
        }
    };

    const handleZoomOut = () => {
        if (!mapInstance.current) return;
        const currentLevel = mapInstance.current.getLevel();
        if (currentLevel < 14) { // 최대 줌 레벨은 14
            mapInstance.current.setLevel(currentLevel + 1);
            setCurrentZoomLevel(currentLevel + 1);
        }
    };

    // 클러스터 모드와 매물 마커 간 전환 즉시 반영을 위한 useEffect
    useEffect(() => {
        if (!isMapLoaded || !mapInstance.current) return;
        
        // clusterMode 변경 감지 즉시 실행
        console.log(`마커 모드 변경: ${clusterMode ? '클러스터' : '매물 핀'} 모드로 전환`);
        
        // 기존 마커 즉시 제거
        if (window._customMarkers) {
            window._customMarkers.forEach(marker => {
                if (marker && marker.setMap) {
                    marker.setMap(null);
                }
            });
            window._customMarkers = [];
        }
        
        // 새 모드에 맞는 마커 즉시 생성 (다음 렌더링에서 실행)
    }, [isMapLoaded, clusterMode]);

    // 동일 위치 매물 팝업 닫기 핸들러
    const handleCloseLocationPopup = () => {
        setSameLocationPopupOpen(false);
    };

    // 부모 컨테이너에 클래스 추가 효과
    useEffect(() => {
        // 가장 가까운 article-list-container 클래스를 가진 부모 요소 찾기
        const findParentContainer = () => {
            if (!mapRefInternal.current) return null;
            let parent = mapRefInternal.current.parentElement;
            while (parent) {
                if (parent.classList.contains('article-list-container')) {
                    return parent;
                }
                parent = parent.parentElement;
            }
            return null;
        };

        const parentContainer = findParentContainer();
        if (parentContainer) {
            if (sameLocationPopupOpen) {
                parentContainer.classList.add('same-location-open');
            } else {
                parentContainer.classList.remove('same-location-open');
            }
        }

        return () => {
            if (parentContainer) {
                parentContainer.classList.remove('same-location-open');
            }
        };
    }, [sameLocationPopupOpen]);

    // 현재 위치 가져오기 및 지도 이동 함수
    const handleCurrentLocation = () => {
        if (!mapInstance.current || !isMapLoaded) return;
        
        setIsLocating(true);
        
        // 기존 내 위치 마커가 있다면 제거
        if (myLocationMarker) {
            myLocationMarker.setMap(null);
            setMyLocationMarker(null);
        }
        
        // 브라우저의 Geolocation API를 사용하여 현재 위치 가져오기
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    
                    // 카카오맵 LatLng 객체 생성
                    const currentLocation = new (window as any).kakao.maps.LatLng(latitude, longitude);
                    
                    // 지도 중심 이동
                    mapInstance.current.setCenter(currentLocation);
                    
                    // 줌 레벨 조정 (적절한 줌 레벨로 설정, 예: 3)
                    mapInstance.current.setLevel(3);
                    setCurrentZoomLevel(3);
                    
                    // 현재 위치 마커 생성 (애니메이션 효과)
                    const markerContainer = document.createElement('div');
                    
                    // 스타일 직접 설정
                    markerContainer.style.position = 'absolute';
                    markerContainer.style.width = '30px';
                    markerContainer.style.height = '30px';
                    markerContainer.style.margin = '0';
                    markerContainer.style.padding = '0';
                    markerContainer.style.display = 'flex';
                    markerContainer.style.justifyContent = 'center';
                    markerContainer.style.alignItems = 'center';
                    markerContainer.style.zIndex = '10';
                    
                    // 핀과 펄스 효과를 담을 내부 컨테이너
                    const innerContainer = document.createElement('div');
                    innerContainer.style.position = 'relative';
                    innerContainer.style.width = '30px';
                    innerContainer.style.height = '30px';
                    innerContainer.style.display = 'flex';
                    innerContainer.style.justifyContent = 'center';
                    innerContainer.style.alignItems = 'center';
                    
                    // 애니메이션 키프레임 스타일
                    const styleElement = document.createElement('style');
                    styleElement.textContent = `
                        @keyframes drop-marker {
                            0% { transform: translateY(-200px); opacity: 0; }
                            40% { transform: translateY(-10px); opacity: 1; }
                            60% { transform: translateY(0); opacity: 1; }
                            80% { transform: translateY(-5px); opacity: 1; }
                            100% { transform: translateY(0); opacity: 1; }
                        }
                        
                        @keyframes pulse {
                            0% { transform: scale(1); opacity: 0.7; }
                            50% { transform: scale(1.5); opacity: 0.3; }
                            100% { transform: scale(1); opacity: 0.7; }
                        }
                        
                        .marker-animation {
                            animation: drop-marker 0.5s ease-out forwards;
                        }
                        
                        .pulse-circle {
                            position: absolute;
                            width: 100%;
                            height: 100%;
                            border-radius: 50%;
                            background-color: rgba(33, 150, 243, 0.3);
                            animation: pulse 2s infinite;
                            z-index: 9;
                        }
                    `;
                    document.head.appendChild(styleElement);
                    
                    // 펄스 효과 원
                    const pulseCircle = document.createElement('div');
                    pulseCircle.className = 'pulse-circle';
                    
                    // 위치 핀 SVG
                    const pinSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    pinSvg.setAttribute('width', '30');
                    pinSvg.setAttribute('height', '30');
                    pinSvg.setAttribute('viewBox', '0 0 24 24');
                    pinSvg.style.zIndex = '11';
                    pinSvg.style.position = 'relative';
                    
                    const pinPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    pinPath.setAttribute('d', 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z');
                    pinPath.setAttribute('fill', '#2196F3');
                    
                    pinSvg.appendChild(pinPath);
                    
                    // 요소 조립
                    innerContainer.appendChild(pulseCircle);
                    innerContainer.appendChild(pinSvg);
                    innerContainer.className = 'marker-animation';
                    
                    markerContainer.appendChild(innerContainer);
                    
                    // 마커 생성 - 정확히 중앙에 위치하도록 앵커 설정
                    const marker = new (window as any).kakao.maps.CustomOverlay({
                        position: currentLocation,
                        content: markerContainer,
                        map: mapInstance.current,
                        zIndex: 10,
                        xAnchor: 0.5,
                        yAnchor: 0.5
                    });
                    
                    // 마커 저장
                    setMyLocationMarker(marker);
                    
                    setIsLocating(false);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    setIsLocating(false);
                    alert('현재 위치를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            setIsLocating(false);
            alert('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
        }
    };

    // 언마운트 시 마커 제거
    useEffect(() => {
        return () => {
            if (myLocationMarker) {
                myLocationMarker.setMap(null);
            }
        };
    }, [myLocationMarker]);

    // 랜덤 색상 생성 함수 (밝은 색상)
    const getRandomColor = () => {
        const hue = Math.floor(Math.random() * 360);
        return `hsla(${hue}, 70%, 70%, 0.5)`;
    };
    
    // 행정구역 ID로부터 일관된 색상 얻기
    const getColorForRegion = (regionId: string) => {
        if (!colorMapRef.current.has(regionId)) {
            colorMapRef.current.set(regionId, getRandomColor());
        }
        return colorMapRef.current.get(regionId);
    };
    
    // 행정구역 경계 데이터 로드
    useEffect(() => {
        const loadBoundaries = async () => {
            try {
                // 동 경계 로드
                const dongData = await regionApi.getRegionBoundaries('dong');
                setDongBoundaries(dongData);
                
                // 구 경계 로드
                const guData = await regionApi.getRegionBoundaries('gu');
                setGuBoundaries(guData);
            } catch (error) {
                console.error('행정구역 경계 데이터 로드 실패:', error);
            }
        };
        
        loadBoundaries();
    }, []);
    
    // 행정구역 경계 그리기 - 폴리곤과 라벨 생성
    useEffect(() => {
        try {
            if (!isMapLoaded || !mapInstance.current) return;
            if (!dongBoundaries && !guBoundaries) return;
            
            // 이전 폴리곤과 라벨 제거
            polygonsRef.current.forEach(polygon => {
                try {
                    if (polygon && polygon.setMap) {
                        polygon.setMap(null);
                    }
                } catch (e) {
                    console.error('폴리곤 제거 중 오류:', e);
                }
            });
            polygonsRef.current = [];
            
            labelsRef.current.forEach(label => {
                try {
                    if (label && label.setMap) {
                        label.setMap(null);
                    }
                } catch (e) {
                    console.error('라벨 제거 중 오류:', e);
                }
            });
            labelsRef.current = [];
            
            const kakao = (window as any).kakao;
            if (!kakao || !kakao.maps) {
                console.warn('카카오맵 API가 로드되지 않았습니다.');
                return;
            }
            
            // drawBoundaries 함수를 mapInstance에 직접 연결하여 참조 보존
            mapInstance.current._drawBoundaries = function() {
                try {
                    if (!mapInstance.current || !kakao || !kakao.maps) {
                        console.warn('지도 인스턴스나 카카오맵 API가 없어 행정구역을 그릴 수 없습니다.');
                        return;
                    }
                    
                    const zoomLevel = mapInstance.current.getLevel();
                    console.log('현재 줌 레벨:', zoomLevel);
                    
                    // 줌 레벨 6에서는 동 경계, 7 이상에서는 구 경계 표시
                    const boundaries = zoomLevel <= 6 ? dongBoundaries : guBoundaries;
                    console.log('사용 중인 행정구역 데이터:', zoomLevel <= 6 ? '동 경계' : '구 경계');
                    
                    if (!boundaries) {
                        console.warn('행정구역 데이터가 없습니다.');
                        return;
                    }
                    
                    // 이전 폴리곤과 라벨 제거
                    polygonsRef.current.forEach(polygon => {
                        try {
                            if (polygon && polygon.setMap) {
                                polygon.setMap(null);
                            }
                        } catch (e) {
                            console.error('폴리곤 제거 중 오류:', e);
                        }
                    });
                    polygonsRef.current = [];
                    
                    labelsRef.current.forEach(label => {
                        try {
                            if (label && label.setMap) {
                                label.setMap(null);
                            }
                        } catch (e) {
                            console.error('라벨 제거 중 오류:', e);
                        }
                    });
                    labelsRef.current = [];
                    
                    const features = boundaries.features || [];
                    
                    features.forEach((feature: any) => {
                        try {
                            // 행정구역 속성 정보
                            const properties = feature.properties || {};
                            const regionId = properties.id || properties.SIG_CD || properties.EMD_CD || 
                                           properties.adm_cd || properties.code || Math.random().toString(36);
                            const regionName = properties.name || properties.SIG_KOR_NM || properties.EMD_KOR_NM || 
                                           properties.adm_nm || properties.org || "unnamed";
                            
                            // 행정구역 색상 - 고유 ID 기반으로 일관된 색상 적용
                            const fillColor = getColorForRegion(regionId);
                            
                            // 중심 좌표 계산을 위한 변수
                            let centerLat = 0;
                            let centerLng = 0;
                            let pointCount = 0;
                            
                            // 폴리곤 경로
                            let paths: any[] = [];
                            
                            if (feature.geometry.type === 'MultiPolygon') {
                                feature.geometry.coordinates.forEach((coordsArray: any) => {
                                    coordsArray.forEach((coords: any) => {
                                        const path = coords.map((coord: [number, number]) => {
                                            // 중심 좌표 계산을 위해 모든 좌표 합산
                                            centerLng += coord[0];
                                            centerLat += coord[1];
                                            pointCount++;
                                            
                                            return new kakao.maps.LatLng(coord[1], coord[0]);
                                        });
                                        
                                        paths.push(path);
                                    });
                                });
                            } else if (feature.geometry.type === 'Polygon') {
                                feature.geometry.coordinates.forEach((coords: any) => {
                                    const path = coords.map((coord: [number, number]) => {
                                        // 중심 좌표 계산을 위해 모든 좌표 합산
                                        centerLng += coord[0];
                                        centerLat += coord[1];
                                        pointCount++;
                                        
                                        return new kakao.maps.LatLng(coord[1], coord[0]);
                                    });
                                    
                                    paths.push(path);
                                });
                            }
                            
                            // 폴리곤이 존재할 때만 처리
                            if (paths.length > 0) {
                                // 다중 폴리곤 처리
                                paths.forEach(path => {
                                    const polygon = new kakao.maps.Polygon({
                                        path: path,
                                        strokeWeight: 1,
                                        strokeColor: '#FFFFFF',
                                        strokeOpacity: 0.7,
                                        strokeStyle: 'solid',
                                        fillColor: fillColor,
                                        fillOpacity: 0.6
                                    });
                                    
                                    polygon.setMap(mapInstance.current);
                                    polygonsRef.current.push(polygon);
                                });
                                
                                // 중심 좌표 계산
                                if (pointCount > 0) {
                                    centerLat = centerLat / pointCount;
                                    centerLng = centerLng / pointCount;
                                    
                                    // 라벨 생성
                                    const labelContent = document.createElement('div');
                                    labelContent.style.padding = '2px 6px';
                                    labelContent.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
                                    labelContent.style.borderRadius = '3px';
                                    labelContent.style.fontSize = zoomLevel <= 6 ? '10px' : '12px';
                                    labelContent.style.fontWeight = 'bold';
                                    labelContent.style.border = '1px solid #ccc';
                                    labelContent.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.2)';
                                    labelContent.style.whiteSpace = 'nowrap';
                                    labelContent.style.pointerEvents = 'none';
                                    labelContent.innerText = regionName;
                                    
                                    const label = new kakao.maps.CustomOverlay({
                                        position: new kakao.maps.LatLng(centerLat, centerLng),
                                        content: labelContent,
                                        xAnchor: 0.5,
                                        yAnchor: 0.5,
                                        zIndex: 3
                                    });
                                    
                                    label.setMap(mapInstance.current);
                                    labelsRef.current.push(label);
                                }
                            }
                        } catch (error) {
                            console.error('행정구역 폴리곤 생성 중 오류:', error);
                        }
                    });
                } catch (error) {
                    console.error('행정구역 폴리곤 그리기 중 오류:', error);
                }
            };
            
            // 처음 경계 그리기
            mapInstance.current._drawBoundaries();
            
        } catch (error) {
            console.error('행정구역 경계 그리기 초기화 중 오류:', error);
        }
    }, [isMapLoaded, dongBoundaries, guBoundaries]);
    
    // 줌 레벨 변경 이벤트 리스너 등록 - 별도의 useEffect로 분리
    useEffect(() => {
        if (!isMapLoaded || !mapInstance.current || !mapInstance.current._drawBoundaries) return;
        
        try {
            const kakao = (window as any).kakao;
            if (!kakao || !kakao.maps || !kakao.maps.event) {
                console.warn('카카오맵 이벤트 API가 로드되지 않았습니다.');
                return;
            }
            
            console.log('줌 레벨 변경 이벤트 리스너 등록 중...');
            
            // 줌 변경 이벤트에 경계 다시 그리기 추가
            const zoomChangeListener = kakao.maps.event.addListener(
                mapInstance.current, 
                'zoom_changed', 
                mapInstance.current._drawBoundaries
            );
            
            // 리스너 참조를 맵 인스턴스에 저장
            mapInstance.current._zoomChangeListener = zoomChangeListener;
            
            console.log('줌 레벨 변경 이벤트 리스너가 성공적으로 등록되었습니다.');
            
            return () => {
                try {
                    console.log('줌 레벨 변경 이벤트 리스너 제거 중...');
                    if (kakao && kakao.maps && kakao.maps.event && zoomChangeListener) {
                        kakao.maps.event.removeListener(zoomChangeListener);
                        console.log('줌 레벨 변경 이벤트 리스너가 성공적으로 제거되었습니다.');
                    }
                } catch (error) {
                    console.error('이벤트 리스너 제거 중 오류:', error);
                }
            };
        } catch (error) {
            console.error('줌 레벨 변경 이벤트 리스너 등록 중 오류:', error);
        }
    }, [isMapLoaded, dongBoundaries, guBoundaries]);

    return (
        <Box sx={{ 
            position: 'relative', 
            width: '100%',
            height: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* 지도 컨테이너 */}
            <Box 
                ref={mapRefInternal}
                sx={{
                    width: '100%',
                    height: '100%',
                    flex: 1
                }}
            />
            
            {/* 줌 컨트롤 버튼 */}
            <Box sx={{
                position: 'absolute',
                right: '10px',
                bottom: '20px',
                zIndex: 10,
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Button 
                    onClick={handleZoomIn}
                    sx={{ minWidth: '36px', height: '36px', p: 0, borderRadius: '4px 4px 0 0' }}
                >
                    <AddIcon />
                </Button>
                <Box sx={{ height: '1px', bgcolor: 'divider', width: '100%' }} />
                <Button 
                    onClick={handleZoomOut}
                    sx={{ minWidth: '36px', height: '36px', p: 0, borderRadius: '0 0 4px 4px' }}
                >
                    <RemoveIcon />
                </Button>
            </Box>
            
            {/* 현재 위치 버튼 */}
            <Box sx={{
                position: 'absolute',
                right: '10px',
                bottom: '100px',
                zIndex: 10,
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <Button 
                    onClick={handleCurrentLocation}
                    disabled={isLocating}
                    sx={{ 
                        minWidth: '36px', 
                        height: '36px', 
                        p: 0, 
                        borderRadius: '4px',
                        '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                        }
                    }}
                >
                    <MyLocationIcon color={isLocating ? "disabled" : "primary"} />
                </Button>
            </Box>
            
            {/* 에러 메시지 */}
            {mapErrorMessage && (
                <Alert severity="error" sx={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
                    {mapErrorMessage}
                </Alert>
            )}

            {/* 동일 위치 매물 리스트 - 상위에 위치시켜 오버레이 효과 생성 */}
            <SameLocationArticleList 
                articles={sameLocationArticles}
                isOpen={sameLocationPopupOpen}
                onClose={handleCloseLocationPopup}
                onArticleClick={onArticleClick}
                selectedArticle={selectedArticle}
                location={currentLocation || { lat: 0, lng: 0 }}
                isListHidden={isListHidden}
            />
        </Box>
    );
};

export default MapView; 
