import { useState, useCallback } from 'react';

import { getCityOptions, getDistrictOptions } from '../map/utils/regionData';
import { Region } from '../map/utils/regionUtils';
import { RealEstateType, TradeType } from '../types/article';

interface UseArticleFiltersResult {
  // 매물 유형 필터
  typeFilter: RealEstateType[];
  setTypeFilter: (types: RealEstateType[]) => void;
  
  // 거래 유형 필터
  tradeTypeFilter: TradeType[];
  setTradeTypeFilter: (types: TradeType[]) => void;
  
  // 가격 필터
  minSalePrice: number;
  maxSalePrice: number;
  minRentPrice: number;
  maxRentPrice: number;
  handleMinSalePriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMaxSalePriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMinRentPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleMaxRentPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSalePriceButtonClick: (price: number) => void;
  handleRentPriceButtonClick: (price: number) => void;
  handleResetSalePrices: () => void;
  handleResetRentPrices: () => void;
  
  // 정렬 필터
  sortField: string;
  sortOrder: string;
  setSortField: (field: string) => void;
  setSortOrder: (order: string) => void;
  
  // 지역 필터
  selectedCity: string;
  selectedDistrict: string;
  selectedNeighborhood: string[];
  cityOptions: Region[];
  districtOptions: Region[];
  neighborhoodOptions: Region[];
  isRegionFiltered: boolean;
  regionSelectStep: 'city' | 'district' | 'neighborhood';
  setRegionSelectStep: (step: 'city' | 'district' | 'neighborhood') => void;
  handleCitySelect: (value: string) => void;
  handleDistrictSelect: (value: string) => Promise<void>;
  handleNeighborhoodSelect: (value: string) => void;
  handleResetRegion: () => void;
  handleRegionFilterChange: () => void;
  
  // 종합 필터 초기화
  resetAllFilters: () => void;
}

interface UseArticleFiltersProps {
  onFilterChange: () => void;
}

export const useArticleFilters = ({ onFilterChange }: UseArticleFiltersProps): UseArticleFiltersResult => {
  // 필터 상태
  const [typeFilter, setTypeFilter] = useState<RealEstateType[]>([]);
  const [tradeTypeFilter, setTradeTypeFilter] = useState<TradeType[]>([]);
  
  // 가격 필터
  const [minSalePrice, setMinSalePrice] = useState<number>(0);
  const [maxSalePrice, setMaxSalePrice] = useState<number>(0);
  const [minRentPrice, setMinRentPrice] = useState<number>(0);
  const [maxRentPrice, setMaxRentPrice] = useState<number>(0);
  
  // 정렬 필터
  const [sortField, setSortField] = useState<string>("confirmedAt");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  
  // 지역 필터
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<Region[]>(getCityOptions());
  const [districtOptions, setDistrictOptions] = useState<Region[]>([]);
  const [neighborhoodOptions, setNeighborhoodOptions] = useState<Region[]>([]);
  const [isRegionFiltered, setIsRegionFiltered] = useState<boolean>(false);
  const [regionSelectStep, setRegionSelectStep] = useState<'city' | 'district' | 'neighborhood'>('city');

  // 가격 필터 핸들러
  const handleSalePriceButtonClick = useCallback((price: number) => {
    if (minSalePrice === 0) {
      setMinSalePrice(price);
      setMaxSalePrice(price);
    } else {
      if (price < minSalePrice) {
        setMinSalePrice(price);
      } else if (price > maxSalePrice) {
        setMaxSalePrice(price);
      }
    }
  }, [minSalePrice, maxSalePrice]);

  const handleRentPriceButtonClick = useCallback((price: number) => {
    if (minRentPrice === 0) {
      setMinRentPrice(price);
      setMaxRentPrice(price);
    } else {
      if (price < minRentPrice) {
        setMinRentPrice(price);
      } else if (price > maxRentPrice) {
        setMaxRentPrice(price);
      }
    }
  }, [minRentPrice, maxRentPrice]);

  const handleMinSalePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinPrice = e.target.value === '' ? 0 : Number(e.target.value);
    setMinSalePrice(newMinPrice);
    if (!isNaN(newMinPrice) && maxSalePrice > 0) {
      if (newMinPrice > maxSalePrice) {
        setMaxSalePrice(newMinPrice);
      }
    } else if (isNaN(newMinPrice)) {
      setMaxSalePrice(0);
    }
  }, [maxSalePrice]);

  const handleMaxSalePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxPrice = e.target.value === '' ? 0 : Number(e.target.value);
    setMaxSalePrice(newMaxPrice);
    if (!isNaN(newMaxPrice) && minSalePrice > 0) {
      if (newMaxPrice < minSalePrice) {
        setMinSalePrice(newMaxPrice);
      }
    } else if (isNaN(newMaxPrice)) {
      setMaxSalePrice(0);
    }
    setTimeout(() => onFilterChange(), 500);
  }, [minSalePrice, onFilterChange]);

  const handleMinRentPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinPrice = e.target.value === '' ? 0 : Number(e.target.value);
    setMinRentPrice(newMinPrice);
    if (!isNaN(newMinPrice) && maxRentPrice > 0) {
      if (newMinPrice > maxRentPrice) {
        setMaxRentPrice(newMinPrice);
      }
    } else if (isNaN(newMinPrice)) {
      setMaxRentPrice(0);
    }
    setTimeout(() => onFilterChange(), 500);
  }, [maxRentPrice, onFilterChange]);

  const handleMaxRentPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newMaxPrice = e.target.value === '' ? 0 : Number(e.target.value);
    setMaxRentPrice(newMaxPrice);
    if (!isNaN(newMaxPrice) && minRentPrice > 0) {
      if (newMaxPrice < minRentPrice) {
        setMinRentPrice(newMaxPrice);
      }
    } else if (isNaN(newMaxPrice)) {
      setMaxRentPrice(0);
    }
    setTimeout(() => onFilterChange(), 500);
  }, [minRentPrice, onFilterChange]);

  const handleResetSalePrices = useCallback(() => {
    setMinSalePrice(0);
    setMaxSalePrice(0);
    onFilterChange();
  }, [onFilterChange]);

  const handleResetRentPrices = useCallback(() => {
    setMinRentPrice(0);
    setMaxRentPrice(0);
    onFilterChange();
  }, [onFilterChange]);

  // 지역 필터 핸들러
  const handleRegionFilterChange = useCallback(() => {
    onFilterChange();
  }, [onFilterChange]);

  const handleCitySelect = useCallback((value: string) => {
    setSelectedCity(value);
    setSelectedDistrict("");
    setSelectedNeighborhood([]);
    setRegionSelectStep('district');
    
    const districts = getDistrictOptions(value);
    setDistrictOptions(districts);
    
    handleRegionFilterChange();
  }, [handleRegionFilterChange]);

  const handleDistrictSelect = useCallback(async (value: string) => {
    setSelectedDistrict(value);
    setSelectedNeighborhood([]);
    setRegionSelectStep('neighborhood');
    
    const district = districtOptions.find(r => r.cortarName === value);
    if (district?.cortarNo) {
      try {
        // 동/읍/면 데이터 요청 로직 (실제 구현은 API 호출 필요)
        // 간소화를 위해 여기서는 빈 배열로 설정
        setNeighborhoodOptions([]);
      } catch (err) {
        console.error("동/읍/면 목록 로드 실패:", err);
        setNeighborhoodOptions([]);
      }
    } else {
      setNeighborhoodOptions([]);
    }
    
    handleRegionFilterChange();
  }, [districtOptions, handleRegionFilterChange]);

  const handleNeighborhoodSelect = useCallback((value: string) => {
    setSelectedNeighborhood([value]);
    handleRegionFilterChange();
  }, [handleRegionFilterChange]);

  const handleResetRegion = useCallback(() => {
    setSelectedCity("");
    setSelectedDistrict("");
    setSelectedNeighborhood([]);
    setIsRegionFiltered(false);
    setRegionSelectStep('city');
    onFilterChange();
  }, [onFilterChange]);

  // 전체 필터 초기화
  const resetAllFilters = useCallback(() => {
    setTypeFilter([]);
    setTradeTypeFilter([]);
    setMinSalePrice(0);
    setMaxSalePrice(0);
    setMinRentPrice(0);
    setMaxRentPrice(0);
    setSortField("confirmedAt");
    setSortOrder("desc");
    handleResetRegion();
    onFilterChange();
  }, [handleResetRegion, onFilterChange]);

  return {
    typeFilter,
    setTypeFilter,
    tradeTypeFilter,
    setTradeTypeFilter,
    minSalePrice,
    maxSalePrice,
    minRentPrice,
    maxRentPrice,
    handleMinSalePriceChange,
    handleMaxSalePriceChange,
    handleMinRentPriceChange,
    handleMaxRentPriceChange,
    handleSalePriceButtonClick,
    handleRentPriceButtonClick,
    handleResetSalePrices,
    handleResetRentPrices,
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    selectedCity,
    selectedDistrict,
    selectedNeighborhood,
    cityOptions,
    districtOptions,
    neighborhoodOptions,
    isRegionFiltered,
    regionSelectStep,
    setRegionSelectStep,
    handleCitySelect,
    handleDistrictSelect,
    handleNeighborhoodSelect,
    handleResetRegion,
    handleRegionFilterChange,
    resetAllFilters
  };
};
