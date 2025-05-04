import type { RealEstateType, TradeType } from "../types/article";

export const getTypeColor = (type: RealEstateType | string): string => {
    switch (type) {
        case '아파트':
            return '#2196f3';
        case '오피스텔':
            return '#4caf50';
        case '전원주택':
            return "#00bcd4";
        case '빌라':
            return '#ff9800';
        case '단독/다가구':
            return '#9c27b0';
        case '상가주택':
            return '#f44336';
        case '한옥주택':
            return '#795548';
        case '상가':
            return '#f44336';
        case '사무실':
            return '#607d8b';
        default:
            return '#9e9e9e';
    }
};

export const getTradeTypeColor = (type: TradeType | string): string => {
    switch (type) {
        case '매매':
            return 'primary';
        case '전세':
            return 'success';
        case '월세':
            return 'warning';
        case '단기임대':
            return 'info';
        default:
            return 'default';
    }
};

export const getTypeEmoji = (type: RealEstateType | string): string => {
    switch (type) {
        case '아파트':
            return '🏢';
        case '오피스텔':
            return '🏬';
        case '빌라':
            return '🏠';
        case '전원주택':
            return '🏡';
        case '단독/다가구':
            return '🏡';
        case '상가주택':
            return '🏪';
        case '한옥주택':
            return '🏡';
        case '상가':
            return '🏪';
        case '사무실':
            return '🏢';
        default:
            return '🏠';
    }
};

export const createArticleMarkerSvg = (buildingType: string, isSelected: boolean = false, customColor?: string, customOpacity?: number): string => {
    const color = customColor || getTypeColor(buildingType);
    const emoji = getTypeEmoji(buildingType);
    
    // 핀포인트 크기 줄이기
    const circleRadius = isSelected ? 18 : 15;
    const strokeWidth = isSelected ? 2.5 : 1.5;
    const strokeColor = isSelected ? '#FF5722' : 'white';
    const fontSize = isSelected ? 16 : 14;
    const opacity = customOpacity !== undefined ? customOpacity : 1.0;
    
    return `
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="${circleRadius}" fill="${color}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
            <text x="20" y="25" font-size="${fontSize}" text-anchor="middle" fill="white">${emoji}</text>
            ${isSelected ? '<circle cx="20" cy="20" r="24" fill="none" stroke="#FF5722" stroke-width="2" stroke-dasharray="4,2" opacity="0.8"/>' : ''}
        </svg>
    `;
}; 