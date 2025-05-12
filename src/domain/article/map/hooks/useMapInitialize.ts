import React, { useEffect, useRef, useState, useCallback } from 'react';

import { MAP_ZOOM_LEVELS } from '../constants/mapConstants';

interface UseMapInitializeProps {
    initialCenter?: { lat: number; lng: number };
    initialZoom?: number;
    onViewChange?: (center: { lat: number; lng: number }, zoom: number) => void;
    onBoundsChanged?: (bounds: {
        ne: { lat: number; lng: number };
        sw: { lat: number; lng: number }
    }, zoom: number) => void;
    mapRef?: React.MutableRefObject<any>;
}

export const useMapInitialize = ({
                                     initialCenter,
                                     initialZoom = MAP_ZOOM_LEVELS.DEFAULT,
                                     onViewChange,
                                     onBoundsChanged,
                                     mapRef
                                 }: UseMapInitializeProps) => {
    const mapRefInternal = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState<boolean>(false);
    const [mapErrorMessage, setMapErrorMessage] = useState<string>('');
    const [mapBounds, setMapBounds] = useState<any>(null);
    const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(initialZoom);
    const KAKAO_APP_KEY = import.meta.env.VITE_KAKAO_APP_KEY;

    const initialCenterRef = useRef<{ lat: number; lng: number } | null>(null);
    const initializeAttempted = useRef<boolean>(false);

    // 지도 초기화 함수
    const initializeMap = useCallback(() => {
        if (!mapRefInternal.current) {
            return;
        }

        if (initializeAttempted.current && mapInstance.current) {
            return;
        }

        initializeAttempted.current = true;

        try {
            const kakao = (window as any).kakao;
            if (!kakao || !kakao.maps) {
                setMapErrorMessage('지도 API를 불러오는데 실패했습니다');
                return;
            }

            // 기존 지도 인스턴스가 있으면 재사용
            if (mapInstance.current) {
                return;
            }

            const center = new kakao.maps.LatLng(
                initialCenter?.lat || 37.566826,
                initialCenter?.lng || 126.9786567
            );

            // 지도 생성 및 최적화 옵션 설정
            const map = new kakao.maps.Map(mapRefInternal.current, {
                center: center,
                level: initialZoom,
                // 성능 향상을 위한 옵션
                draggable: true,
                disableDoubleClick: false,
                disableDoubleClickZoom: false,
                tileAnimation: false, // 타일 애니메이션 비활성화로 렌더링 속도 향상
                maxLevel: 14 // 최대 줌 레벨 제한
            });

            // 지도 타입 컨트롤 필요한 경우만 추가
            // const mapTypeControl = new kakao.maps.MapTypeControl();
            // map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

            // 현재 지도 범위 얻기 (최소한의 연산만 수행)
            const bounds = map.getBounds();
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const newBounds = {
                ne: { lat: ne.getLat(), lng: ne.getLng() },
                sw: { lat: sw.getLat(), lng: sw.getLng() }
            };
            setMapBounds(newBounds);

            // 바운드 변경 이벤트 - 디바운스 처리
            let boundsChangeTimeout: NodeJS.Timeout | null = null;
            kakao.maps.event.addListener(map, 'bounds_changed', () => {
                // 이전 타임아웃이 있으면 제거
                if (boundsChangeTimeout) {
                    clearTimeout(boundsChangeTimeout);
                }
                
                // 200ms 디바운스 적용 - 과도한 이벤트 발생 방지
                boundsChangeTimeout = setTimeout(() => {
                    const bounds = map.getBounds();
                    const ne = bounds.getNorthEast();
                    const sw = bounds.getSouthWest();
                    const newBounds = {
                        ne: { lat: ne.getLat(), lng: ne.getLng() },
                        sw: { lat: sw.getLat(), lng: sw.getLng() }
                    };
                    setMapBounds(newBounds);

                    // 바운드 변경 이벤트 콜백
                    if (onBoundsChanged) {
                        onBoundsChanged(newBounds, map.getLevel());
                    }
                }, 200);
            });

            // 중심점/줌 변경 이벤트에 대한 통합 관리 (디바운스 적용)
            let viewChangeTimeout: NodeJS.Timeout | null = null;
            
            // 중심점 변경 이벤트가 발생하면 줌 레벨 변경 없이 센터만 변경된 경우만 처리
            kakao.maps.event.addListener(map, 'center_changed', () => {
                if (!onViewChange) return;
                
                // 이전 타임아웃이 있으면 제거
                if (viewChangeTimeout) {
                    clearTimeout(viewChangeTimeout);
                }
                
                // 디바운스 타이머 적용 (200ms)
                viewChangeTimeout = setTimeout(() => {
                    const center = map.getCenter();
                    onViewChange(
                        { lat: center.getLat(), lng: center.getLng() },
                        map.getLevel()
                    );
                }, 200);
            });

            // 줌 변경 이벤트 - 디바운스 처리 (줌 변경에만 반응)
            let zoomChangeTimeout: NodeJS.Timeout | null = null;
            kakao.maps.event.addListener(map, 'zoom_changed', () => {
                const zoomLevel = map.getLevel();
                setCurrentZoomLevel(zoomLevel);

                if (!onViewChange) return;
                
                // 이전 타임아웃이 있으면 제거
                if (zoomChangeTimeout) {
                    clearTimeout(zoomChangeTimeout);
                }
                
                // 센터 변경 타임아웃도 취소 (줌 변경이 우선)
                if (viewChangeTimeout) {
                    clearTimeout(viewChangeTimeout);
                }
                
                // 디바운스 타이머 적용 (150ms)
                zoomChangeTimeout = setTimeout(() => {
                    const center = map.getCenter();
                    onViewChange(
                        { lat: center.getLat(), lng: center.getLng() },
                        zoomLevel
                    );
                }, 150);
            });

            // 타일 로드 완료 이벤트를 통해 지도가 실제로 렌더링되었는지 확인
            kakao.maps.event.addListener(map, 'tilesloaded', () => {
                if (!isMapLoaded) {
                    setIsMapLoaded(true);
                    
                    // 초기 bounds_changed 이벤트 트리거
                    if (onBoundsChanged) {
                        const bounds = map.getBounds();
                        const ne = bounds.getNorthEast();
                        const sw = bounds.getSouthWest();
                        onBoundsChanged(
                            {
                                ne: { lat: ne.getLat(), lng: ne.getLng() },
                                sw: { lat: sw.getLat(), lng: sw.getLng() }
                            },
                            map.getLevel()
                        );
                    }
                    
                    // 초기 중심점 설정 (있을 경우에만)
                    if (initialCenter && !initialCenterRef.current) {
                        initialCenterRef.current = initialCenter;
                        const position = new kakao.maps.LatLng(
                            initialCenter.lat,
                            initialCenter.lng
                        );
                        map.setCenter(position);
                    }
                }
            });

            // 외부에서 참조할 수 있도록 지도 인스턴스 저장
            mapInstance.current = map;

            // 외부에서 제공된 mapRef가 있으면 참조 설정
            if (mapRef) {
                mapRef.current = map;
            }
        } catch (error) {
            console.error('Error initializing map:', error);
            setMapErrorMessage('지도를 초기화하는데 문제가 발생했습니다');
        }
    }, [initialCenter, initialZoom, onBoundsChanged, onViewChange, mapRef, isMapLoaded]);

    // 카카오맵 스크립트 로드
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 이미 로드된 경우
        if ((window as any).kakao?.maps) {
            setIsScriptLoaded(true);
            initializeMap();
            return;
        }

        try {
            const script = document.createElement('script');
            script.async = true;
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&autoload=false&libraries=services,clusterer,drawing`;

            script.onload = () => {
                (window as any).kakao.maps.load(() => {
                    setIsScriptLoaded(true);
                    initializeMap();
                });
            };

            script.onerror = () => {
                console.error('Failed to load Kakao Maps API');
                setMapErrorMessage('지도 API를 불러오는데 실패했습니다');
            };

            document.head.appendChild(script);

            return () => {
                // 언마운트 시 스크립트 제거는 하지 않음 (다른 컴포넌트에서 재사용)
            };
        } catch (error) {
            console.error('Error loading map script:', error);
            setMapErrorMessage('지도 스크립트를 로드하는데 문제가 발생했습니다');
        }
    }, [KAKAO_APP_KEY, initializeMap]);

    // 초기 줌 레벨 설정
    const initialZoomRef = useRef(initialZoom);
    useEffect(() => {
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

    return {
        mapRefInternal,
        mapInstance,
        isMapLoaded,
        isScriptLoaded,
        mapErrorMessage,
        mapBounds,
        currentZoomLevel,
        setCurrentZoomLevel
    };
}; 