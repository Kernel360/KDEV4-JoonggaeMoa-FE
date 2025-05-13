import { Box, Paper, Typography, Popper, Fade } from '@mui/material';
import React, { useRef, useState, useEffect, useCallback } from 'react';

import { RegionArticleCount } from '../types/mapDisplayTypes';
import { ArticleResponse, TradeType } from '../../types/article';

interface RegionHoverPopperProps {
  regionCount: RegionArticleCount;
  mapArticles: ArticleResponse[];
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

interface TradeTypeCount {
  매매: number;
  전세: number;
  월세: number;
}

const RegionHoverPopper: React.FC<RegionHoverPopperProps> = ({ 
  regionCount,
  mapArticles,
  onMouseEnter,
  onMouseLeave
}) => {
  const { count, name, type, region } = regionCount;
  const [open, setOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [tradeTypeCounts, setTradeTypeCounts] = useState<TradeTypeCount>({
    매매: 0,
    전세: 0,
    월세: 0
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const popperTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const popperRef = useRef<HTMLDivElement>(null);
  const isHoverActiveRef = useRef<boolean>(false);
  
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

  // 해당 지역에 속하는 매물들만 필터링하여 거래 유형별 개수 계산
  useEffect(() => {
    if (!mapArticles || !region) return;
    
    try {
      // 지역 코드가 일치하는 매물 필터링
      const regionArticles = mapArticles.filter(article => {
        if (type === 'city') {
          return article.address1SiDo === name;
        } else {
          // 구/군 단위 필터링
          return article.address1SiDo + ' ' + article.address2SiGunGu === name ||
                article.address2SiGunGu === name.split(' ').pop();
        }
      });
      
      console.log(`[RegionHoverPopper] ${name} 지역 매물 필터링 결과:`, regionArticles.length);
      
      // 거래 유형별 개수 계산
      const counts: TradeTypeCount = {
        매매: 0,
        전세: 0,
        월세: 0
      };
      
      regionArticles.forEach(article => {
        const tradeType = article.tradeType as TradeType;
        if (tradeType && counts[tradeType] !== undefined) {
          counts[tradeType]++;
        }
      });
      
      console.log(`[RegionHoverPopper] ${name} 거래 유형별 개수:`, counts);
      setTradeTypeCounts(counts);
    } catch (error) {
      console.error("[RegionHoverPopper] 매물 필터링 오류:", error);
    }
  }, [mapArticles, region, name, type]);
  
  const size = getSizeByCount(count);
  const backgroundColor = getBackgroundColor(count, type);
  
  // 타이머 정리 함수
  const clearPopperTimeout = useCallback(() => {
    if (popperTimeoutRef.current) {
      clearTimeout(popperTimeoutRef.current);
      popperTimeoutRef.current = null;
    }
  }, []);
  
  // 포퍼 열기 함수
  const openPopper = useCallback((x: number, y: number) => {
    clearPopperTimeout();
    setMousePosition({ x, y });
    setOpen(true);
    isHoverActiveRef.current = true;
    console.log(`[RegionHoverPopper] ${name} 지역 호버 시작, 포퍼 표시`);
    
    if (onMouseEnter) {
      onMouseEnter();
    }
  }, [clearPopperTimeout, name, onMouseEnter]);
  
  // 포퍼 닫기 함수
  const closePopper = useCallback(() => {
    if (!isHoverActiveRef.current) return;
    
    clearPopperTimeout();
    
    popperTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      isHoverActiveRef.current = false;
      console.log(`[RegionHoverPopper] ${name} 지역 호버 종료, 포퍼 닫기`);
      
      if (onMouseLeave) {
        onMouseLeave();
      }
    }, 300);
  }, [clearPopperTimeout, name, onMouseLeave]);
  
  // 마우스 이벤트 핸들러
  const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    // 포퍼 열기
    openPopper(event.clientX, event.clientY);
  }, [openPopper]);
  
  const handleMouseLeave = useCallback(() => {
    // 포퍼 닫기
    closePopper();
  }, [closePopper]);
  
  // 마우스 움직임 추적
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (open) {
      setMousePosition({ 
        x: event.clientX, 
        y: event.clientY 
      });
    }
  }, [open]);
  
  // 포퍼 컴포넌트에 대한 마우스 이벤트 핸들러
  const handlePopperMouseEnter = useCallback(() => {
    clearPopperTimeout();
  }, [clearPopperTimeout]);
  
  const handlePopperMouseLeave = useCallback(() => {
    closePopper();
  }, [closePopper]);
  
  // 전역 마우스 이동 이벤트 리스너
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isHoverActiveRef.current || !open) return;
      
      // 마커 요소와 포퍼 요소 영역 체크
      const markerEl = containerRef.current;
      const popperEl = popperRef.current;
      
      if (!markerEl && !popperEl) {
        closePopper();
        return;
      }
      
      // 현재 마우스가 마커나 포퍼 위에 있지 않은 경우
      const isOverMarker = markerEl ? markerEl.contains(e.target as Node) : false;
      const isOverPopper = popperEl ? popperEl.contains(e.target as Node) : false;
      
      if (!isOverMarker && !isOverPopper) {
        // 일정 거리 이상 벗어난 경우에만 닫기
        const markerRect = markerEl?.getBoundingClientRect();
        const popperRect = popperEl?.getBoundingClientRect();
        
        if (markerRect && popperRect) {
          const distance = Math.min(
            Math.sqrt(Math.pow(e.clientX - markerRect.left, 2) + Math.pow(e.clientY - markerRect.top, 2)),
            Math.sqrt(Math.pow(e.clientX - popperRect.left, 2) + Math.pow(e.clientY - popperRect.top, 2))
          );
          
          if (distance > 100) {
            closePopper();
          }
        } else {
          closePopper();
        }
      }
    };
    
    // 전역 이벤트 리스너 등록
    if (open) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [open, closePopper]);
  
  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => clearPopperTimeout();
  }, [clearPopperTimeout]);
  
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        width: `${size}px`,
        height: `${size}px`,
        transform: 'translate(-50%, -50%)',
        cursor: 'pointer',
        zIndex: 2,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* 지역 마커 */}
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
      
      {/* 호버 포퍼 */}
      {open && (
        <div 
          ref={popperRef}
          style={{ 
            position: 'fixed',
            left: mousePosition.x + 20, // 마우스 위치 오른쪽에 배치
            top: mousePosition.y - 60,  // 마우스 위치보다 약간 위에 배치
            zIndex: 9999,               // 높은 z-인덱스 값으로 설정
          }}
          onMouseEnter={handlePopperMouseEnter}
          onMouseLeave={handlePopperMouseLeave}
        >
          <Fade in={open} timeout={200}>
            <Paper
              elevation={4}
              sx={{
                p: 2,
                minWidth: 220,
                borderRadius: 2,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(5px)',
                border: '1px solid #e0e0e0',
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                {name}
              </Typography>
              
              <Box sx={{ mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">매매</Typography>
                  <Typography variant="body2" fontWeight="bold" color="#E53935">
                    {tradeTypeCounts.매매}건
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">전세</Typography>
                  <Typography variant="body2" fontWeight="bold" color="#1E88E5">
                    {tradeTypeCounts.전세}건
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">월세</Typography>
                  <Typography variant="body2" fontWeight="bold" color="#43A047">
                    {tradeTypeCounts.월세}건
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #eee' }}>
                  <Typography variant="body2" color="text.secondary">총 매물</Typography>
                  <Typography variant="body2" fontWeight="bold" color={backgroundColor}>
                    {count}건
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Fade>
        </div>
      )}
    </div>
  );
};

export default RegionHoverPopper; 