import { useCallback, useRef, useState } from 'react';

import { MapBounds } from './useMapView';
import { calculatePrecisionByZoom, generateClusterId } from '../map/utils/clusterUtils';
import { articleApi } from '../services/articleApi';
import { ClusterInfo } from '../types/article';

interface UseClustersProps {
  clusterZoomThreshold: number;
}

export function useClusters({ clusterZoomThreshold }: UseClustersProps) {
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clusterCache = useRef(new Map<string, {data: ClusterInfo[], timestamp: number}>());
  const CACHE_MAX_SIZE = 30;
  const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5분 캐시 유효 시간
  const lastFetchRef = useRef<string>('');
  const fetchCountRef = useRef<number>(0);

  // 오래된 캐시 항목을 제거하는 함수
  const cleanupCache = useCallback(() => {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    // 만료된 캐시 항목 찾기
    clusterCache.current.forEach((value, key) => {
      if (now - value.timestamp > CACHE_EXPIRY_TIME) {
        expiredKeys.push(key);
      }
    });
    
    // 만료된 항목 제거
    expiredKeys.forEach(key => {
      clusterCache.current.delete(key);
    });
    
    // 캐시 사이즈가 최대치를 초과하면 가장 오래된 항목 제거
    if (clusterCache.current.size > CACHE_MAX_SIZE) {
      let oldestKey = '';
      let oldestTime = Date.now();
      
      clusterCache.current.forEach((value, key) => {
        if (value.timestamp < oldestTime) {
          oldestTime = value.timestamp;
          oldestKey = key;
        }
      });
      
      if (oldestKey) {
        clusterCache.current.delete(oldestKey);
      }
    }
  }, [CACHE_EXPIRY_TIME, CACHE_MAX_SIZE]);

  // 클러스터 데이터 가져오기 함수
  const fetchClusters = useCallback(async (bounds: MapBounds, zoom: number) => {
    try {
      // 줌 레벨에 따른 적절한 정밀도 계산
      const precision = calculatePrecisionByZoom(zoom);

      // 캐시 키를 더 효율적으로 생성 (소수점 줄이고 최적화)
      const cacheKey = `${zoom}_${bounds.sw.lat.toFixed(4)}_${bounds.sw.lng.toFixed(4)}_${bounds.ne.lat.toFixed(4)}_${bounds.ne.lng.toFixed(4)}`;
      
      // 같은 요청이 짧은 시간 내에 중복해서 오는 경우 무시
      if (lastFetchRef.current === cacheKey) {
        fetchCountRef.current++;
        // 3번 이상 같은 요청이 연속으로 오면 무시
        if (fetchCountRef.current > 3) {
          return clusters;
        }
      } else {
        lastFetchRef.current = cacheKey;
        fetchCountRef.current = 1;
      }

      // 캐시 정리 실행
      cleanupCache();

      // 캐시에 있는 경우 즉시 사용
      if (clusterCache.current.has(cacheKey)) {
        const cachedData = clusterCache.current.get(cacheKey);
        if (cachedData) {
          setClusters(cachedData.data);
          return cachedData.data;
        }
      }

      // 캐시에 없을 경우에만 로딩 상태 설정
      setLoading(true);
      setError(null);

      // API 호출 파라미터 준비 (필요한 파라미터만 포함)
      const params = {
        swLat: bounds.sw.lat,
        swLng: bounds.sw.lng,
        neLat: bounds.ne.lat,
        neLng: bounds.ne.lng,
        zoomLevel: zoom,
        precision: precision
      };

      // API 호출 실행
      const resp = await articleApi.getClusters(params);

      // 응답 처리
      let clusterData: ClusterInfo[] = [];
      const responseData = resp.data as any;

      // HATEOAS _embedded 필드 처리
      if (responseData && responseData._embedded) {
        const embedded = responseData._embedded;
        
        if (embedded.clusterRequests) {
          clusterData = embedded.clusterRequests;
        } else if (embedded.clusters) {
          clusterData = embedded.clusters;
        } else {
          const firstKey = Object.keys(embedded)[0];
          if (firstKey && Array.isArray(embedded[firstKey])) {
            clusterData = embedded[firstKey];
          }
        }
      }
      // 기존 API 응답 구조 처리
      else if (responseData && responseData.data && Array.isArray(responseData.data)) {
        clusterData = responseData.data;
      } else if (Array.isArray(responseData)) {
        clusterData = responseData;
      }

      if (!Array.isArray(clusterData)) {
        console.error("클러스터 데이터가 배열이 아님:", responseData);
        throw new Error("유효하지 않은 클러스터 데이터");
      }

      // 클러스터 데이터의 각 항목에 유효성 검사 및 필요한 필드 추가
      clusterData = clusterData.filter(cluster => {
        if (!cluster || typeof cluster.lat !== 'number' || typeof cluster.lng !== 'number' || !cluster.count) {
          return false;
        }
        return true;
      }).map(cluster => ({
        ...cluster,
        // 클러스터 ID가 없으면 생성
        clusterId: cluster.clusterId || generateClusterId(cluster.lat, cluster.lng, precision),
        // 정밀도 정보 추가
        precision: cluster.precision || precision
      }));
      
      // 클러스터 상태 업데이트
      setClusters(clusterData);

      // 캐시에 저장 (타임스탬프 포함)
      clusterCache.current.set(cacheKey, {
        data: clusterData,
        timestamp: Date.now()
      });

      return clusterData;
    } catch (err) {
      console.error("클러스터 정보 로드 실패:", err);
      setError("클러스터 정보를 불러오는데 실패했습니다.");
      setClusters([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [cleanupCache, clusters]);

  return {
    clusters,
    setClusters,
    fetchClusters,
    loading,
    error
  };
} 