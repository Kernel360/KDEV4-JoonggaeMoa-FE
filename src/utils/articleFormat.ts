export const formatDate = (date: string): string => {
    if (!date) return '-';
    return date.split('T')[0].replace(/-/g, '.');
};

/**
 * 좌표 값을 문자열이나 다른 형식에서 숫자로 변환합니다.
 *
 * @param value 변환할 좌표값 (위도 또는 경도)
 * @returns 변환된 숫자 좌표
 */
export const parseCoordinate = (value: number | string | undefined | null): number | null => {
    if (value === undefined || value === null) return null;
    const numValue = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(numValue) ? null : numValue;
};

/**
 * 좌표의 유효성을 검사합니다.
 *
 * @param lat 위도
 * @param lng 경도
 * @returns 좌표가 유효한지 여부
 */
export const validateCoordinates = (lat: number | string | undefined | null, lng: number | string | undefined | null): boolean => {
    const numLat = parseCoordinate(lat);
    const numLng = parseCoordinate(lng);

    // 기본적인 좌표 유효성만 검사 (숫자이며 합리적인 범위 내에 있는지)
    return numLat !== null && numLng !== null &&
        numLat >= 30 && numLat <= 45 && // 동아시아 위도 범위 (더 넓게)
        numLng >= 120 && numLng <= 135; // 동아시아 경도 범위 (더 넓게)
};

/**
 * 좌표 객체를 생성합니다. 유효하지 않은 좌표는 null을 반환합니다.
 *
 * @param lat 위도
 * @param lng 경도
 * @returns 좌표 객체 또는 null (유효하지 않은 경우)
 */
export const createCoordinates = (lat: number | string | undefined | null, lng: number | string | undefined | null): {
    lat: number,
    lng: number
} | null => {
    const numLat = parseCoordinate(lat);
    const numLng = parseCoordinate(lng);

    if (numLat === null || numLng === null) return null;

    return {lat: numLat, lng: numLng};
};

export const withImageSize = (url?: string, width: number = 1000): string | undefined => {
    if (!url) return undefined;
    const separator = url.includes('?');
    return `${url}${separator}w=${width}`;
}; 