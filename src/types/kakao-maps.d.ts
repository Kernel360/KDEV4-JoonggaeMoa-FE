declare interface Window {
  kakao: {
    maps: {
      LatLng: new (lat: number, lng: number) => any;
      Map: new (container: HTMLElement, options: any) => any;
      Marker: new (options: any) => any;
      load: (callback: () => void) => void;
      event: {
        addListener: (target: any, eventName: string, callback: () => void) => void;
      };
      LatLngBounds: new () => any;
    };
  };
}