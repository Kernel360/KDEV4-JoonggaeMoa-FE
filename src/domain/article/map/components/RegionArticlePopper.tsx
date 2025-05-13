import { Box, Paper, Typography, Grow, ClickAwayListener } from '@mui/material';
import React, { useRef, useEffect, useState } from 'react';

import { RegionArticleCount } from '../types/mapDisplayTypes';

interface RegionArticlePopperProps {
  regionCount: RegionArticleCount;
  onClick: (regionCount: RegionArticleCount) => void;
}

const RegionArticlePopper: React.FC<RegionArticlePopperProps> = ({ 
  regionCount,
  onClick
}) => {
  const { count, name, type } = regionCount;
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  
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
  
  // 팝업 토글
  const togglePopper = () => {
    setOpen((prev) => !prev);
  };
  
  // 닫기
  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };
  
  // 클릭 핸들러
  const handleClick = () => {
    togglePopper();
    onClick(regionCount);
  };
  
  // 팝업이 열린 후 5초 후에 자동으로 닫히도록 설정
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [open]);
  
  return (
    <div
      ref={anchorRef}
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
      {/* 기본 마커 */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          border: '2px solid white',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          color: 'white',
          opacity: 0.9,
        }}
      >
        <Typography variant="body1" fontWeight="bold" fontSize={Math.max(16, Math.min(20, Math.floor(size * 0.3)))}>
          {count}
        </Typography>
        <Typography variant="caption" fontSize={Math.max(10, Math.min(14, Math.floor(size * 0.24)))}>
          {type === 'city' ? name.split(' ')[0] : name.split(' ').pop()}
        </Typography>
      </div>
      
      {/* 팝업 */}
      {open && (
        <ClickAwayListener onClickAway={handleClose}>
          <Grow in={open}>
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                top: `-${size * 0.8}px`,
                left: '50%',
                transform: 'translateX(-50%)',
                minWidth: `${size * 2.5}px`,
                padding: 1.5,
                zIndex: 3,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold" color="#333">
                  {name}
                </Typography>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mt: 0.5
                  }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12, 
                      borderRadius: '50%',
                      backgroundColor,
                      mr: 1
                    }}
                  />
                  <Typography variant="body1" fontWeight="bold" color={backgroundColor}>
                    {count}개의 매물
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {type === 'city' ? '시 단위 매물 수' : '구 단위 매물 수'} 
                </Typography>
                <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5, cursor: 'pointer' }}>
                  클릭하여 자세히 보기
                </Typography>
              </Box>
            </Paper>
          </Grow>
        </ClickAwayListener>
      )}
    </div>
  );
};

export default RegionArticlePopper; 