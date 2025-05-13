import {
  Box,
  Button,
  Chip,
  Drawer,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Autocomplete
} from "@mui/material";
import React from "react";

import { REAL_ESTATE_OPTIONS, TRADE_TYPE_OPTIONS } from '../constants/articleConstants';
import { RealEstateType, TradeType } from '../types/article';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  drawerWidth: number;
  // 필터 상태
  typeFilter: RealEstateType[];
  tradeTypeFilter: TradeType[];
  minSalePrice: number;
  maxSalePrice: number;
  minRentPrice: number;
  maxRentPrice: number;
  sortField: string;
  sortOrder: string;
  // 필터 핸들러
  setTypeFilter: (types: RealEstateType[]) => void;
  setTradeTypeFilter: (types: TradeType[]) => void;
  handleMinSalePriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMaxSalePriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMinRentPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMaxRentPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSalePriceButtonClick: (price: number) => void;
  handleRentPriceButtonClick: (price: number) => void;
  handleResetSalePrices: () => void;
  handleResetRentPrices: () => void;
  setSortField: (field: string) => void;
  setSortOrder: (order: string) => void;
  resetAllFilters: () => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  drawerWidth,
  typeFilter,
  tradeTypeFilter,
  minSalePrice,
  maxSalePrice,
  minRentPrice,
  maxRentPrice,
  sortField,
  sortOrder,
  setTypeFilter,
  setTradeTypeFilter,
  handleMinSalePriceChange,
  handleMaxSalePriceChange,
  handleMinRentPriceChange,
  handleMaxRentPriceChange,
  handleSalePriceButtonClick,
  handleRentPriceButtonClick,
  handleResetSalePrices,
  handleResetRentPrices,
  setSortField,
  setSortOrder,
  resetAllFilters
}) => {
  const ALLOWED_SORT_FIELDS = ["id", "priceSale", "confirmedAt"];
  const ALLOWED_SORT_DIRECTIONS = ["asc", "desc"];

  const handleSortChange = (value: string) => {
    const [field, order] = value.split(',');
    const safeField = ALLOWED_SORT_FIELDS.includes(field) ? field : "confirmedAt";
    const safeOrder = ALLOWED_SORT_DIRECTIONS.includes(order?.toLowerCase()) ? order : "desc";
    setSortField(safeField);
    setSortOrder(safeOrder);
  };

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      sx={{'& .MuiDrawer-paper': {width: drawerWidth, padding: 2}}}
    >
      <Box sx={{p: 2}}>
        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2}}>
          <Typography variant="h6" gutterBottom>필터</Typography>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={resetAllFilters}
            startIcon={<span>↺</span>}
          >
            초기화
          </Button>
        </Box>
        <FormControl fullWidth margin="normal">
          <InputLabel id="sort-field-label">정렬 기준</InputLabel>
          <Select
            labelId="sort-field-label"
            id="sort-field-select"
            value={`${sortField},${sortOrder}`}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            <MenuItem value="confirmedAt,desc">최신순 - 매물확인일</MenuItem>
            <MenuItem value="confirmedAt,asc">오래된순 - 매물확인일</MenuItem>
            <MenuItem value="id,desc">최신순 - 매물등록일</MenuItem>
            <MenuItem value="id,asc">오래된순 - 매물등록일</MenuItem>
            <MenuItem value="priceSale,asc">금액낮은순 - 매매가/보증금</MenuItem>
            <MenuItem value="priceSale,desc">금액높은순 - 매매가/보증금</MenuItem>
            <MenuItem value="priceRent,asc">금액낮은순 - 월세</MenuItem>
            <MenuItem value="priceRent,desc">금액높은순 - 월세</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <Autocomplete<RealEstateType, true>
            multiple
            options={REAL_ESTATE_OPTIONS}
            value={typeFilter}
            onChange={(_, newValue) => {
              setTypeFilter(newValue);
            }}
            getOptionLabel={(option) => option}
            isOptionEqualToValue={(option, value) => option === value}
            renderInput={(params) => <TextField {...params} label="매물 유형"/>}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const tagProps = getTagProps({index});
                return (
                  <Chip
                    key={`${option}-${index}`}
                    label={option}
                    size="small"
                    {...Object.fromEntries(
                      Object.entries(tagProps).filter(([k]) => k !== 'key')
                    )}
                  />
                );
              })
            }
          />
        </FormControl>
        <FormControl fullWidth margin="normal">
          <Autocomplete<TradeType, true>
            multiple
            options={TRADE_TYPE_OPTIONS}
            value={tradeTypeFilter}
            onChange={(_, newValue) => {
              setTradeTypeFilter(newValue);
            }}
            getOptionLabel={(option) => option}
            isOptionEqualToValue={(option, value) => option === value}
            renderInput={(params) => <TextField {...params} label="거래 유형"/>}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const tagProps = getTagProps({index});
                return (
                  <Chip
                    key={`${option}-${index}`}
                    label={option}
                    size="small"
                    {...Object.fromEntries(
                      Object.entries(tagProps).filter(([k]) => k !== 'key')
                    )}
                  />
                );
              })
            }
          />
        </FormControl>

        <Box sx={{mt: 2}}>
          <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>매매가/전세가/보증금</Typography>
            <Button size="small" variant="text" onClick={handleResetSalePrices}>초기화</Button>
          </Box>
          <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
            {[5000, 6000, 7000, 8000, 9000, 10000, 20000, 30000, 40000, 50000, 60000, 70000, 80000, 90000, 100000].map((price) => {
              // 버튼 색상 로직
              let buttonColor = "primary";
              let buttonVariant = "outlined";
              let buttonStyle: { backgroundColor?: string; color?: string } = {};

              if (minSalePrice > 0 && maxSalePrice > 0 && minSalePrice < maxSalePrice) {
                // 최소가격과 최대가격이 모두 설정되고 서로 다른 경우
                if (price === minSalePrice) {
                  // 최소 가격 버튼
                  buttonVariant = "contained";
                  buttonColor = "primary";
                  buttonStyle = {backgroundColor: '#007AFF', color: 'white'};
                } else if (price === maxSalePrice) {
                  // 최대 가격 버튼
                  buttonVariant = "contained";
                  buttonColor = "secondary";
                  buttonStyle = {backgroundColor: '#FF5722', color: 'white'};
                } else if (price > minSalePrice && price < maxSalePrice) {
                  // 범위 내 버튼 (그라데이션 적용)
                  buttonVariant = "contained";

                  // 그라데이션 계산 (0~1 사이의 값)
                  const range = maxSalePrice - minSalePrice;
                  const position = (price - minSalePrice) / range;

                  // 시작 색상 (파란색 #007AFF)의 RGB 값
                  const startRed = 0;
                  const startGreen = 122;
                  const startBlue = 255;

                  // 종료 색상 (주황색 #FF5722)의 RGB 값
                  const endRed = 255;
                  const endGreen = 87;
                  const endBlue = 34;

                  // 두 색상 사이의 그라데이션 계산
                  const red = Math.round(startRed + (endRed - startRed) * position);
                  const green = Math.round(startGreen + (endGreen - startGreen) * position);
                  const blue = Math.round(startBlue + (endBlue - startBlue) * position);

                  // 색상 코드로 변환
                  const gradientColor = `rgb(${red}, ${green}, ${blue})`;

                  buttonStyle = {backgroundColor: gradientColor, color: 'white'};
                }
              } else if (price === minSalePrice && minSalePrice > 0) {
                // 최소 가격만 설정된 경우
                buttonVariant = "contained";
                buttonColor = "primary";
                buttonStyle = {backgroundColor: '#007AFF', color: 'white'};
              } else if (price === maxSalePrice && maxSalePrice > 0) {
                // 최대 가격만 설정된 경우
                buttonVariant = "contained";
                buttonColor = "secondary";
                buttonStyle = {backgroundColor: '#FF5722', color: 'white'};
              }

              return (
                <Button
                  key={`sale-${price}`}
                  variant={buttonVariant as "text" | "outlined" | "contained"}
                  color={buttonColor as "primary" | "secondary"}
                  size="small"
                  onClick={() => handleSalePriceButtonClick(price)}
                  sx={{
                    minWidth: '60px',
                    height: '32px',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    ...buttonStyle,
                    '&:hover': {
                      backgroundColor: buttonVariant === "contained"
                        ? buttonStyle.backgroundColor
                        : undefined,
                      opacity: buttonVariant === "contained" ? 0.9 : undefined
                    }
                  }}
                >
                  {price >= 10000 ? `${Math.floor(price / 10000)}억${price % 10000 > 0 ? ` ${Math.floor((price % 10000) / 1000)}천` : ''}` : `${Math.floor(price / 1000)}천`}
                </Button>
              );
            })}
          </Box>
          <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 3}}>
            <TextField size="small" placeholder="최소" value={minSalePrice || ''}
                      onChange={handleMinSalePriceChange} sx={{width: '120px'}}
                      InputProps={{endAdornment: <InputAdornment position="end">만원</InputAdornment>}}/>
            <Typography>~</Typography>
            <TextField size="small" placeholder="최대" value={maxSalePrice || ''}
                      onChange={handleMaxSalePriceChange} sx={{width: '120px'}}
                      InputProps={{endAdornment: <InputAdornment position="end">만원</InputAdornment>}}/>
          </Box>

          <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
            <Typography variant="subtitle1" sx={{fontWeight: 'bold'}}>월세</Typography>
            <Button size="small" variant="text" onClick={handleResetRentPrices}>초기화</Button>
          </Box>
          <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2}}>
            {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200].map((price) => {
              // 버튼 색상 로직
              let buttonColor = "primary";
              let buttonVariant = "outlined";
              let buttonStyle: { backgroundColor?: string; color?: string } = {};

              if (minRentPrice > 0 && maxRentPrice > 0 && minRentPrice < maxRentPrice) {
                // 최소가격과 최대가격이 모두 설정되고 서로 다른 경우
                if (price === minRentPrice) {
                  // 최소 가격 버튼
                  buttonVariant = "contained";
                  buttonColor = "primary";
                  buttonStyle = {backgroundColor: '#007AFF', color: 'white'};
                } else if (price === maxRentPrice) {
                  // 최대 가격 버튼
                  buttonVariant = "contained";
                  buttonColor = "secondary";
                  buttonStyle = {backgroundColor: '#FF5722', color: 'white'};
                } else if (price > minRentPrice && price < maxRentPrice) {
                  // 범위 내 버튼 (그라데이션 적용)
                  buttonVariant = "contained";

                  // 그라데이션 계산 (0~1 사이의 값)
                  const range = maxRentPrice - minRentPrice;
                  const position = (price - minRentPrice) / range;

                  // 시작 색상 (파란색 #007AFF)의 RGB 값
                  const startRed = 0;
                  const startGreen = 122;
                  const startBlue = 255;

                  // 종료 색상 (주황색 #FF5722)의 RGB 값
                  const endRed = 255;
                  const endGreen = 87;
                  const endBlue = 34;

                  // 두 색상 사이의 그라데이션 계산
                  const red = Math.round(startRed + (endRed - startRed) * position);
                  const green = Math.round(startGreen + (endGreen - startGreen) * position);
                  const blue = Math.round(startBlue + (endBlue - startBlue) * position);

                  // 색상 코드로 변환
                  const gradientColor = `rgb(${red}, ${green}, ${blue})`;

                  buttonStyle = {backgroundColor: gradientColor, color: 'white'};
                }
              } else if (price === minRentPrice && minRentPrice > 0) {
                // 최소 가격만 설정된 경우
                buttonVariant = "contained";
                buttonColor = "primary";
                buttonStyle = {backgroundColor: '#007AFF', color: 'white'};
              } else if (price === maxRentPrice && maxRentPrice > 0) {
                // 최대 가격만 설정된 경우
                buttonVariant = "contained";
                buttonColor = "secondary";
                buttonStyle = {backgroundColor: '#FF5722', color: 'white'};
              }

              return (
                <Button
                  key={`rent-${price}`}
                  variant={buttonVariant as "text" | "outlined" | "contained"}
                  color={buttonColor as "primary" | "secondary"}
                  size="small"
                  onClick={() => handleRentPriceButtonClick(price)}
                  sx={{
                    minWidth: '60px',
                    height: '32px',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    ...buttonStyle,
                    '&:hover': {
                      backgroundColor: buttonVariant === "contained"
                        ? buttonStyle.backgroundColor
                        : undefined,
                      opacity: buttonVariant === "contained" ? 0.9 : undefined
                    }
                  }}
                >
                  {price >= 100 ? `${price / 100}백` : `${price}`}만원
                </Button>
              );
            })}
          </Box>
          <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 3}}>
            <TextField size="small" placeholder="최소" value={minRentPrice || ''}
                      onChange={handleMinRentPriceChange} sx={{width: '120px'}}
                      InputProps={{endAdornment: <InputAdornment position="end">만원</InputAdornment>}}/>
            <Typography>~</Typography>
            <TextField size="small" placeholder="최대" value={maxRentPrice || ''}
                      onChange={handleMaxRentPriceChange} sx={{width: '120px'}}
                      InputProps={{endAdornment: <InputAdornment position="end">만원</InputAdornment>}}/>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
};

export default FilterDrawer; 