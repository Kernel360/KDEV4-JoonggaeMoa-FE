import type {RealEstateType, TradeType} from "@/domain/article/types/article";
import { PROPERTY_TYPE_STYLES } from "@/domain/article/map/constants/mapConstants";
import { TRADE_TYPE_COLORS } from "@/domain/article/constants/articleConstants";

export const getTypeColor = (type: RealEstateType | string): string => {
    return PROPERTY_TYPE_STYLES[type as keyof typeof PROPERTY_TYPE_STYLES]?.color || PROPERTY_TYPE_STYLES["default"].color;
};

export const getTradeTypeColor = (type: TradeType | string): string => {
    return TRADE_TYPE_COLORS[type as keyof typeof TRADE_TYPE_COLORS] || TRADE_TYPE_COLORS.default;
};

export const getTypeEmoji = (type: RealEstateType | string): string => {
    return PROPERTY_TYPE_STYLES[type as keyof typeof PROPERTY_TYPE_STYLES]?.icon || PROPERTY_TYPE_STYLES["default"].icon;
};

export const createArticleMarkerSvg = (buildingType: string, isSelected: boolean = false, customColor?: string, customOpacity?: number, groupCount?: number): string => {
    const color = customColor || getTypeColor(buildingType);
    const emoji = getTypeEmoji(buildingType);

    // 핀포인트 크기 줄이기
    const circleRadius = isSelected ? 18 : 15;
    const strokeWidth = isSelected ? 2.5 : 1.5;
    const strokeColor = isSelected ? '#FF5722' : 'white';
    const fontSize = isSelected ? 16 : 14;
    const opacity = customOpacity !== undefined ? customOpacity : 1.0;

    // 동일 좌표 매물 그룹에 대한 카운트 버블 추가
    const countBubble = groupCount && groupCount > 1 ? `
        <g>
            <circle cx="27" cy="13" r="8" fill="#FF0000" opacity="0.8" />
            <text x="27" y="16" font-size="10" text-anchor="middle" fill="white" font-weight="bold">${groupCount}</text>
        </g>
    ` : '';

    return `
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="${circleRadius}" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <text x="20" y="25" font-size="${fontSize}" text-anchor="middle" fill="white">${emoji}</text>
            ${isSelected ? '<circle cx="20" cy="20" r="24" fill="none" stroke="#FF5722" stroke-width="2" stroke-dasharray="4,2" opacity="0.8"/>' : ''}
            ${countBubble}
        </svg>
    `;
}; 