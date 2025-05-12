import React from 'react';

import { RegionArticleCount } from '../types/mapDisplayTypes';

interface RegionArticleCountMarkerProps {
  regionCount: RegionArticleCount;
  onClick: (regionCount: RegionArticleCount) => void;
}

const RegionArticleCountMarker: React.FC<RegionArticleCountMarkerProps> = ({ 
  regionCount,
  onClick
}) => {
  const { count, name, type } = regionCount;
  
  // 매물 수에 따른 색상 계산
  const getBackgroundColor = (count: number, type: 'city' | 'district'): string => {
    if (type === 'city') {
      if (count <= 10) return '#5C6BC0';       // 파란색
      else if (count <= 50) return '#3949AB'; 
      else if (count <= 100) return '#303F9F';
      else if (count <= 500) return '#283593';
      else return '#1A237E';                   // 매우 진한 파란색
    } else {
      if (count <= 10) return '#4CAF50';       // 녹색
      else if (count <= 50) return '#43A047';
      else if (count <= 100) return '#388E3C';
      else if (count <= 500) return '#2E7D32';
      else return '#1B5E20';                   // 매우 진한 녹색
    }
  };
  
  // 매물 수에 따른 크기 계산
  const getSizeByCount = (count: number): number => {
    if (count <= 10) return 50;
    else if (count <= 50) return 55;
    else if (count <= 100) return 60;
    else if (count <= 500) return 65;
    else if (count <= 1000) return 70;
    else return 75;
  };
  
  const size = getSizeByCount(count);
  const backgroundColor = getBackgroundColor(count, type);
  const fontSize = Math.max(16, Math.min(20, Math.floor(size * 0.3)));
  const nameSize = Math.max(12, Math.min(14, Math.floor(size * 0.24)));
  
  const handleClick = () => {
    onClick(regionCount);
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: 2,
      }}
      onClick={handleClick}
    >
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill={backgroundColor}
          opacity="0.85"
          stroke="#ffffff"
          strokeWidth="2"
        />
        <text
          x="50"
          y="45"
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight="bold"
          fill="white"
        >
          {count}
        </text>
        <text
          x="50"
          y="65"
          textAnchor="middle"
          fontSize={nameSize}
          fill="white"
        >
          {name.replace(' ', '\n')}
        </text>
      </svg>
    </div>
  );
};

export default RegionArticleCountMarker; 