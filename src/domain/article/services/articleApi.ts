import apiClient from '@/global/api/services/api';

import { ArticleFilters } from '../pages/ArticleMapPage';
import { BoundingBox, Marker, Cluster, Region, MarkerApiResponse, ClusterApiResponse, Article, ApiResponse, RegionPolygon, RegionPolygonApiResponse, TradeType } from '../types/article.types';
import { ArticleFilterData } from '../components/ArticleFilter';

const geoJsonCache = new Map<string, any>();

export const getRegionBoundaries = async (type: 'dong' | 'gu'): Promise<any> => {
    if (geoJsonCache.has(type)) {
        return geoJsonCache.get(type);
    }

    const url = type === 'dong'
        ? 'https://raw.githubusercontent.com/vuski/admdongkor/master/ver20230101/HangJeongDong_ver20230101.geojson'
        : 'https://raw.githubusercontent.com/southkorea/seoul-maps/master/kostat/2013/json/seoul_municipalities_geo.json';

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch region boundaries: ${response.statusText}`);
    }
    const data = await response.json();
    geoJsonCache.set(type, data);
    return data;
};

export const fetchMarkersAPI = async (
  boundingBox: BoundingBox,
  filters?: ArticleFilters
): Promise<Marker[]> => {
  const { swLat, neLat, swLng, neLng } = boundingBox;
  
  const apiParams: any = { swLat, neLat, swLng, neLng };

  if (filters) {
    if (filters.regionCode) apiParams.regionCode = filters.regionCode;
    if (filters.tradeType) apiParams.tradeType = encodeURIComponent(filters.tradeType);
    if (filters.buildingTypes && filters.buildingTypes.length > 0) {
      apiParams.buildingTypes = filters.buildingTypes.map(type => encodeURIComponent(type)).join(',');
    }
    if (filters.prices) {
      if (filters.prices.salePrice?.min !== undefined) apiParams.minPriceSale = filters.prices.salePrice.min;
      if (filters.prices.salePrice?.max !== undefined) apiParams.maxPriceSale = filters.prices.salePrice.max;
      if (filters.prices.leasePrice?.min !== undefined) apiParams.minLeasePrice = filters.prices.leasePrice.min;
      if (filters.prices.leasePrice?.max !== undefined) apiParams.maxLeasePrice = filters.prices.leasePrice.max;
      if (filters.prices.rentDeposit?.min !== undefined) apiParams.minRentDeposit = filters.prices.rentDeposit.min;
      if (filters.prices.rentDeposit?.max !== undefined) apiParams.maxRentDeposit = filters.prices.rentDeposit.max;
      if (filters.prices.monthlyRent?.min !== undefined) apiParams.minMonthlyRent = filters.prices.monthlyRent.min;
      if (filters.prices.monthlyRent?.max !== undefined) apiParams.maxMonthlyRent = filters.prices.monthlyRent.max;
    }
  }

  try {
    const response = await apiClient.get<MarkerApiResponse>('/api/article/markers', {
      params: apiParams,
    });
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    console.error('Error fetching markers or data is not an array:', response.data?.error);
    return [];
  } catch (error) {
    console.error('Network error fetching markers:', error);
    return [];
  }
};

export const fetchClustersAPI = async (
  boundingBox: BoundingBox,
  zoomLevel: number,
  filters?: ArticleFilters
): Promise<Cluster[]> => {
  const { swLat, neLat, swLng, neLng } = boundingBox;

  const apiParams: any = { swLat, neLat, swLng, neLng, zoomLevel };

  if (filters) {
    if (filters.regionCode) apiParams.regionCode = filters.regionCode;
    if (filters.tradeType) apiParams.tradeType = encodeURIComponent(filters.tradeType);
    if (filters.buildingTypes && filters.buildingTypes.length > 0) {
      apiParams.buildingTypes = filters.buildingTypes.map(type => encodeURIComponent(type)).join(',');
    }
    if (filters.prices) {
      if (filters.prices.salePrice?.min !== undefined) apiParams.minPriceSale = filters.prices.salePrice.min;
      if (filters.prices.salePrice?.max !== undefined) apiParams.maxPriceSale = filters.prices.salePrice.max;
      if (filters.prices.leasePrice?.min !== undefined) apiParams.minLeasePrice = filters.prices.leasePrice.min;
      if (filters.prices.leasePrice?.max !== undefined) apiParams.maxLeasePrice = filters.prices.leasePrice.max;
      if (filters.prices.rentDeposit?.min !== undefined) apiParams.minRentDeposit = filters.prices.rentDeposit.min;
      if (filters.prices.rentDeposit?.max !== undefined) apiParams.maxRentDeposit = filters.prices.rentDeposit.max;
      if (filters.prices.monthlyRent?.min !== undefined) apiParams.minMonthlyRent = filters.prices.monthlyRent.min;
      if (filters.prices.monthlyRent?.max !== undefined) apiParams.maxMonthlyRent = filters.prices.monthlyRent.max;
    }
  }
  
  try {
    const response = await apiClient.get<ClusterApiResponse>('/api/article/clusters', {
      params: apiParams,
    });
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    console.error('Error fetching clusters or data is not an array:', response.data?.error);
    return [];
  } catch (error) {
    console.error('Network error fetching clusters:', error);
    return [];
  }
};

export const fetchRegionsAPI = async (cortarNoPrefix?: string): Promise<Region[]> => {
  // cortarNo의 앞 5자리만 사용하도록 수정
  const code = cortarNoPrefix ? cortarNoPrefix.substring(0, 5) : '';
  const endpoint = code ? `/api/regions/${code}` : '/api/regions';
  
  try {
    const response = await apiClient.get<ApiResponse<Region[]>>(endpoint);
    console.log('Region API 응답:', response.data, '요청 코드:', code); // 디버깅용 로그
    
    // 응답 데이터가 없거나 비어있는 경우 테스트 데이터 반환
    if (!response.data || !response.data.data || response.data.data.length === 0) {
      console.warn('API에서 지역 데이터를 받아오지 못했습니다. 테스트 데이터를 사용합니다.');
      
      // 용산구(11170) 샘플 데이터
      if (code === '11170') {
        return [
          { cortarNo: '1117010400', cortarName: '갈월동', cortarType: 'sec', centerLat: 37.5425, centerLon: 126.9719 },
          { cortarNo: '1117010500', cortarName: '남영동', cortarType: 'sec', centerLat: 37.545742, centerLon: 126.974775 },
          { cortarNo: '1117012000', cortarName: '도원동', cortarType: 'sec', centerLat: 37.5388, centerLon: 126.9561 },
          { cortarNo: '1117013000', cortarName: '원효로1동', cortarType: 'sec', centerLat: 37.5315, centerLon: 126.9634 },
          { cortarNo: '1117014000', cortarName: '원효로2동', cortarType: 'sec', centerLat: 37.5276, centerLon: 126.9685 },
          { cortarNo: '1117015000', cortarName: '효창동', cortarType: 'sec', centerLat: 37.5392, centerLon: 126.9601 },
          { cortarNo: '1117016000', cortarName: '용문동', cortarType: 'sec', centerLat: 37.5418, centerLon: 126.9647 },
          { cortarNo: '1117017000', cortarName: '이촌1동', cortarType: 'sec', centerLat: 37.5236, centerLon: 126.9725 },
          { cortarNo: '1117018000', cortarName: '이촌2동', cortarType: 'sec', centerLat: 37.5188, centerLon: 126.9691 },
          { cortarNo: '1117019000', cortarName: '이태원1동', cortarType: 'sec', centerLat: 37.5342, centerLon: 126.9992 },
          { cortarNo: '1117020000', cortarName: '이태원2동', cortarType: 'sec', centerLat: 37.5381, centerLon: 126.9910 },
          { cortarNo: '1117021000', cortarName: '한남동', cortarType: 'sec', centerLat: 37.5362, centerLon: 127.0063 },
          { cortarNo: '1117022000', cortarName: '서빙고동', cortarType: 'sec', centerLat: 37.5172, centerLon: 126.9898 },
          { cortarNo: '1117023000', cortarName: '보광동', cortarType: 'sec', centerLat: 37.5271, centerLon: 127.0011 },
          { cortarNo: '1117024000', cortarName: '청파동', cortarType: 'sec', centerLat: 37.5462, centerLon: 126.9691 },
          { cortarNo: '1117025000', cortarName: '후암동', cortarType: 'sec', centerLat: 37.5505, centerLon: 126.9809 }
        ];
      }
      
      // 송파구(11710) 샘플 데이터
      if (code === '11710') {
        return [
          { cortarNo: '1171010100', cortarName: '잠실본동', cortarType: 'sec', centerLat: 37.5062, centerLon: 127.0844 },
          { cortarNo: '1171010200', cortarName: '잠실2동', cortarType: 'sec', centerLat: 37.5130, centerLon: 127.0857 },
          { cortarNo: '1171010300', cortarName: '잠실3동', cortarType: 'sec', centerLat: 37.5135, centerLon: 127.0970 },
          { cortarNo: '1171010400', cortarName: '잠실4동', cortarType: 'sec', centerLat: 37.5201, centerLon: 127.0962 },
          { cortarNo: '1171010500', cortarName: '잠실7동', cortarType: 'sec', centerLat: 37.5171, centerLon: 127.1038 },
          { cortarNo: '1171010600', cortarName: '잠실6동', cortarType: 'sec', centerLat: 37.5094, centerLon: 127.1092 },
          { cortarNo: '1171010700', cortarName: '잠실5동', cortarType: 'sec', centerLat: 37.5111, centerLon: 127.0962 },
          { cortarNo: '1171020000', cortarName: '삼전동', cortarType: 'sec', centerLat: 37.5037, centerLon: 127.0911 },
          { cortarNo: '1171030000', cortarName: '석촌동', cortarType: 'sec', centerLat: 37.5023, centerLon: 127.1008 },
          { cortarNo: '1171040000', cortarName: '송파1동', cortarType: 'sec', centerLat: 37.5012, centerLon: 127.1120 },
          { cortarNo: '1171050000', cortarName: '방이1동', cortarType: 'sec', centerLat: 37.5143, centerLon: 127.1131 },
          { cortarNo: '1171070000', cortarName: '오금동', cortarType: 'sec', centerLat: 37.5022, centerLon: 127.1301 },
          { cortarNo: '1171080000', cortarName: '풍납1동', cortarType: 'sec', centerLat: 37.5273, centerLon: 127.1179 },
          { cortarNo: '1171100000', cortarName: '마천1동', cortarType: 'sec', centerLat: 37.4984, centerLon: 127.1520 },
          { cortarNo: '1171120000', cortarName: '가락본동', cortarType: 'sec', centerLat: 37.4954, centerLon: 127.1209 },
          { cortarNo: '1171140000', cortarName: '문정1동', cortarType: 'sec', centerLat: 37.4876, centerLon: 127.1255 },
          { cortarNo: '1171160000', cortarName: '장지동', cortarType: 'sec', centerLat: 37.4779, centerLon: 127.1337 },
          { cortarNo: '1171170000', cortarName: '위례동', cortarType: 'sec', centerLat: 37.4702, centerLon: 127.1422 }
        ];
      }
      
      // 일반적인 경우 빈 배열 반환
      return [];
    }
    
    return response.data.data;
  } catch (error) {
    console.error('지역 정보를 불러오는 중 오류가 발생했습니다.', error);
    // 특정 에러 코드나 상황에 따라 사용자 친화적인 오류 메시지를 기록
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        console.error('서버 응답 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.');
      } else if (error.message.includes('Network Error')) {
        console.error('네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.');
      }
    }
    return [];
  }
};

export const fetchArticleDetail = async (id: number): Promise<Article> => {
  try {
    const response = await apiClient.get(`/api/article/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('매물 상세정보를 불러오는데 실패했습니다.', error);
    throw error;
  }
};

function getCenterOfFeature(feature: any): { lat: number; lng: number } {
    let coordinates: number[][] = [];
    if (feature.geometry.type === 'Polygon') {
        coordinates = feature.geometry.coordinates[0];
    } else if (feature.geometry.type === 'MultiPolygon') {
        coordinates = feature.geometry.coordinates[0][0];
    }
    if (coordinates.length === 0) return { lat: 0, lng: 0 };
    let sumLat = 0;
    let sumLng = 0;
    coordinates.forEach(coord => {
        sumLng += coord[0];
        sumLat += coord[1];
    });
    return { lat: sumLat / coordinates.length, lng: sumLng / coordinates.length };
}

export const fetchRegionPolygonsAPI = async (
  geoJsonDataInput: any, // 미리 로드된 GeoJSON 데이터
  boundaryType: 'dong' | 'gu' // 'dong' 또는 'gu'
): Promise<RegionPolygon[]> => {
  const regionTypeApi: 'DONG' | 'SIGUNGU' = boundaryType === 'dong' ? 'DONG' : 'SIGUNGU';

  try {
    if (!geoJsonDataInput || !geoJsonDataInput.features || !Array.isArray(geoJsonDataInput.features)) {
      console.error('Invalid GeoJSON data input:', geoJsonDataInput);
      return [];
    }

    const regionPolygons: RegionPolygon[] = geoJsonDataInput.features.map((feature: any, index: number) => {
      const properties = feature.properties;
      const geometry = feature.geometry;
      const center = getCenterOfFeature(feature);
      let regionName = 'Unknown Region';

      if (boundaryType === 'dong') {
        regionName = properties.adm_nm || properties.temp || `동 ${index + 1}`;
      } else if (boundaryType === 'gu') {
        regionName = properties.name || properties.SIG_KOR_NM || `구 ${index + 1}`;
      }
      
      const multiPolygonCoordinates = geometry.type === 'Polygon' 
        ? [geometry.coordinates] 
        : geometry.coordinates;

      return {
        regionId: properties.adm_cd || properties.SIG_CD || `${regionTypeApi}_${index}`,
        regionName: regionName,
        regionType: regionTypeApi,
        multiPolygon: multiPolygonCoordinates,
        centerLat: center.lat,
        centerLng: center.lng,
      };
    }).filter((polygon: RegionPolygon) => {
        return polygon.multiPolygon && polygon.multiPolygon.length > 0 &&
               polygon.multiPolygon[0] && polygon.multiPolygon[0].length > 0 &&
               polygon.multiPolygon[0][0] && polygon.multiPolygon[0][0].length > 0;
    });
    
    return regionPolygons;

  } catch (error) {
    console.error(`Error transforming ${boundaryType} boundaries:`, error);
    return [];
  }
};

function generateMockRegionPolygons(
  boundingBox: BoundingBox, 
  regionType: 'SIDO' | 'SIGUNGU' | 'DONG',
  zoomLevel: number
): RegionPolygon[] {
  const { swLat, neLat, swLng, neLng } = boundingBox;
  const gridSize = regionType === 'SIDO' ? 2 : 
                  regionType === 'SIGUNGU' ? 4 : 8;
  const result: RegionPolygon[] = [];
  const latStep = (neLat - swLat) / gridSize;
  const lngStep = (neLng - swLng) / gridSize;
  const namePrefix = regionType === 'SIDO' ? '시/도' : 
                    regionType === 'SIGUNGU' ? '구' : '동';
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const regionLat = swLat + latStep * i + latStep / 2;
      const regionLng = swLng + lngStep * j + lngStep / 2;
      const jitter = 0.001 * Math.random();
      const multiPolygon: number[][][][] = [
        [
          [
            [regionLng - lngStep/2 + jitter, regionLat - latStep/2 + jitter],
            [regionLng + lngStep/2 + jitter, regionLat - latStep/2 + jitter],
            [regionLng + lngStep/2 + jitter, regionLat + latStep/2 + jitter],
            [regionLng - lngStep/2 + jitter, regionLat + latStep/2 + jitter],
            [regionLng - lngStep/2 + jitter, regionLat - latStep/2 + jitter]
          ]
        ]
      ];
      result.push({
        regionId: `${regionType}_${i}_${j}`,
        regionName: `${namePrefix} ${i+1}-${j+1} (Zoom: ${zoomLevel})`,
        regionType,
        multiPolygon,
        centerLat: regionLat,
        centerLng: regionLng,
        count: Math.floor(Math.random() * 50) + 1
      });
    }
  }
  return result;
}

export const fetchFilteredMarkersAPI = async (
  filterParams: {
    swLat: number;
    swLng: number;
    neLat: number;
    neLng: number;
    tradeTypes?: TradeType[];
    buildingTypeCodes?: string;
    minSalePrice?: number;
    maxSalePrice?: number;
    minRentPrice?: number;
    maxRentPrice?: number;
  }
): Promise<Marker[]> => {
  // API 파라미터 구성
  const apiParams: any = {
    swLat: filterParams.swLat,
    swLng: filterParams.swLng,
    neLat: filterParams.neLat,
    neLng: filterParams.neLng,
  };

if (filterParams.tradeTypes && filterParams.tradeTypes.length > 0) {
  apiParams.tradeType = filterParams.tradeTypes.join(',');
}

if (filterParams.buildingTypeCodes) {
  apiParams.buildingTypeCodes = filterParams.buildingTypeCodes;
}

  if (filterParams.minSalePrice !== undefined) {
    apiParams.minSalePrice = filterParams.minSalePrice;
  }
  if (filterParams.maxSalePrice !== undefined) {
    apiParams.maxSalePrice = filterParams.maxSalePrice;
  }
  if (filterParams.minRentPrice !== undefined) {
    apiParams.minRentPrice = filterParams.minRentPrice;
  }
  if (filterParams.maxRentPrice !== undefined) {
    apiParams.maxRentPrice = filterParams.maxRentPrice;
  }

  try {
    // 새로운 엔드포인트 사용 - paramsSerializer는 필요 없음 (axios가 자동으로 처리)
    const response = await apiClient.get<MarkerApiResponse>('/api/article/markers/filter', {
      params: apiParams,
    });
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    console.error('Error fetching filtered markers or data is not an array:', response.data?.error);
    return [];
  } catch (error) {
    console.error('Network error fetching filtered markers:', error);
    return [];
  }
}; 