import React, { useEffect } from 'react';
import { Box, Chip, FormControl, InputLabel, MenuItem, Select, CircularProgress } from '@mui/material';
import { Region, filterCities, filterDistricts, filterNeighborhoods } from '../utils/regionUtils';

interface RegionSelectorProps {
    regions: Region[];
    selectedCity: string;
    selectedDistrict: string;
    selectedNeighborhood: string[];
    onCityChange: (value: string) => void;
    onDistrictChange: (value: string) => void;
    onNeighborhoodChange: (value: string[]) => void;
}

/**
 * 시/도, 구/군, 동/읍/면 단위로 계층적으로 지역을 선택하는 컴포넌트
 */
const RegionSelector: React.FC<RegionSelectorProps> = ({
    regions,
    selectedCity,
    selectedDistrict,
    selectedNeighborhood,
    onCityChange,
    onDistrictChange,
    onNeighborhoodChange
}) => {
    // 디버깅: regions가 로드되었는지 확인
    useEffect(() => {
        console.log('RegionSelector - regions loaded:', regions?.length || 0);
        if (regions && regions.length > 0) {
            // cortarNo 패턴 분석
            const cortarNoPatterns: Record<string, number> = {};
            regions.forEach(region => {
                if (region.cortarNo) {
                    const pattern = region.cortarNo.replace(/[0-9]/g, '#');
                    cortarNoPatterns[pattern] = (cortarNoPatterns[pattern] || 0) + 1;
                }
            });
            console.log('cortarNo patterns:', cortarNoPatterns);
        }
    }, [regions]);

    // 시/도 목록
    const cities = React.useMemo(() => {
        console.log('Recalculating cities...');
        const result = filterCities(regions);
        console.log('Cities result:', result);
        return result;
    }, [regions]);

    // 구/군 목록 (선택된 시/도에 따라 필터링)
    const districts = React.useMemo(() => {
        console.log('Recalculating districts for city:', selectedCity);
        const result = filterDistricts(regions, selectedCity);
        console.log('Districts result:', result);
        return result;
    }, [regions, selectedCity]);

    // 동/읍/면 목록 (선택된 구/군에 따라 필터링)
    const neighborhoods = React.useMemo(() => {
        console.log('Recalculating neighborhoods...');
        const result = filterNeighborhoods(regions, selectedCity, selectedDistrict);
        console.log('Neighborhoods result:', result);
        return result;
    }, [regions, selectedCity, selectedDistrict]);

    // 로딩 상태
    const [districtsLoading, setDistrictsLoading] = React.useState(false);
    const [neighborhoodsLoading, setNeighborhoodsLoading] = React.useState(false);

    // 선택 변경시 로딩 상태 처리
    useEffect(() => {
        if (selectedCity) {
            setDistrictsLoading(true);
            // 약간의 지연 후 로딩 상태 해제 (데이터가 바로 준비되도 UX를 위해)
            setTimeout(() => setDistrictsLoading(false), 500);
        }
    }, [selectedCity]);

    useEffect(() => {
        if (selectedDistrict) {
            setNeighborhoodsLoading(true);
            setTimeout(() => setNeighborhoodsLoading(false), 500);
        }
    }, [selectedDistrict]);

    return (
        <>
            <FormControl fullWidth margin="normal">
                <InputLabel id="city-select-label">시/도 선택</InputLabel>
                <Select
                    labelId="city-select-label"
                    id="city-select"
                    value={selectedCity}
                    onChange={(e) => {
                        const cityValue = e.target.value as string;
                        console.log('City selected:', cityValue);
                        onCityChange(cityValue);
                        onDistrictChange(''); // 시/도가 변경되면 구/군 초기화
                        onNeighborhoodChange([]); // 동/읍/면도 초기화
                    }}
                >
                    <MenuItem value="">
                        <em>선택 안함</em>
                    </MenuItem>
                    {cities.map((city) => (
                        <MenuItem key={city} value={city}>
                            {city}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {selectedCity && (
                <FormControl fullWidth margin="normal">
                    <InputLabel id="district-select-label">
                        구/군 선택 {districtsLoading && <CircularProgress size={20} sx={{ ml: 1 }} />}
                    </InputLabel>
                    <Select
                        labelId="district-select-label"
                        id="district-select"
                        value={selectedDistrict}
                        disabled={districtsLoading}
                        onChange={(e) => {
                            const districtValue = e.target.value as string;
                            console.log('District selected:', districtValue);
                            onDistrictChange(districtValue);
                            onNeighborhoodChange([]); // 구/군이 변경되면 동/읍/면 초기화
                        }}
                    >
                        <MenuItem value="">
                            <em>선택 안함</em>
                        </MenuItem>
                        {districts.length === 0 && !districtsLoading && (
                            <MenuItem disabled>
                                <em>구/군 정보가 없습니다</em>
                            </MenuItem>
                        )}
                        {districts.map((district) => (
                            <MenuItem key={district} value={district}>
                                {district}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}

            {selectedCity && selectedDistrict && (
                <FormControl fullWidth margin="normal">
                    <InputLabel id="neighborhood-select-label">
                        동/읍/면 선택 {neighborhoodsLoading && <CircularProgress size={20} sx={{ ml: 1 }} />}
                    </InputLabel>
                    <Select
                        labelId="neighborhood-select-label"
                        id="neighborhood-select"
                        multiple
                        value={selectedNeighborhood}
                        disabled={neighborhoodsLoading}
                        onChange={(e) => onNeighborhoodChange(e.target.value as string[])}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                    <Chip key={value} label={value} />
                                ))}
                            </Box>
                        )}
                    >
                        {neighborhoods.length === 0 && !neighborhoodsLoading && (
                            <MenuItem disabled>
                                <em>동/읍/면 정보가 없습니다</em>
                            </MenuItem>
                        )}
                        {neighborhoods.map((neighborhood) => (
                            <MenuItem key={neighborhood} value={neighborhood}>
                                {neighborhood}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </>
    );
};

export default RegionSelector; 