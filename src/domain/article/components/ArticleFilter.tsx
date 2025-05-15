import FilterListIcon from '@mui/icons-material/FilterList';
import {
  Box,
  Button,
  Chip,
  InputAdornment,
  InputLabel,
  Popover,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { BuildingType, TradeType } from '../types/article.types'; // 경로 확인 필요
// import { convertKoreanPriceToNumber } from '../../global/common/utils/priceUtils'; // 경로 및 함수명 확인 필요

// 상수 정의 (기존 파일들 참고)
const TRADE_TYPE_OPTIONS: TradeType[] = ['매매', '전세', '월세'];

// 상수 정의 (기존 파일들 참고)
const BUILDING_TYPE_OPTIONS: { label: string; value: BuildingType }[] = [
  { label: '아파트', value: 'A01' },
  { label: '오피스텔', value: 'A02' },
  { label: '빌라', value: 'C02' },
  { label: '전원주택', value: 'C04' },
  { label: '한옥주택', value: 'C06' },
  { label: '사무실', value: 'D01' },
  { label: '상가', value: 'D02' },
  { label: '상가주택', value: 'D05' },
];

// 매매가/전세가/보증금 금액 옵션
const SALE_PRICE_OPTIONS = [
  { label: '5천', value: 5000 },
  { label: '6천', value: 6000 },
  { label: '7천', value: 7000 },
  { label: '8천', value: 8000 },
  { label: '9천', value: 9000 },
  { label: '1억', value: 10000 },
  { label: '2억', value: 20000 },
  { label: '3억', value: 30000 },
  { label: '4억', value: 40000 },
  { label: '5억', value: 50000 },
  { label: '6억', value: 60000 },
  { label: '7억', value: 70000 },
  { label: '8억', value: 80000 },
  { label: '9억', value: 90000 },
  { label: '10억', value: 100000 },
];

// 월세 금액 옵션
const RENT_PRICE_OPTIONS = [
  { label: '10만원', value: 10 },
  { label: '20만원', value: 20 },
  { label: '30만원', value: 30 },
  { label: '40만원', value: 40 },
  { label: '50만원', value: 50 },
  { label: '60만원', value: 60 },
  { label: '70만원', value: 70 },
  { label: '80만원', value: 80 },
  { label: '90만원', value: 90 },
  { label: '1백만원', value: 100 },
  { label: '2백만원', value: 200 }
];

export interface ArticleFilterData {
  tradeTypes: TradeType[];
  buildingTypeCodes: BuildingType[];
  minSalePrice?: number;
  maxSalePrice?: number;
  minRentPrice?: number;
  maxRentPrice?: number;
  sortField: string;
  sortOrder: string;
}

interface ArticleFilterProps {
  initialFilters: ArticleFilterData;
  onFilterChange: (filters: Partial<ArticleFilterData>) => void;
  isPopoverOpen?: boolean;
  anchorEl?: HTMLButtonElement | null;
  onClose?: () => void;
  zoomLevel?: number;
}

const ArticleFilter: React.FC<ArticleFilterProps> = ({
  initialFilters,
  onFilterChange,
  isPopoverOpen = false,
  anchorEl = null,
  onClose,
  zoomLevel = 0,
}) => {
  const [internalAnchorEl, setInternalAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl || internalAnchorEl);

  const [tradeTypeFilter, setTradeTypeFilter] = useState<TradeType[]>(
    initialFilters.tradeTypes || []
  );
  const [buildingTypeFilter, setBuildingTypeFilter] = useState<BuildingType[]>(
    initialFilters.buildingTypeCodes || []
  );
  const [minSalePrice, setMinSalePrice] = useState<string>(
    initialFilters.minSalePrice?.toString() || ''
  );
  const [maxSalePrice, setMaxSalePrice] = useState<string>(
    initialFilters.maxSalePrice?.toString() || ''
  );
  const [minRentPrice, setMinRentPrice] = useState<string>(
    initialFilters.minRentPrice?.toString() || ''
  );
  const [maxRentPrice, setMaxRentPrice] = useState<string>(
    initialFilters.maxRentPrice?.toString() || ''
  );
  // 선택된 가격 버튼 상태
  const [selectedSalePriceButtons, setSelectedSalePriceButtons] = useState<number[]>([]);
  const [selectedRentPriceButtons, setSelectedRentPriceButtons] = useState<number[]>([]);

  const canUseFilter = zoomLevel < 3;

  useEffect(() => {
    setTradeTypeFilter(initialFilters.tradeTypes || []);
    setBuildingTypeFilter(initialFilters.buildingTypeCodes || []);
    setMinSalePrice(initialFilters.minSalePrice?.toString() || '');
    setMaxSalePrice(initialFilters.maxSalePrice?.toString() || '');
    setMinRentPrice(initialFilters.minRentPrice?.toString() || '');
    setMaxRentPrice(initialFilters.maxRentPrice?.toString() || '');
    
    // 초기 선택된 버튼 상태 설정
    setSelectedSalePriceButtons([]);
    setSelectedRentPriceButtons([]);
  }, [initialFilters]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setInternalAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalAnchorEl(null);
    }
    
    // Popover 닫힐 때 필터 적용
    const filtersToApply: Partial<ArticleFilterData> = {
      tradeTypes: tradeTypeFilter,
      buildingTypeCodes: buildingTypeFilter,
    };

    // 숫자로 변환
    const parsePrice = (val: string) => val === '' ? undefined : parseInt(val, 10);

    filtersToApply.minSalePrice = parsePrice(minSalePrice);
    filtersToApply.maxSalePrice = parsePrice(maxSalePrice);
    filtersToApply.minRentPrice = parsePrice(minRentPrice);
    filtersToApply.maxRentPrice = parsePrice(maxRentPrice);
    
    onFilterChange(filtersToApply);
  };
  
  const handleResetFilters = () => {
    setTradeTypeFilter([]);
    setBuildingTypeFilter([]);
    setMinSalePrice('');
    setMaxSalePrice('');
    setMinRentPrice('');
    setMaxRentPrice('');
    setSelectedSalePriceButtons([]);
    setSelectedRentPriceButtons([]);

    // 리셋 시에도 onFilterChange 호출하여 반영
    onFilterChange({
      tradeTypes: [],
      buildingTypeCodes: [],
      minSalePrice: undefined,
      maxSalePrice: undefined,
      minRentPrice: undefined,
      maxRentPrice: undefined,
    });
    
    if (onClose) {
      onClose();
    }
  };

  const handleTradeTypeFilterChange = (type: TradeType) => {
    // 다중 선택 허용
    const newTradeTypeFilter = tradeTypeFilter.includes(type)
      ? tradeTypeFilter.filter(t => t !== type)
      : [...tradeTypeFilter, type];
    setTradeTypeFilter(newTradeTypeFilter);
  };

  const handleBuildingTypeFilterChange = (type: BuildingType) => {
    const newBuildingTypeFilter = buildingTypeFilter.includes(type)
      ? buildingTypeFilter.filter(t => t !== type)
      : [...buildingTypeFilter, type];
    setBuildingTypeFilter(newBuildingTypeFilter);
  };
  
  const handlePriceChange = (field: string, value: string) => {
    if (field === 'minSalePrice') setMinSalePrice(value);
    else if (field === 'maxSalePrice') setMaxSalePrice(value);
    else if (field === 'minRentPrice') setMinRentPrice(value);
    else if (field === 'maxRentPrice') setMaxRentPrice(value);
  };

  // 매매가/전세가/보증금 버튼 클릭 핸들러
  const handleSalePriceButtonClick = (value: number) => {
    // 이미 선택된 버튼이면 제거
    if (selectedSalePriceButtons.includes(value)) {
      setSelectedSalePriceButtons(selectedSalePriceButtons.filter(v => v !== value));
      
      // 선택된 것이 2개 이상 남아있다면 자동으로 범위 다시 계산
      const remaining = selectedSalePriceButtons.filter(v => v !== value);
      if (remaining.length >= 2) {
        const min = Math.min(...remaining);
        const max = Math.max(...remaining);
        setMinSalePrice(min.toString());
        setMaxSalePrice(max.toString());
        
        // 범위 내의 모든 버튼을 다시 선택
        const rangeButtons = SALE_PRICE_OPTIONS
          .filter(option => option.value >= min && option.value <= max)
          .map(option => option.value);
        setSelectedSalePriceButtons(rangeButtons);
      } else if (remaining.length === 1) {
        // 하나만 남았다면 최소/최대 동일하게 설정
        setMinSalePrice(remaining[0].toString());
        setMaxSalePrice(remaining[0].toString());
      } else {
        // 모두 제거됐다면 초기화
        setMinSalePrice('');
        setMaxSalePrice('');
      }
    } else {
      if (selectedSalePriceButtons.length === 0) {
        // 처음 선택한 경우 최소, 최대값 동일하게 설정
        setMinSalePrice(value.toString());
        setMaxSalePrice(value.toString());
        setSelectedSalePriceButtons([value]);
      } else {
        // 이미 버튼이 선택된 상태에서 다른 버튼 선택 시
        // 기존 선택 버튼들의 최소/최대 값과 현재 선택한 버튼 중에서 새로운 범위 결정
        const allValues = [...selectedSalePriceButtons, value];
        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        
        // 최소/최대 값 설정
        setMinSalePrice(min.toString());
        setMaxSalePrice(max.toString());
        
        // 범위 내의 모든 버튼을 선택
        const rangeButtons = SALE_PRICE_OPTIONS
          .filter(option => option.value >= min && option.value <= max)
          .map(option => option.value);
        setSelectedSalePriceButtons(rangeButtons);
      }
    }
  };

  // 월세 버튼 클릭 핸들러
  const handleRentPriceButtonClick = (value: number) => {
    // 이미 선택된 버튼이면 제거
    if (selectedRentPriceButtons.includes(value)) {
      setSelectedRentPriceButtons(selectedRentPriceButtons.filter(v => v !== value));
      
      // 선택된 것이 2개 이상 남아있다면 자동으로 범위 다시 계산
      const remaining = selectedRentPriceButtons.filter(v => v !== value);
      if (remaining.length >= 2) {
        const min = Math.min(...remaining);
        const max = Math.max(...remaining);
        setMinRentPrice(min.toString());
        setMaxRentPrice(max.toString());
        
        // 범위 내의 모든 버튼을 다시 선택
        const rangeButtons = RENT_PRICE_OPTIONS
          .filter(option => option.value >= min && option.value <= max)
          .map(option => option.value);
        setSelectedRentPriceButtons(rangeButtons);
      } else if (remaining.length === 1) {
        // 하나만 남았다면 최소/최대 동일하게 설정
        setMinRentPrice(remaining[0].toString());
        setMaxRentPrice(remaining[0].toString());
      } else {
        // 모두 제거됐다면 초기화
        setMinRentPrice('');
        setMaxRentPrice('');
      }
    } else {
      if (selectedRentPriceButtons.length === 0) {
        // 처음 선택한 경우 최소, 최대값 동일하게 설정
        setMinRentPrice(value.toString());
        setMaxRentPrice(value.toString());
        setSelectedRentPriceButtons([value]);
      } else {
        // 이미 버튼이 선택된 상태에서 다른 버튼 선택 시
        // 기존 선택 버튼들의 최소/최대 값과 현재 선택한 버튼 중에서 새로운 범위 결정
        const allValues = [...selectedRentPriceButtons, value];
        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        
        // 최소/최대 값 설정
        setMinRentPrice(min.toString());
        setMaxRentPrice(max.toString());
        
        // 범위 내의 모든 버튼을 선택
        const rangeButtons = RENT_PRICE_OPTIONS
          .filter(option => option.value >= min && option.value <= max)
          .map(option => option.value);
        setSelectedRentPriceButtons(rangeButtons);
      }
    }
  };

  // 선택된 버튼의 색상 계산 - 그라데이션 구현
  const getButtonColor = (value: number, selectedValues: number[]) => {
    if (!selectedValues.includes(value)) {
      return undefined; // 선택되지 않은 버튼은 색상 없음
    }
    
    if (selectedValues.length <= 1) {
      return '#2196F3'; // 하나만 선택된 경우 기본 파란색
    }
    
    // 선택된 버튼들의 최소/최대 값
    const minValue = Math.min(...selectedValues);
    const maxValue = Math.max(...selectedValues);
    
    // 현재 버튼이 범위 내에서 차지하는 상대적 위치 (0~1 사이 값)
    const position = (value - minValue) / (maxValue - minValue);
    
    // 차가운 색상(파란색)에서 따뜻한 색상(주황색)으로 그라데이션
    const coolColor = { r: 33, g: 150, b: 243 }; // #2196F3 (파란색)
    const warmColor = { r: 255, g: 87, b: 34 };  // #FF5722 (주황색)
    
    // 위치에 따른 RGB 색상 계산
    const r = Math.round(coolColor.r + position * (warmColor.r - coolColor.r));
    const g = Math.round(coolColor.g + position * (warmColor.g - coolColor.g));
    const b = Math.round(coolColor.b + position * (warmColor.b - coolColor.b));
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getTypeColor = (type: BuildingType) => {
    // 건물 유형에 따른 색상 지정
    const colorMap: Record<string, string> = {
      'A01': '#4CAF50', // 아파트
      'A02': '#2196F3', // 오피스텔
      'C02': '#FF9800', // 빌라
      'C04': '#9C27B0', // 전원주택
      'C06': '#795548', // 한옥주택
      'D01': '#607D8B', // 사무실
      'D02': '#E91E63', // 상가
      'D05': '#673AB7', // 상가주택
    };
    return colorMap[type] || '#9e9e9e';
  };

  const renderFilterContent = () => {
    if (!canUseFilter) {
      return (
        <Box sx={{ p: 2, width: { xs: 'calc(100vw - 32px)', sm: 350 } }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            필터를 사용하려면 확대해야 합니다.
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            원을 누르거나 지도를 확대하세요.
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 2, width: { xs: 'calc(100vw - 32px)', sm: 350 }, maxHeight: '70vh', overflowY: 'auto' }}>
        <Typography variant="h6" sx={{ mb: 2 }}>매물 필터</Typography>

        {/* 거래 유형 필터
        <Box sx={{ mb: 2 }}>
          <InputLabel>거래 유형</InputLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {TRADE_TYPE_OPTIONS.map((type) => (
              <Chip
                key={type}
                label={type}
                onClick={() => handleTradeTypeFilterChange(type)}
                color={tradeTypeFilter.includes(type) ? "primary" : "default"}
              />
            ))}
          </Box>
        </Box> */}

        {/* 건물 유형 필터 */}
        <Box sx={{ mb: 2 }}>
          <InputLabel>매물 유형</InputLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {BUILDING_TYPE_OPTIONS.map((type) => (
              <Chip
                key={type.value}
                label={type.label}
                onClick={() => handleBuildingTypeFilterChange(type.value)}
                color={buildingTypeFilter.includes(type.value) ? "primary" : "default"}
                sx={{
                  bgcolor: buildingTypeFilter.includes(type.value) ? getTypeColor(type.value) : undefined,
                  color: buildingTypeFilter.includes(type.value) ? "white" : undefined
                }}
              />
            ))}
          </Box>
        </Box>
        
        {/* 매매가/전세가/보증금 필터 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">매매가/전세가/보증금</Typography>
            <Button size="small" onClick={() => {
              setMinSalePrice('');
              setMaxSalePrice('');
              setSelectedSalePriceButtons([]);
            }}>초기화</Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {SALE_PRICE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={selectedSalePriceButtons.includes(option.value) ? "contained" : "outlined"}
                size="small"
                onClick={() => handleSalePriceButtonClick(option.value)}
                sx={{ 
                  minWidth: '60px', 
                  height: '36px', 
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  backgroundColor: selectedSalePriceButtons.includes(option.value) 
                    ? getButtonColor(option.value, selectedSalePriceButtons) 
                    : undefined,
                  '&:hover': {
                    backgroundColor: selectedSalePriceButtons.includes(option.value)
                      ? getButtonColor(option.value, selectedSalePriceButtons)
                      : undefined,
                    opacity: selectedSalePriceButtons.includes(option.value) ? 0.9 : undefined
                  },
                  color: selectedSalePriceButtons.includes(option.value) ? 'white' : undefined
                }}
              >
                {option.label}
              </Button>
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              placeholder="최소"
              value={minSalePrice}
              onChange={(e) => handlePriceChange('minSalePrice', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">만원</InputAdornment>,
              }}
              type="number"
              sx={{ flex: 1 }}
            />
            <Typography variant="body1">~</Typography>
            <TextField
              size="small"
              placeholder="최대"
              value={maxSalePrice}
              onChange={(e) => handlePriceChange('maxSalePrice', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">만원</InputAdornment>,
              }}
              type="number"
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>

        {/* 월세 필터 */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">월세</Typography>
            <Button size="small" onClick={() => {
              setMinRentPrice('');
              setMaxRentPrice('');
              setSelectedRentPriceButtons([]);
            }}>초기화</Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {RENT_PRICE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={selectedRentPriceButtons.includes(option.value) ? "contained" : "outlined"}
                size="small"
                onClick={() => handleRentPriceButtonClick(option.value)}
                sx={{ 
                  minWidth: '60px',
                  height: '36px', 
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  textTransform: 'none',
                  backgroundColor: selectedRentPriceButtons.includes(option.value) 
                    ? getButtonColor(option.value, selectedRentPriceButtons) 
                    : undefined,
                  '&:hover': {
                    backgroundColor: selectedRentPriceButtons.includes(option.value)
                      ? getButtonColor(option.value, selectedRentPriceButtons)
                      : undefined,
                    opacity: selectedRentPriceButtons.includes(option.value) ? 0.9 : undefined
                  },
                  color: selectedRentPriceButtons.includes(option.value) ? 'white' : undefined
                }}
              >
                {option.label}
              </Button>
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              size="small"
              placeholder="최소"
              value={minRentPrice}
              onChange={(e) => handlePriceChange('minRentPrice', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">만원</InputAdornment>,
              }}
              type="number"
              sx={{ flex: 1 }}
            />
            <Typography variant="body1">~</Typography>
            <TextField
              size="small"
              placeholder="최대"
              value={maxRentPrice}
              onChange={(e) => handlePriceChange('maxRentPrice', e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">만원</InputAdornment>,
              }}
              type="number"
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleResetFilters} size="small">
            초기화
          </Button>
          <Button onClick={handleClose} variant="contained" size="small">
            적용
          </Button>
        </Box>
      </Box>
    );
  };

  // 독립적인 버튼과 팝오버를 렌더링할지, 외부에서 관리되는 팝오버만 렌더링할지 결정
  if (anchorEl === null && onClose === undefined) {
    return (
      <>
        <Button
          onClick={handleClick}
          startIcon={<FilterListIcon />}
          variant="outlined"
          size="small"
          sx={{ ml: 1 }}
        >
          필터
        </Button>

        <Popover
          open={open}
          anchorEl={internalAnchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {renderFilterContent()}
        </Popover>
      </>
    );
  } else {
    // 외부에서 관리되는 팝오버만 렌더링
    return (
      <Popover
        open={isPopoverOpen}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {renderFilterContent()}
      </Popover>
    );
  }
};

export default ArticleFilter; 