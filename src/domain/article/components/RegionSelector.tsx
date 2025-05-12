import {
  Box,
  Button,
  Popover,
  Typography
} from '@mui/material';
import React from 'react';

import { Region } from '../map/utils/regionUtils';

interface RegionSelectorProps {
  regionPopoverAnchor: HTMLElement | null;
  isRegionPopoverOpen: boolean;
  onRegionPopoverClose: () => void;
  selectedCity: string;
  selectedDistrict: string;
  selectedNeighborhood: string[];
  cityOptions: Region[];
  districtOptions: Region[];
  neighborhoodOptions: Region[];
  regionSelectStep: 'city' | 'district' | 'neighborhood';
  setRegionSelectStep: (step: 'city' | 'district' | 'neighborhood') => void;
  handleCitySelect: (value: string) => void;
  handleDistrictSelect: (value: string) => Promise<void>;
  handleNeighborhoodSelect: (value: string) => void;
  handleResetRegion: () => void;
}

const RegionSelector: React.FC<RegionSelectorProps> = ({
  regionPopoverAnchor,
  isRegionPopoverOpen,
  onRegionPopoverClose,
  selectedCity,
  selectedDistrict,
  selectedNeighborhood,
  cityOptions,
  districtOptions,
  neighborhoodOptions,
  regionSelectStep,
  setRegionSelectStep,
  handleCitySelect,
  handleDistrictSelect,
  handleNeighborhoodSelect,
  handleResetRegion
}) => {
  return (
    <Popover
      open={isRegionPopoverOpen}
      anchorEl={regionPopoverAnchor}
      onClose={onRegionPopoverClose}
      anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
      transformOrigin={{vertical: 'top', horizontal: 'center'}}
      PaperProps={{style: {width: '400px', maxHeight: '500px'}}}
    >
      <Box sx={{p: 2}}>
        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2}}>
          <Typography variant="h6">지역 선택</Typography>
          <Button size="small" onClick={handleResetRegion} startIcon={<span>↺</span>}>초기화</Button>
        </Box>
        <Box sx={{display: 'flex', borderBottom: '1px solid #eee', mb: 2}}>
          <Button sx={{
            fontWeight: regionSelectStep === 'city' ? 'bold' : 'normal',
            color: regionSelectStep === 'city' ? 'primary.main' : 'text.secondary',
            borderBottom: regionSelectStep === 'city' ? '2px solid #007AFF' : 'none',
            borderRadius: 0,
            mr: 1
          }} onClick={() => setRegionSelectStep('city')}
                  disabled={regionSelectStep === 'city'}>시/도</Button>
          <Typography sx={{color: 'text.secondary', my: 'auto'}}>{'>'}</Typography>
          <Button sx={{
            fontWeight: regionSelectStep === 'district' ? 'bold' : 'normal',
            color: regionSelectStep === 'district' ? 'primary.main' : 'text.secondary',
            borderBottom: regionSelectStep === 'district' ? '2px solid #007AFF' : 'none',
            borderRadius: 0,
            mx: 1
          }} onClick={() => setRegionSelectStep('district')}
                  disabled={!selectedCity || regionSelectStep === 'district'}>시/군/구</Button>
          <Typography sx={{color: 'text.secondary', my: 'auto'}}>{'>'}</Typography>
          <Button sx={{
            fontWeight: regionSelectStep === 'neighborhood' ? 'bold' : 'normal',
            color: regionSelectStep === 'neighborhood' ? 'primary.main' : 'text.secondary',
            borderBottom: regionSelectStep === 'neighborhood' ? '2px solid #007AFF' : 'none',
            borderRadius: 0,
            ml: 1
          }} onClick={() => setRegionSelectStep('neighborhood')}
                  disabled={!selectedDistrict || regionSelectStep === 'neighborhood'}>읍/면/동</Button>
        </Box>
        {regionSelectStep === 'city' && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            maxHeight: '350px',
            overflowY: 'auto',
            p: 1
          }}>
            {cityOptions.map((city) => <Button key={city.id}
                                              variant={selectedCity === city.cortarName ? 'contained' : 'outlined'}
                                              onClick={() => handleCitySelect(city.cortarName)}
                                              sx={{textTransform: 'none'}}>{city.cortarName}</Button>)}
          </Box>
        )}
        {regionSelectStep === 'district' && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            maxHeight: '350px',
            overflowY: 'auto',
            p: 1
          }}>
            {districtOptions.map((district) => <Button key={district.id}
                                                      variant={selectedDistrict === district.cortarName ? 'contained' : 'outlined'}
                                                      onClick={() => handleDistrictSelect(district.cortarName)}
                                                      sx={{textTransform: 'none'}}>{district.cortarName}</Button>)}
          </Box>
        )}
        {regionSelectStep === 'neighborhood' && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
            maxHeight: '350px',
            overflowY: 'auto',
            p: 1
          }}>
            {neighborhoodOptions.length > 0 ? (
              neighborhoodOptions.map((neighborhood) => <Button key={neighborhood.id}
                                                              variant={selectedNeighborhood[0] === neighborhood.cortarName ? 'contained' : 'outlined'}
                                                              onClick={() => handleNeighborhoodSelect(neighborhood.cortarName)}
                                                              sx={{textTransform: 'none'}}>{neighborhood.cortarName}</Button>)
            ) : <Typography variant="body2" sx={{p: 2, gridColumn: '1 / span 2', textAlign: 'center'}}>
                 검색결과가 없습니다.
               </Typography>}
          </Box>
        )}
      </Box>
    </Popover>
  );
};

export default RegionSelector; 