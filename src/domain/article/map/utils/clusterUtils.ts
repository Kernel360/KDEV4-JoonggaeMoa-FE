import {ClusterInfo} from "@/domain/article/types/article";
import {getTypeColor} from "@/domain/article/utils/articleDisplay";
import { HEATMAP_COLORS, PRECISION_BY_ZOOM } from "@/domain/article/map/constants/mapConstants";

/**
 * 좌표와 정밀도를 기반으로 클러스터 ID를 생성합니다.
 *
 * @param lat 위도
 * @param lng 경도
 * @param precision 정밀도 (기본값: 5)
 * @returns format: "latGroup,lngGroup"
 */
export const generateClusterId = (lat: number, lng: number, precision: number = 5): string => {
    // 소수점을 정밀도만큼 이동시키고 정수 부분만 사용하여 그룹화
    const latGroup = Math.floor(lat * Math.pow(10, precision));
    const lngGroup = Math.floor(lng * Math.pow(10, precision));
    return `${latGroup},${lngGroup}`;
};

/**
 * 클러스터 ID로부터 좌표 값을 추출합니다.
 *
 * @param clusterId format: "latGroup,lngGroup"
 * @param precision 정밀도 (기본값: 5)
 * @returns {lat, lng} 또는 null (잘못된 clusterId)
 */
export const extractCoordinatesFromClusterId = (clusterId: string, precision: number = 5): {
    lat: number,
    lng: number
} | null => {
    const parts = clusterId.split(',');
    if (parts.length !== 2) return null;

    try {
        const latGroup = parseInt(parts[0]);
        const lngGroup = parseInt(parts[1]);

        if (isNaN(latGroup) || isNaN(lngGroup)) return null;

        // 정밀도 단위의 좌표로 변환 (대략적인 중심점)
        const lat = latGroup / Math.pow(10, precision);
        const lng = lngGroup / Math.pow(10, precision);

        return {lat, lng};
    } catch (error) {
        console.error("클러스터 ID에서 좌표 추출 실패:", error);
        return null;
    }
};

/**
 * 줌 레벨에 따른 적절한 정밀도를 계산합니다.
 *
 * @param zoom 지도 줌 레벨
 * @returns 정밀도 값 (1~8)
 */
export const calculatePrecisionByZoom = (zoom: number): number => {
    if (zoom <= PRECISION_BY_ZOOM.LOW.MAX_LEVEL) return PRECISION_BY_ZOOM.LOW.PRECISION;
    if (zoom <= PRECISION_BY_ZOOM.MEDIUM_LOW.MAX_LEVEL) return PRECISION_BY_ZOOM.MEDIUM_LOW.PRECISION;
    if (zoom <= PRECISION_BY_ZOOM.MEDIUM.MAX_LEVEL) return PRECISION_BY_ZOOM.MEDIUM.PRECISION;
    if (zoom <= PRECISION_BY_ZOOM.MEDIUM_HIGH.MAX_LEVEL) return PRECISION_BY_ZOOM.MEDIUM_HIGH.PRECISION;
    if (zoom <= PRECISION_BY_ZOOM.HIGH.MAX_LEVEL) return PRECISION_BY_ZOOM.HIGH.PRECISION;
    if (zoom <= PRECISION_BY_ZOOM.VERY_HIGH.MAX_LEVEL) return PRECISION_BY_ZOOM.VERY_HIGH.PRECISION;
    if (zoom <= PRECISION_BY_ZOOM.ULTRA_HIGH.MAX_LEVEL) return PRECISION_BY_ZOOM.ULTRA_HIGH.PRECISION;
    return PRECISION_BY_ZOOM.MAX.PRECISION;
};

/**
 * 클러스터 색상을 계산합니다 (매물 수에 따라 색상 강도 조절)
 *
 * @param cluster 클러스터 정보
 * @returns 색상 코드 (hex)
 */
export const getClusterColor = (cluster: ClusterInfo): string => {
    // 매물 타입에 따른 색상이 있으면 해당 색상 사용
    if (cluster.mainRealEstateType) {
        return getTypeColor(cluster.mainRealEstateType);
    }
    
    // 매물 수에 따라 히트맵 색상 선택
    const intensity = Math.min(9, Math.floor(cluster.count / 10)); // 매물 10개 단위로 색상 변경 (최대 9)
    return HEATMAP_COLORS[intensity];
};

/**
 * 좌표로부터 클러스터 바운더리를 계산합니다.
 *
 * @param lat 클러스터 중심 위도
 * @param lng 클러스터 중심 경도
 * @param precision 정밀도
 * @returns {sw: {lat, lng}, ne: {lat, lng}} 클러스터 바운더리
 */
export const calculateClusterBoundary = (lat: number, lng: number, precision: number): {
    sw: { lat: number, lng: number },
    ne: { lat: number, lng: number }
} => {
    // 정밀도에 따른 오차 범위 계산
    const offset = 1 / Math.pow(10, precision);

    return {
        sw: {lat: lat - offset, lng: lng - offset},
        ne: {lat: lat + offset, lng: lng + offset}
    };
}; 