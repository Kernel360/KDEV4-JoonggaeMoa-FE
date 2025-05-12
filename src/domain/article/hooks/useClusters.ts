import { useCallback, useRef, useState } from 'react';

import { MapBounds } from './useMapView';
import { calculatePrecisionByZoom } from '../map/utils/clusterUtils';
import { articleApi } from '../services/articleApi';
import { ClusterInfo } from '../types/article';

interface UseClustersProps {
  clusterZoomThreshold: number;
}

export function useClusters({ clusterZoomThreshold }: UseClustersProps) {
  const [clusters, setClusters] = useState<ClusterInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clusterCache = useRef(new Map<string, ClusterInfo[]>());

  const fetchClusters = useCallback(async (bounds: MapBounds, zoom: number) => {
    try {
      setLoading(true);
      setError(null);

      // 줌 레벨에 따른 적절한 정밀도 계산
      const precision = calculatePrecisionByZoom(zoom);

      // 클러스터 캐시 키 생성
      const cacheKey = `${zoom.toFixed(1)}_${bounds.sw.lat.toFixed(5)}_${bounds.sw.lng.toFixed(5)}_${bounds.ne.lat.toFixed(5)}_${bounds.ne.lng.toFixed(5)}_${precision}`;

      // 캐시에 있는 경우 즉시 사용
      if (clusterCache.current.has(cacheKey)) {
        const cachedClusters = clusterCache.current.get(cacheKey) || [];
        setClusters(cachedClusters);
        setLoading(false);
        return;
      }

      // API 호출 파라미터 준비
      const params = {
        swLat: bounds.sw.lat,
        swLng: bounds.sw.lng,
        neLat: bounds.ne.lat,
        neLng: bounds.ne.lng,
        precision,
        zoomLevel: zoom,
        clusterRadius: zoom <= 3 ? 100 : zoom <= 4 ? 80 : zoom <= 5 ? 60 : 40,
        minPoints: zoom <= 3 ? 1 : zoom <= 4 ? 2 : zoom <= 5 ? 2 : 3
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
          // _embedded 객체의 첫 번째 프로퍼티를 가져와서 사용
          const firstKey = Object.keys(embedded)[0];
          if (firstKey && Array.isArray(embedded[firstKey])) {
            clusterData = embedded[firstKey];
          }
        }
      }
      // 기존 API 응답 구조 처리 (하위 호환성 유지)
      else if (responseData && responseData.data && Array.isArray(responseData.data)) {
        clusterData = responseData.data;
      } else if (Array.isArray(responseData)) {
        clusterData = responseData;
      }

      if (!Array.isArray(clusterData)) {
        throw new Error("유효하지 않은 클러스터 데이터");
      }

      // 클러스터 상태 업데이트
      setClusters(clusterData);

      // 캐시에 저장 (최대 20개 항목으로 제한)
      clusterCache.current.set(cacheKey, clusterData);
      if (clusterCache.current.size > 20) {
        // 가장 오래된 항목 제거
        const firstKey = Array.from(clusterCache.current.keys())[0];
        clusterCache.current.delete(firstKey);
      }

    } catch (err) {
      console.error("클러스터 정보 로드 실패:", err);
      setError("클러스터 정보를 불러오는데 실패했습니다.");
      setClusters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    clusters,
    setClusters,
    fetchClusters,
    loading,
    error
  };
} 