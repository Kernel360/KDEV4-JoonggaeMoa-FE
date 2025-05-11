import { PRECISION_BY_ZOOM } from "@/domain/article/map/constants/mapConstants";
import { ArticleResponse } from "@/domain/article/types/article";
import { createCoordinates } from "@/domain/article/utils/articleFormat";

/**
 * 주어진 영역 내에 있는 매물 목록을 필터링합니다.
 *
 * @param articles 필터링할 매물 목록
 * @param bounds 영역 좌표 (북동쪽, 남서쪽 좌표)
 * @returns 영역 내에 있는 매물 목록
 */
export const filterArticlesInBounds = (
    articles: ArticleResponse[],
    bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }
): ArticleResponse[] => {
    return articles.filter(article => {
        const coordinates = createCoordinates(article.latitude, article.longitude);
        if (!coordinates) return false;

        return (
            coordinates.lat >= bounds.sw.lat &&
            coordinates.lat <= bounds.ne.lat &&
            coordinates.lng >= bounds.sw.lng &&
            coordinates.lng <= bounds.ne.lng
        );
    });
};

/**
 * 지도 줌 레벨에 따른 정밀도 값을 반환합니다.
 *
 * @param zoomLevel 지도 줌 레벨
 * @returns 정밀도 값
 */
export const getPrecisionByZoomLevel = (zoomLevel: number): number => {
    if (zoomLevel <= PRECISION_BY_ZOOM.LOW.MAX_LEVEL) return PRECISION_BY_ZOOM.LOW.PRECISION;
    if (zoomLevel <= PRECISION_BY_ZOOM.MEDIUM_LOW.MAX_LEVEL) return PRECISION_BY_ZOOM.MEDIUM_LOW.PRECISION;
    if (zoomLevel <= PRECISION_BY_ZOOM.MEDIUM.MAX_LEVEL) return PRECISION_BY_ZOOM.MEDIUM.PRECISION;
    if (zoomLevel <= PRECISION_BY_ZOOM.MEDIUM_HIGH.MAX_LEVEL) return PRECISION_BY_ZOOM.MEDIUM_HIGH.PRECISION;
    if (zoomLevel <= PRECISION_BY_ZOOM.HIGH.MAX_LEVEL) return PRECISION_BY_ZOOM.HIGH.PRECISION;
    if (zoomLevel <= PRECISION_BY_ZOOM.VERY_HIGH.MAX_LEVEL) return PRECISION_BY_ZOOM.VERY_HIGH.PRECISION;
    if (zoomLevel <= PRECISION_BY_ZOOM.ULTRA_HIGH.MAX_LEVEL) return PRECISION_BY_ZOOM.ULTRA_HIGH.PRECISION;
    return PRECISION_BY_ZOOM.MAX.PRECISION;
}; 