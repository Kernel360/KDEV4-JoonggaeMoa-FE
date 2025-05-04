import { ClusterInfo } from "../types/article";

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
export const extractCoordinatesFromClusterId = (clusterId: string, precision: number = 5): {lat: number, lng: number} | null => {
    const parts = clusterId.split(',');
    if (parts.length !== 2) return null;
    
    try {
        const latGroup = parseInt(parts[0]);
        const lngGroup = parseInt(parts[1]);
        
        if (isNaN(latGroup) || isNaN(lngGroup)) return null;
        
        // 정밀도 단위의 좌표로 변환 (대략적인 중심점)
        const lat = latGroup / Math.pow(10, precision);
        const lng = lngGroup / Math.pow(10, precision);
        
        return { lat, lng };
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
    if (zoom <= 2) return 2;      // 매우 큰 클러스터 (국가/대륙 수준)
    else if (zoom <= 3) return 3; // 큰 클러스터 (도시 광역 수준)
    else if (zoom <= 4) return 4; // 중간 크기 클러스터 (도시 수준)
    else if (zoom <= 5) return 6; // 작은 클러스터 (구/군 수준) - 개별 매물이 잘 보이도록 정밀도 높임
    else if (zoom <= 7) return 6; // 작은 클러스터 (동/읍/면 수준)
    else if (zoom <= 10) return 7; // 매우 작은 클러스터 (블록 수준)
    else return 8;                // 상세 지역 (개별 건물 수준)
};

/**
 * 클러스터 색상을 계산합니다 (매물 수에 따라 색상 강도 조절)
 * 
 * @param cluster 클러스터 정보
 * @returns 색상 코드 (hex)
 */
export const getClusterColor = (cluster: ClusterInfo): string => {
    // 기본 색상은 '#FF5722' (주황색)
    // 매물이 많을수록 더 진한 색으로 표시
    const intensity = Math.min(1.0, cluster.count / 100); // 최대 100개까지 강도 증가
    const baseColor = cluster.mainRealEstateType ? getColorByType(cluster.mainRealEstateType) : '#FF5722';
    
    // 투명도를 이용해 강도 조절
    return baseColor;
};

/**
 * 매물 유형에 따른 색상 코드를 반환합니다.
 * 
 * @param type 매물 유형
 * @returns 색상 코드 (hex)
 */
const getColorByType = (type: string): string => {
    switch (type) {
        case '아파트': return '#2196f3';
        case '오피스텔': return '#4caf50';
        case '전원주택': return "#00bcd4";
        case '빌라': return '#ff9800';
        case '단독/다가구': return '#9c27b0';
        case '상가주택': return '#f44336';
        case '한옥주택': return '#795548';
        case '상가': return '#f44336';
        case '사무실': return '#607d8b';
        default: return '#FF5722';
    }
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
    sw: {lat: number, lng: number}, 
    ne: {lat: number, lng: number} 
} => {
    // 정밀도에 따른 오차 범위 계산
    const offset = 1 / Math.pow(10, precision);
    
    return {
        sw: { lat: lat - offset, lng: lng - offset },
        ne: { lat: lat + offset, lng: lng + offset }
    };
}; 