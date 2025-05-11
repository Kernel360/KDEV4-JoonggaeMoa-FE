import { useState } from 'react';

interface UseMapControlsProps {
  mapInstance: React.MutableRefObject<any>;
  isMapLoaded: boolean;
  setCurrentZoomLevel: (level: number) => void;
}

export const useMapControls = ({
  mapInstance,
  isMapLoaded,
  setCurrentZoomLevel
}: UseMapControlsProps) => {
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [myLocationMarker, setMyLocationMarker] = useState<any>(null);

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

  return {
    isLocating,
    myLocationMarker,
    handleZoomIn,
    handleZoomOut,
    handleCurrentLocation,
    setMyLocationMarker
  };
}; 