// This file defines TypeScript type declarations for the Kakao Maps JavaScript SDK
// It extends the global Window interface to include the kakao.maps namespace
declare global {
    interface Window {
        kakao: {
            maps: {
                // Creates a latitude/longitude coordinate
                LatLng: new (lat: number, lng: number) => any;
                
                // Creates a map instance
                Map: new (container: HTMLElement, options: any) => any;
                
                // Creates a marker that can be placed on the map
                Marker: new (options: any) => any;
                
                // Creates a custom marker image
                MarkerImage: new (url: string, size: any, options?: any) => any;
                
                // Represents dimensions (width/height)
                Size: new (width: number, height: number) => any;
                
                // Represents a point with x/y coordinates
                Point: new (x: number, y: number) => any;
                
                // Creates an info window that can display content above markers
                InfoWindow: new (options: any) => any;
                
                // Represents a rectangular geographical boundary
                LatLngBounds: new () => any;
                
                // Loads the maps API asynchronously
                load: (callback: () => void) => void;
                
                // Event handling utilities
                event: {
                    // Adds event listeners to map objects
                    addListener: (target: any, eventName: string, callback: (...args: any[]) => void) => void;
                };
            };
        };
    }
}

// Empty export to make this a module
export {}; 