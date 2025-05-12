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

    // 지도 초기화 함수
    const initializeMap = useCallback(() => {
        if (!mapRefInternal.current) {
            console.error('Map container ref is not available');
            return;
        }

        try {
            const kakao = (window as any).kakao;
            if (!kakao || !kakao.maps) {
                console.error('Kakao Maps API is not loaded');
                setMapErrorMessage('지도 API를 불러오는데 실패했습니다');
                return;
            }

            // 기존 지도 인스턴스가 있으면 재사용
            if (mapInstance.current) {
                console.log('Reusing existing map instance');
                return;
            }

            const center = new kakao.maps.LatLng(
                initialCenter?.lat || 37.566826,
                initialCenter?.lng || 126.9786567
            );

            // 지도 생성
            const map = new kakao.maps.Map(mapRefInternal.current, {
                center: center,
                level: initialZoom
            });

            // 지도 타입 컨트롤 추가
            const mapTypeControl = new kakao.maps.MapTypeControl();
            map.addControl(mapTypeControl, kakao.maps.ControlPosition.TOPRIGHT);

            // 확대/축소 컨트롤 추가
            // Custom 컨트롤로 대체하므로 주석 처리
            // const zoomControl = new kakao.maps.ZoomControl();
            // map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);

            // 현재 지도 범위 얻기
            const bounds = map.getBounds();
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            setMapBounds({
                ne: { lat: ne.getLat(), lng: ne.getLng() },
                sw: { lat: sw.getLat(), lng: sw.getLng() }
            });

            // 지도 이벤트 리스너 등록
            kakao.maps.event.addListener(map, 'bounds_changed', () => {
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
            });

            // 중심점/줌 변경 이벤트
            kakao.maps.event.addListener(map, 'center_changed', () => {
                if (onViewChange) {
                    const center = map.getCenter();
                    onViewChange(
                        { lat: center.getLat(), lng: center.getLng() },
                        map.getLevel()
                    );
                }
            });

            // 줌 변경 이벤트
            kakao.maps.event.addListener(map, 'zoom_changed', () => {
                const zoomLevel = map.getLevel();
                setCurrentZoomLevel(zoomLevel);

                if (onViewChange) {
                    const center = map.getCenter();
                    onViewChange(
                        { lat: center.getLat(), lng: center.getLng() },
                        zoomLevel
                    );
                }
            });

            // 외부에서 참조할 수 있도록 지도 인스턴스 저장
            mapInstance.current = map;

            // 외부에서 제공된 mapRef가 있으면 참조 설정
            if (mapRef) {
                mapRef.current = map;
            }

            setIsMapLoaded(true);
            console.log('Kakao map initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
            setMapErrorMessage('지도를 초기화하는데 문제가 발생했습니다');
        }
    }, [initialCenter, initialZoom, onBoundsChanged, onViewChange, mapRef]);

    // 카카오맵 스크립트 로드
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 이미 로드된 경우
        if (isScriptLoaded || (window as any).kakao?.maps) {
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
                    console.log('Kakao Maps API loaded');
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
    }, [KAKAO_APP_KEY, initializeMap, isScriptLoaded]);

    // 초기 중심점 설정
    useEffect(() => {
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