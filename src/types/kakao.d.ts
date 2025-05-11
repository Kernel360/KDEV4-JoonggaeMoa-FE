// This file defines TypeScript type declarations for the Kakao Maps JavaScript SDK

// Declare global kakao namespace
declare namespace kakao {
    namespace maps {
        class LatLng {
            constructor(lat: number, lng: number);

            getLat(): number;

            getLng(): number;
        }

        class Map {
            constructor(container: HTMLElement, options: MapOptions);

            setCenter(latLng: LatLng): void;

            setLevel(level: number): void;

            getBounds(): LatLngBounds;

            setBounds(bounds: LatLngBounds): void;
        }

        interface MapOptions {
            center: LatLng;
            level: number;
            draggable?: boolean;
            scrollwheel?: boolean;
            disableDoubleClickZoom?: boolean;
            mapTypeControl?: boolean;
            zoomControl?: boolean;
        }

        class Marker {
            constructor(options: MarkerOptions);

            setMap(map: Map | null): void;
        }

        interface MarkerOptions {
            position: LatLng;
            image?: MarkerImage;
            title?: string;
        }

        class MarkerImage {
            constructor(url: string, size: Size, options: { offset: Point });
        }

        class Size {
            constructor(width: number, height: number);
        }

        class Point {
            constructor(x: number, y: number);
        }

        class InfoWindow {
            constructor(options: any);

            open(map: Map, marker: Marker): void;

            close(): void;
        }

        class MarkerClusterer {
            constructor(options: any);
        }

        class event {
            static addListener(target: any, eventName: string, callback: (...args: any[]) => void): void;

            static removeListener(target: any, eventName: string, callback: (...args: any[]) => void): void;
        }

        class LatLngBounds {
            constructor();

            extend(latLng: LatLng): void;
        }
    }
}

declare global {
    interface Window {
        kakao: typeof kakao;
    }
}

// Ensure this file is treated as a module
export {}; 