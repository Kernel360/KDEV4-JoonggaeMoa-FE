import FilterListIcon from '@mui/icons-material/FilterList';
import {
    Box,
    Button,
    Chip,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Popover,
    Select,
    SelectChangeEvent,
    TextField
} from "@mui/material";
import React, {useState} from "react";
import {REAL_ESTATE_OPTIONS, RealEstateType, TRADE_TYPE_OPTIONS, TradeType} from "@/domain/article/types/article";
import {getTypeColor} from "@/domain/article/utils/articleDisplay";
import {convertKoreanPriceToNumber} from "@/domain/article/utils/articlePrice";

interface ArticleListFilterProps {
    typeFilter: RealEstateType[];
    tradeTypeFilter: TradeType[];
    minSalePrice: number;
    maxSalePrice: number;
    minRentPrice: number;
    maxRentPrice: number;
    sortField: string;
    sortOrder: string;
    onFilterChange: (filters: {
        typeFilter?: RealEstateType[];
        tradeTypeFilter?: TradeType[];
        minSalePrice?: number;
        maxSalePrice?: number;
        minRentPrice?: number;
        maxRentPrice?: number;
        sortField?: string;
        sortOrder?: string;
    }) => void;
}

const ArticleListFilter: React.FC<ArticleListFilterProps> = ({
                                                                 typeFilter,
                                                                 tradeTypeFilter,
                                                                 minSalePrice,
                                                                 maxSalePrice,
                                                                 minRentPrice,
                                                                 maxRentPrice,
                                                                 sortField,
                                                                 sortOrder,
                                                                 onFilterChange
                                                             }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleTypeFilterChange = (type: RealEstateType) => {
        const newTypeFilter = typeFilter.includes(type)
            ? typeFilter.filter(t => t !== type)
            : [...typeFilter, type];
        onFilterChange({typeFilter: newTypeFilter});
    };

    const handleTradeTypeFilterChange = (type: TradeType) => {
        const newTradeTypeFilter = tradeTypeFilter.includes(type)
            ? tradeTypeFilter.filter(t => t !== type)
            : [...tradeTypeFilter, type];
        onFilterChange({tradeTypeFilter: newTradeTypeFilter});
    };

    const handlePriceChange = (field: string, value: string) => {
        const numericValue = value === '' ? 0 : convertKoreanPriceToNumber(value);
        onFilterChange({[field]: numericValue});
    };

    const handleSortChange = (event: SelectChangeEvent<string>) => {
        const [field, order] = event.target.value.split(':');
        onFilterChange({sortField: field, sortOrder: order});
    };

    return (
        <Box sx={{mb: 2}}>
            <Button
                onClick={handleClick}
                startIcon={<FilterListIcon/>}
                variant="outlined"
                size="small"
            >
                필터
            </Button>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <Box sx={{p: 2, width: 300}}>
                    <Box sx={{mb: 2}}>
                        <InputLabel>매물 유형</InputLabel>
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1}}>
                            {REAL_ESTATE_OPTIONS.map((type) => (
                                <Chip
                                    key={type}
                                    label={type}
                                    onClick={() => handleTypeFilterChange(type)}
                                    color={typeFilter.includes(type) ? "primary" : "default"}
                                    sx={{
                                        bgcolor: typeFilter.includes(type) ? getTypeColor(type) : undefined,
                                        color: typeFilter.includes(type) ? "white" : undefined
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>

                    <Box sx={{mb: 2}}>
                        <InputLabel>거래 유형</InputLabel>
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1}}>
                            {TRADE_TYPE_OPTIONS.map((type) => (
                                <Chip
                                    key={type}
                                    label={type}
                                    onClick={() => handleTradeTypeFilterChange(type)}
                                    color={tradeTypeFilter.includes(type) ? "primary" : "default"}
                                />
                            ))}
                        </Box>
                    </Box>

                    <Box sx={{mb: 2}}>
                        <InputLabel>매매가</InputLabel>
                        <Box sx={{display: 'flex', gap: 1, mt: 1}}>
                            <TextField
                                size="small"
                                placeholder="최소"
                                value={minSalePrice === 0 ? '' : minSalePrice.toString()}
                                onChange={(e) => handlePriceChange('minSalePrice', e.target.value)}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">만원</InputAdornment>,
                                }}
                            />
                            <TextField
                                size="small"
                                placeholder="최대"
                                value={maxSalePrice === 0 ? '' : maxSalePrice.toString()}
                                onChange={(e) => handlePriceChange('maxSalePrice', e.target.value)}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">만원</InputAdornment>,
                                }}
                            />
                        </Box>
                    </Box>

                    <Box sx={{mb: 2}}>
                        <InputLabel>보증금/월세</InputLabel>
                        <Box sx={{display: 'flex', gap: 1, mt: 1}}>
                            <TextField
                                size="small"
                                placeholder="최소"
                                value={minRentPrice === 0 ? '' : minRentPrice.toString()}
                                onChange={(e) => handlePriceChange('minRentPrice', e.target.value)}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">만원</InputAdornment>,
                                }}
                            />
                            <TextField
                                size="small"
                                placeholder="최대"
                                value={maxRentPrice === 0 ? '' : maxRentPrice.toString()}
                                onChange={(e) => handlePriceChange('maxRentPrice', e.target.value)}
                                InputProps={{
                                    endAdornment: <InputAdornment position="end">만원</InputAdornment>,
                                }}
                            />
                        </Box>
                    </Box>

                    <FormControl fullWidth size="small">
                        <InputLabel>정렬</InputLabel>
                        <Select
                            value={`${sortField}:${sortOrder}`}
                            onChange={handleSortChange}
                            label="정렬"
                        >
                            <MenuItem value="price:asc">가격 낮은순</MenuItem>
                            <MenuItem value="price:desc">가격 높은순</MenuItem>
                            <MenuItem value="date:desc">최신순</MenuItem>
                            <MenuItem value="date:asc">오래된순</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </Popover>
        </Box>
    );
};

export default ArticleListFilter; 