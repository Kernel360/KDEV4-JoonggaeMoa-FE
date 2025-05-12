import { HEATMAP_COLORS } from "@/domain/article/map/constants/mapConstants";
import {ClusterInfo} from "@/domain/article/types/article";
import {getTypeColor} from "@/domain/article/utils/articleDisplay";

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
 * 줌 레벨에 따른 정밀도 계산 함수
 * 줌 레벨이 낮을수록(지도가 넓게 보일수록) 정밀도를 낮게, 줌 레벨이 높을수록 정밀도를 높게 설정
 * @param zoom 지도 줌 레벨
 * @returns 적절한 정밀도 값
 */
export const calculatePrecisionByZoom = (zoom: number): number => {
    if (zoom <= 3) return 2;       // 0.01 정도의 정밀도 (매우 넓은 영역)
    else if (zoom <= 5) return 3;  // 0.001 정도의 정밀도 (넓은 영역)
    else if (zoom <= 7) return 4;  // 0.0001 정도의 정밀도 (중간 영역)
    else if (zoom <= 9) return 5;  // 0.00001 정도의 정밀도 (좁은 영역)
    else return 6;                 // 0.000001 정도의 정밀도 (매우 좁은 영역)
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