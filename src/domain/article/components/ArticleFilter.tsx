import FilterListIcon from '@mui/icons-material/FilterList';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormGroup,
  Checkbox,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import { BuildingType, TradeType } from '../types/article.types'; // 경로 확인 필요
// import { convertKoreanPriceToNumber } from '../../global/common/utils/priceUtils'; // 경로 및 함수명 확인 필요

// 상수 정의 (기존 파일들 참고)
const TRADE_TYPE_OPTIONS_FOR_DISPLAY: { label: string; value: TradeType | 'ALL_TYPES' }[] = [
  { label: '전체', value: 'ALL_TYPES' },
  { label: '매매', value: 'SALE' },
  { label: '전세', value: 'LEASE' },
  { label: '월세', value: 'RENT' },
];

// src/domain/article/components/filters/BuildingTypeFilter.tsx 참고
const BUILDING_TYPE_OPTIONS: { label: string; value: BuildingType }[] = [
  { label: '아파트', value: 'APT' },
  { label: '오피스텔', value: 'OFFICETEL' },
  { label: '빌라/연립', value: 'VILLA' },
  { label: '단독/다가구', value: 'HOUSE' },
];

export interface ArticleFilterData {
  tradeType: TradeType | null;
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
}

const ArticleFilter: React.FC<ArticleFilterProps> = ({
  initialFilters,
  onFilterChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);

  const [tradeType, setTradeType] = useState<TradeType | null>(initialFilters.tradeType);
  const [selectedBuildingTypes, setSelectedBuildingTypes] = useState<BuildingType[]>(initialFilters.buildingTypeCodes);
  const [minSalePrice, setMinSalePrice] = useState<string>(initialFilters.minSalePrice?.toString() || '');
  const [maxSalePrice, setMaxSalePrice] = useState<string>(initialFilters.maxSalePrice?.toString() || '');
  const [minRentPrice, setMinRentPrice] = useState<string>(initialFilters.minRentPrice?.toString() || '');
  const [maxRentPrice, setMaxRentPrice] = useState<string>(initialFilters.maxRentPrice?.toString() || '');
  const [sortField, setSortField] = useState<string>(initialFilters.sortField);
  const [sortOrder, setSortOrder] = useState<string>(initialFilters.sortOrder);

  useEffect(() => {
    setTradeType(initialFilters.tradeType);
    setSelectedBuildingTypes(initialFilters.buildingTypeCodes);
    setMinSalePrice(initialFilters.minSalePrice?.toString() || '');
    setMaxSalePrice(initialFilters.maxSalePrice?.toString() || '');
    setMinRentPrice(initialFilters.minRentPrice?.toString() || '');
    setMaxRentPrice(initialFilters.maxRentPrice?.toString() || '');
    setSortField(initialFilters.sortField);
    setSortOrder(initialFilters.sortOrder);
  }, [initialFilters]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    // Popover 닫힐 때 필터 적용
    const filtersToApply: Partial<ArticleFilterData> = {
        tradeType,
        buildingTypeCodes: selectedBuildingTypes,
        sortField,
        sortOrder,
    };

    // convertKoreanPriceToNumber와 유사한 함수가 필요. 우선은 숫자로 변환 시도.
    const parsePrice = (val: string) => val === '' ? undefined : parseInt(val, 10);

    if (tradeType === 'SALE') {
        filtersToApply.minSalePrice = parsePrice(minSalePrice);
        filtersToApply.maxSalePrice = parsePrice(maxSalePrice);
        filtersToApply.minRentPrice = undefined;
        filtersToApply.maxRentPrice = undefined;
    } else if (tradeType === 'LEASE' || tradeType === 'RENT') {
        filtersToApply.minRentPrice = parsePrice(minRentPrice);
        filtersToApply.maxRentPrice = parsePrice(maxRentPrice);
        filtersToApply.minSalePrice = undefined;
        filtersToApply.maxSalePrice = undefined;
    } else { // 전체 또는 선택 안함
        filtersToApply.minSalePrice = parsePrice(minSalePrice);
        filtersToApply.maxSalePrice = parsePrice(maxSalePrice);
        filtersToApply.minRentPrice = parsePrice(minRentPrice);
        filtersToApply.maxRentPrice = parsePrice(maxRentPrice);
    }
    onFilterChange(filtersToApply);
  };
  
  const handleResetFilters = () => {
    setTradeType(null);
    setSelectedBuildingTypes([]);
    setMinSalePrice('');
    setMaxSalePrice('');
    setMinRentPrice('');
    setMaxRentPrice('');
    // sortField, sortOrder는 초기값 또는 특정 기본값으로 설정 가능
    // setSortField('date'); 
    // setSortOrder('desc');

    // 리셋 시에도 onFilterChange 호출하여 반영
    onFilterChange({
        tradeType: null,
        buildingTypeCodes: [],
        minSalePrice: undefined,
        maxSalePrice: undefined,
        minRentPrice: undefined,
        maxRentPrice: undefined,
        // sortField: 'date',
        // sortOrder: 'desc',
    });
  };


  const handleTradeTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as TradeType | 'ALL_TYPES';
    setTradeType(value === 'ALL_TYPES' ? null : value);
  };

  const handleBuildingTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    const buildingTypeValue = value as BuildingType;
    let newSelected: BuildingType[];
    if (checked) {
      newSelected = [...selectedBuildingTypes, buildingTypeValue];
    } else {
      newSelected = selectedBuildingTypes.filter(type => type !== buildingTypeValue);
    }
    setSelectedBuildingTypes(newSelected);
  };
  
  const handlePriceChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    // 숫자만 입력 가능하도록 처리하거나, convertKoreanPriceToNumber 같은 유틸 사용
    // 여기서는 우선 문자열 그대로 저장. 적용 시점에 숫자로 변환.
    setter(value);
  };

  const handleSortChange = (event: SelectChangeEvent<string>) => {
    const [field, order] = event.target.value.split(':');
    setSortField(field);
    setSortOrder(order);
  };
  
  const renderPriceInputFields = () => {
    if (tradeType === 'SALE') {
      return (
        <Box sx={{ mb: 2 }}>
          <InputLabel sx={{mb:1}}>매매가 (만원)</InputLabel>
          <Box sx={{ display: 'flex', gap: 1}}>
            <TextField
              size="small"
              placeholder="최소"
              value={minSalePrice}
              onChange={(e) => handlePriceChange(setMinSalePrice, e.target.value)}
              InputProps={{
                // endAdornment: <InputAdornment position="end">만원</InputAdornment>,
              }}
              type="number"
            />
            <TextField
              size="small"
              placeholder="최대"
              value={maxSalePrice}
              onChange={(e) => handlePriceChange(setMaxSalePrice, e.target.value)}
              InputProps={{
                // endAdornment: <InputAdornment position="end">만원</InputAdornment>,
              }}
              type="number"
            />
          </Box>
        </Box>
      );
    }
    if (tradeType === 'LEASE' || tradeType === 'RENT') {
      return (
        <Box sx={{ mb: 2 }}>
          <InputLabel sx={{mb:1}}>{tradeType === 'LEASE' ? '전세 보증금 (만원)' : '보증금/월세 (만원)'}</InputLabel>
          <Box sx={{ display: 'flex', gap: 1}}>
            <TextField
              size="small"
              placeholder="최소"
              value={minRentPrice}
              onChange={(e) => handlePriceChange(setMinRentPrice, e.target.value)}
              InputProps={{
                // endAdornment: <InputAdornment position="end">만원</InputAdornment>,
              }}
              type="number"
            />
            <TextField
              size="small"
              placeholder="최대"
              value={maxRentPrice}
              onChange={(e) => handlePriceChange(setMaxRentPrice, e.target.value)}
              InputProps={{
                // endAdornment: <InputAdornment position="end">만원</InputAdornment>,
              }}
              type="number"
            />
          </Box>
        </Box>
      );
    }
    // 전체 또는 거래 유형 선택 안했을 때 (모든 가격 필드 노출 또는 다른 UX)
    // 여기서는 ArticleListFilter.tsx 처럼 매매가, 임대료 둘 다 보여주도록 함.
    return (
      <>
        <Box sx={{ mb: 2 }}>
          <InputLabel sx={{mb:1}}>매매가 (만원)</InputLabel>
          <Box sx={{ display: 'flex', gap: 1}}>
            <TextField
              size="small"
              placeholder="최소"
              value={minSalePrice}
              onChange={(e) => handlePriceChange(setMinSalePrice, e.target.value)}
              type="number"
            />
            <TextField
              size="small"
              placeholder="최대"
              value={maxSalePrice}
              onChange={(e) => handlePriceChange(setMaxSalePrice, e.target.value)}
              type="number"
            />
          </Box>
        </Box>
        <Box sx={{ mb: 2 }}>
          <InputLabel sx={{mb:1}}>보증금/월세 (만원)</InputLabel>
          <Box sx={{ display: 'flex', gap: 1}}>
            <TextField
              size="small"
              placeholder="최소"
              value={minRentPrice}
              onChange={(e) => handlePriceChange(setMinRentPrice, e.target.value)}
              type="number"
            />
            <TextField
              size="small"
              placeholder="최대"
              value={maxRentPrice}
              onChange={(e) => handlePriceChange(setMaxRentPrice, e.target.value)}
              type="number"
            />
          </Box>
        </Box>
      </>
    );
  };


  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={<FilterListIcon />}
        variant="outlined"
        size="small"
        sx={{ ml: 1 }} // 앱바 버튼 간격 등 필요시 조정
      >
        필터
      </Button>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose} // Popover 닫힐 때 필터 적용하도록 변경
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right', // 기존 ArticleListFilter는 left, 필요시 조정
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right', // 필요시 조정
        }}
      >
        <Box sx={{ p: 2, width: { xs: 'calc(100vw - 32px)', sm: 350 } , maxHeight: '70vh', overflowY: 'auto' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>매물 필터</Typography>

          {/* 거래 유형 필터 */}
          <FormControl component="fieldset" margin="normal" fullWidth>
            <InputLabel component="legend">거래 유형</InputLabel>
            <RadioGroup
              row
              name="tradeType"
              value={tradeType || 'ALL_TYPES'}
              onChange={handleTradeTypeChange}
            >
              {TRADE_TYPE_OPTIONS_FOR_DISPLAY.map((type) => (
                <FormControlLabel
                  key={type.value}
                  value={type.value}
                  control={<Radio size="small"/>}
                  label={type.label}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {/* 건물 유형 필터 */}
          <FormControl component="fieldset" margin="normal" fullWidth>
            <InputLabel component="legend">건물 유형</InputLabel>
            <FormGroup row>
              {BUILDING_TYPE_OPTIONS.map((type) => (
                <FormControlLabel
                  key={type.value}
                  control={
                    <Checkbox
                      checked={selectedBuildingTypes.includes(type.value)}
                      onChange={handleBuildingTypeChange}
                      value={type.value}
                      name={type.label}
                      size="small"
                    />
                  }
                  label={type.label}
                />
              ))}
            </FormGroup>
          </FormControl>
          
          {/* 가격 필터 */}
          {renderPriceInputFields()}

          {/* 정렬 */}
          <FormControl fullWidth size="small" margin="normal">
            <InputLabel>정렬</InputLabel>
            <Select
              value={`${sortField}:${sortOrder}`}
              onChange={handleSortChange}
              label="정렬"
            >
              <MenuItem value="price:asc">가격 낮은순</MenuItem>
              <MenuItem value="price:desc">가격 높은순</MenuItem>
              <MenuItem value="confirmedAt:desc">최신순</MenuItem> {/* 백엔드 필드명 confirmedAt 가정 */}
              <MenuItem value="confirmedAt:asc">오래된순</MenuItem> {/* 백엔드 필드명 confirmedAt 가정 */}
            </Select>
          </FormControl>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button onClick={handleResetFilters} size="small">
              초기화
            </Button>
            <Button onClick={handleClose} variant="contained" size="small">
              적용
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default ArticleFilter; 