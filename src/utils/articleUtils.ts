import type { ArticleResponse } from "../types/article";

export const getTypeColor = (type: string) => {
    switch (type) {
        case "아파트":
            return "#4CAF50";
        case "오피스텔":
            return "#2196F3";
        case "빌라":
            return "#9C27B0";
        case "아파트분양권":
            return "#FF9800";
        case "오피스텔분양권":
            return "#00BCD4";
        case "재건축":
            return "#F44336";
        case "전원주택":
            return "#8BC34A";
        case "단독/다가구":
            return "#673AB7";
        case "상가주택":
            return "#E91E63";
        case "한옥주택":
            return "#795548";
        case "재개발":
            return "#FF5722";
        case "원룸":
            return "#03A9F4";
        case "고시원":
            return "#9E9E9E";
        case "상가":
            return "#FFC107";
        case "사무실":
            return "#3F51B5";
        case "공장/창고":
            return "#607D8B";
        case "건물":
            return "#009688";
        case "토지":
            return "#CDDC39";
        case "지식산업센터":
            return "#00BCD4";
        default:
            return "#757575";
    }
};

export const getTradeTypeColor = (type: string) => {
    switch (type) {
        case "매매":
            return "#E91E63";
        case "전세":
            return "#2196F3";
        case "월세":
            return "#4CAF50";
        case "단기임대":
            return "#FF9800";
        default:
            return "#757575";
    }
};

export const getTypeEmoji = (type: string): string => {
    switch (type) {
        case "아파트":
            return "🏢";
        case "오피스텔":
            return "🏬";
        case "빌라":
            return "🏠";
        case "아파트분양권":
            return "📄";
        case "오피스텔분양권":
            return "📄";
        case "재건축":
            return "🏗️";
        case "전원주택":
            return "🏡";
        case "단독/다가구":
            return "🏘️";
        case "상가주택":
            return "🏪";
        case "한옥주택":
            return "🏯";
        case "재개발":
            return "🏗️";
        case "원룸":
            return "🏠";
        case "고시원":
            return "🏢";
        case "상가":
            return "🏪";
        case "사무실":
            return "🏢";
        case "공장/창고":
            return "🏭";
        case "건물":
            return "🏢";
        case "토지":
            return "🌳";
        case "지식산업센터":
            return "🏢";
        default:
            return "🏠";
    }
};

export const isZeroPrice = (price: number | string | null): boolean => {
    if (price === null || price === undefined) return false;
    if (typeof price === 'string') {
        return price === "0" || price === "0.0" || price === "0.00";
    }
    return price === 0;
};

export const formatPrice = (price: number | string | null): string => {
    if (price === null || price === undefined) return "-"
    
    if (typeof price === 'string') {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) return price;
        price = numPrice;
    }
    
    if (price < 10000) {
        return `${price}만원`;
    } else {
        const eok = Math.floor(price / 10000);
        const man = price % 10000;
        
        if (man === 0) {
            return `${eok}억원`;
        } else {
            return `${eok}억 ${man}만원`;
        }
    }
};

export const formatDate = (dateString: string): string => {
    if (!dateString) return "-"
    if (dateString.match(/^\d{2}\.\d{2}\.\d{2}\.$/)) {
        return dateString;
    }
    const date = new Date(dateString)
    return date.toLocaleDateString("ko-KR", {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).replace(/년 /g, '년 ').replace(/월 /g, '월 ').replace(/일$/, '일');
};

export const validateCoordinates = (lat: number | string, lng: number | string): boolean => {
    const numLat = typeof lat === 'number' ? lat : parseFloat(lat);
    const numLng = typeof lng === 'number' ? lng : parseFloat(lng);
    
    return !isNaN(numLat) && !isNaN(numLng) && 
           numLat >= -90 && numLat <= 90 && 
           numLng >= -180 && numLng <= 180;
};

export const convertKoreanPriceToNumber = (price: string): number => {
    if (!price) return 0;
    
    const match = price.match(/(\d+)억\s*(\d+)?만원/);
    if (match) {
        const eok = parseInt(match[1]) * 10000;
        const man = match[2] ? parseInt(match[2]) : 0;
        return eok + man;
    }
    
    const manMatch = price.match(/(\d+)만원/);
    if (manMatch) {
        return parseInt(manMatch[1]);
    }
    
    return 0;
}; 