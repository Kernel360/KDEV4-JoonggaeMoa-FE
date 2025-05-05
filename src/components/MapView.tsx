import { Alert, Box, Button, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { ArticleResponse, ClusterInfo, RealEstateType } from '../types/article';
import { createArticleMarkerSvg } from '../utils/articleDisplay';
import { YEOKSAM_CENTER, MAP_ZOOM_LEVELS } from '../constants/mapConstants';
import { validateCoordinates, createCoordinates } from "../utils/articleFormat";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

declare global {
    interface Window {
        _customMarkers: any[];
    }
}

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

// 매물 유형별 아이콘 및 색상 매핑 정의
const PROPERTY_TYPE_STYLES = {
    "아파트": { icon: "🏢", color: "#3F51B5" }, // 파란색
    "오피스텔": { icon: "🏬", color: "#673AB7" }, // 보라색
    "빌라": { icon: "🏘️", color: "#4CAF50" }, // 녹색
    "전원주택": { icon: "🏡", color: "#8BC34A" }, // 연두색
    "단독/다가구": { icon: "🏠", color: "#009688" }, // 청록색
    "상가주택": { icon: "🏪", color: "#FF5722" }, // 주황색
    "한옥주택": { icon: "🏯", color: "#795548" }, // 갈색
    "상가": { icon: "🏪", color: "#FF9800" }, // 주황색
    "사무실": { icon: "🏢", color: "#607D8B" }, // 회색
    // 기본값 (매물 유형이 없거나 매칭되지 않을 경우)
    "default": { icon: "📍", color: "#F44336" } // 빨간색
};

// 유형에 맞는 스타일 가져오기 (없으면 기본값 반환)
const getPropertyTypeStyle = (type?: string) => {
    if (!type || !(type in PROPERTY_TYPE_STYLES)) {
        return PROPERTY_TYPE_STYLES.default;
    }
    return PROPERTY_TYPE_STYLES[type as keyof typeof PROPERTY_TYPE_STYLES];
};

// 클러스터 히트맵 색상 배열 (낮은 밀도에서 높은 밀도로)
const HEATMAP_COLORS = [
    '#00FF00', // 녹색 (낮은 밀도)
    '#ADFF2F', // 연두색
    '#FFFF00', // 노란색
    '#FFA500', // 주황색
    '#FF4500', // 붉은 주황색
    '#FF0000', // 빨간색
    '#DC143C', // 크림슨
    '#8B0000', // 어두운 빨간색
    '#800080', // 보라색
    '#4B0082'  // 남색 (높은 밀도)
];

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
    mapRef
}: MapViewProps) => {
    const mapRefInternal = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
    const [mapErrorMessage, setMapErrorMessage] = useState<string | null>(null);
    const [mapBounds, setMapBounds] = useState<any>(null);
    const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(initialZoom || MAP_ZOOM_LEVELS.DEFAULT);
    const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY;
    
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
                        const boundsData = {
                            ne: { 
                                lat: bounds.getNorthEast().getLat(), 
                                lng: bounds.getNorthEast().getLng() 
                            },
                            sw: { 
                                lat: bounds.getSouthWest().getLat(), 
                                lng: bounds.getSouthWest().getLng() 
                            }
                        };
                        onBoundsChanged(boundsData, level);
                    }
                } catch (error) {
                    console.error("Error in map idle event handler:", error);
                }
            }, 300);

            (window as any).kakao.maps.event.addListener(kakaoMap, 'idle', handleMapIdle);
            
            // 초기 줌 레벨 설정
            setCurrentZoomLevel(kakaoMap.getLevel());
            setIsMapLoaded(true);

            return () => {
                (window as any).kakao.maps.event.removeListener(kakaoMap, 'idle', handleMapIdle);
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
                
                // 기본값으로 초기 클러스터 설정
                let processedClusters = initialProcessedClusters;
                
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
                    processedClusters = adjustClusterPositions(initialProcessedClusters);
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
        else if (!clusterMode && articles && articles.length > 0) {
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
            
            // 매물 마커 생성
            validArticles.forEach(article => {
                try {
                    // 매물 위치 좌표 변환 - 유틸리티 함수 사용
                    const coordinates = createCoordinates(article.latitude, article.longitude);
                    
                    // 좌표가 유효하지 않은 경우 건너뛰기
                    if (!coordinates) {
                        console.error(`Invalid coordinates for article ${article.id}: lat=${article.latitude}, lng=${article.longitude}`);
                        return;
                    }
                    
                    // 마커 DOM 엘리먼트 생성
                    const element = document.createElement('div');
                    
                    // 개별 매물은 원래 색상 사용 (히트맵 색상 제거)
                    element.innerHTML = `
                        <div 
                            style="
                                position: absolute;
                                width: 40px;
                                height: 40px;
                                transform: translate(-50%, -50%);
                                cursor: pointer;
                                z-index: ${selectedArticle && selectedArticle.id === article.id ? 5 : 1};
                            "
                        >
                            ${createArticleMarkerSvg(article.buildingType, selectedArticle && selectedArticle.id === article.id)}
                        </div>
                    `;

                    // 클릭 이벤트 추가
                    element.firstElementChild?.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Article clicked:", article.id);
                        onArticleClick(article);
                    });

                    // kakao LatLng 객체 생성
                    let position;
                    try {
                        position = new (window as any).kakao.maps.LatLng(coordinates.lat, coordinates.lng);
                    } catch (err) {
                        console.error(`Failed to create LatLng for article ${article.id}: ${err}`);
                        return;
                    }

                    // 마커 생성
                    try {
                        const marker = new (window as any).kakao.maps.CustomOverlay({
                            position: position,
                            content: element,
                            map: map,
                            zIndex: selectedArticle && selectedArticle.id === article.id ? 5 : 1
                        });

                        window._customMarkers.push(marker);
                    } catch (err) {
                        console.error(`Failed to create marker for article ${article.id}: ${err}`);
                    }
                } catch (err) {
                    console.error("Error creating article marker:", err, "Article:", article);
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

    return (
        <>
            {mapErrorMessage && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {mapErrorMessage}
                </Alert>
            )}
            <Box sx={{ 
                width: '100%', 
                height: '100%', 
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div 
                    ref={mapRefInternal} 
                    style={{ 
                        width: '100%', 
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        userSelect: 'none',
                        touchAction: 'none'
                    }} 
                />
                
                {/* 확대/축소 컨트롤 */}
                <Box 
                    sx={{
                        position: 'absolute',
                        right: 16,
                        bottom: 16,
                        zIndex: 10,
                        backgroundColor: 'white',
                        borderRadius: 1,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        overflow: 'hidden'
                    }}
                >
                    <Button 
                        onClick={handleZoomIn}
                        sx={{ 
                            minWidth: '40px', 
                            height: '40px', 
                            borderRadius: 0,
                            borderBottom: '1px solid #eee' 
                        }}
                    >
                        <AddIcon />
                    </Button>
                    <Button 
                        onClick={handleZoomOut}
                        sx={{ 
                            minWidth: '40px', 
                            height: '40px',
                            borderRadius: 0
                        }}
                    >
                        <RemoveIcon />
                    </Button>
                </Box>
            </Box>
        </>
    );
};

export default MapView; 
