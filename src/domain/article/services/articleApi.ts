import apiClient from '@/global/api/services/api';

import { ArticleFilters } from '../pages/ArticleMapPage';
import { BoundingBox, Marker, Cluster, Region, MarkerApiResponse, ClusterApiResponse, Article, ApiResponse, RegionPolygon, RegionPolygonApiResponse } from '../types/article.types';
import { ArticleFilterData } from '../components/ArticleFilter';

const geoJsonCache = new Map<string, any>();

export const getRegionBoundaries = async (type: 'dong' | 'gu'): Promise<any> => {
    if (geoJsonCache.has(type)) {
        console.log(`행정구역 경계 데이터 (${type}) 캐시에서 반환`);
        return geoJsonCache.get(type);
    }

    const url = type === 'dong'
        ? 'https://raw.githubusercontent.com/vuski/admdongkor/master/ver20230101/HangJeongDong_ver20230101.geojson'
        : 'https://raw.githubusercontent.com/southkorea/seoul-maps/master/kostat/2013/json/seoul_municipalities_geo.json';

    console.log(`행정구역 경계 데이터 API 호출 (캐시 없음): ${url}`);
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
    if (filters.tradeType) apiParams.tradeType = filters.tradeType;
    if (filters.buildingTypes && filters.buildingTypes.length > 0) {
      apiParams.buildingTypes = filters.buildingTypes.join(','); 
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
    if (filters.tradeType) apiParams.tradeType = filters.tradeType;
    if (filters.buildingTypes && filters.buildingTypes.length > 0) {
      apiParams.buildingTypes = filters.buildingTypes.join(',');
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
  const endpoint = cortarNoPrefix ? `/api/regions/${cortarNoPrefix}` : '/api/regions';
  
  try {
    const response = await apiClient.get<ApiResponse<Region[]>>(endpoint);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching regions:', error);
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
    // console.log(`Transforming ${boundaryType} boundaries from preloaded data`); // 디버깅 로그 변경
    
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
    
    // console.log(`Transformed ${regionPolygons.length} region polygons for ${boundaryType}`);
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
  boundingBox: BoundingBox,
  filters: ArticleFilterData // ArticleFilter.tsx 에서 정의한 타입 사용
): Promise<Marker[]> => {
  const { swLat, neLat, swLng, neLng } = boundingBox;

  // MarkerFilterRequest에 맞게 파라미터 구성
  const apiParams: any = {
    swLat,
    neLat,
    swLng,
    neLng,
  };

  if (filters.tradeType) {
    apiParams.tradeType = filters.tradeType;
  }
  // buildingTypeCodes는 MarkerFilterRequest에서 buildingTypeCode (단일 문자열)로 받을 수도 있고, 
  // 백엔드 Repository에서는 List<String>으로 받으므로, 콤마로 구분된 문자열 또는 배열 형태로 전달해야함.
  // MarkerRepository의 findFilteredMarkers는 List<String> tradeType, List<String> buildingTypeCode를 받음.
  // 따라서 콤마로 구분된 문자열보다는, query-string 라이브러리 등이 배열을 올바르게 직렬화하도록 두거나, 
  // 백엔드에서 @RequestParam으로 받을 때 List로 바로 매핑되도록 이름과 값을 여러 번 전달하는 방식 (e.g. buildingTypeCode=APT&buildingTypeCode=VILLA)을 사용해야함.
  // 여기서는 일단 join(',')으로 전달하고, 필요시 수정.
  if (filters.buildingTypeCodes && filters.buildingTypeCodes.length > 0) {
    // Java 백엔드에서 List<String>으로 받으려면 파라미터를 반복하거나(Spring 기본), 특정 라이브러리를 사용해야 함.
    // 일반적으로 query param에서 배열은 `buildingTypeCode=APT&buildingTypeCode=VILLA` 와 같이 표현됨.
    // apiClient(axios)는 paramsSerializer를 통해 이를 처리할 수 있음.
    // 우선은 API 명세에 따라 `buildingTypeCode`로 단일 값만 보내거나, 백엔드 수정이 필요할 수 있음.
    // 제공된 MarkerFilterRequest DTO는 buildingTypeCode: String 이므로, 첫번째 요소만 보내거나, API 변경이 필요함.
    // 여기서는 첫번째 요소만 보내는 것으로 가정. 또는 백엔드가 List<String>을 콤마로 구분된 문자열로 받는다고 가정.
    apiParams.buildingTypeCode = filters.buildingTypeCodes.join(','); // 또는 filters.buildingTypeCodes[0] 등 백엔드 스펙에 따라 조정
  }

  if (filters.minSalePrice !== undefined) {
    apiParams.minSalePrice = filters.minSalePrice;
  }
  if (filters.maxSalePrice !== undefined) {
    apiParams.maxSalePrice = filters.maxSalePrice;
  }
  if (filters.minRentPrice !== undefined) {
    apiParams.minRentPrice = filters.minRentPrice;
  }
  if (filters.maxRentPrice !== undefined) {
    apiParams.maxRentPrice = filters.maxRentPrice;
  }
  
  // 정렬 파라미터는 MarkerFilterRequest에 없으므로 제거
  // if (filters.sortField && filters.sortOrder) {
  //   apiParams.sort = `${filters.sortField},${filters.sortOrder}`;
  // }

  try {
    // 새로운 엔드포인트 사용
    const response = await apiClient.get<MarkerApiResponse>('/api/article/markers/filter', {
      params: apiParams,
      // Axios에서 배열 파라미터 전송 방식 설정 (필요한 경우)
      // import qs from 'qs';
      // paramsSerializer: params => {
      //   return qs.stringify(params, { arrayFormat: 'repeat' })
      // }
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