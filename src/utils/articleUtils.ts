import type { ArticleResponse } from "../types/article";

export const getTypeColor = (type: string): string => {
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

export const getTradeTypeColor = (type: string): string => {
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

export const getTypeEmoji = (type: string): string => {
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

export const convertKoreanPriceToNumber = (price: string): number => {
    if (!price) return 0;
    
    // 숫자만 추출
    const numbers = price.match(/\d+/g);
    if (!numbers) return 0;
    
    let result = 0;
    const priceStr = price.replace(/\s/g, '');
    
    // 억 단위 처리
    const eokIndex = priceStr.indexOf('억');
    if (eokIndex !== -1) {
        const eokStr = priceStr.substring(0, eokIndex);
        const eokNum = parseInt(eokStr.replace(/[^0-9]/g, ''));
        result += eokNum * 100000000;
    }
    
    // 만 단위 처리
    const manIndex = priceStr.indexOf('만');
    if (manIndex !== -1) {
        const manStr = priceStr.substring(eokIndex !== -1 ? eokIndex + 1 : 0, manIndex);
        const manNum = parseInt(manStr.replace(/[^0-9]/g, ''));
        result += manNum * 10000;
    }
    
    return result;
};

export const isZeroPrice = (price: number): boolean => {
    return !price || price === 0;
};

export const formatPrice = (price: number): string => {
    if (!price) return '0';
    const priceStr = price.toString();
    const length = priceStr.length;
    
    if (length <= 4) {
        return `${priceStr}만원`;
    } else if (length <= 8) {
        const man = priceStr.slice(-4);
        const eok = priceStr.slice(0, length - 4);
        return `${eok}억 ${man !== '0000' ? man + '만' : ''}원`;
    } else {
        const man = priceStr.slice(-4);
        const eok = priceStr.slice(-8, -4);
        const cheok = priceStr.slice(0, length - 8);
        return `${cheok}천억 ${eok !== '0000' ? eok + '억' : ''} ${man !== '0000' ? man + '만' : ''}원`;
    }
};

export const formatDate = (date: string): string => {
    if (!date) return '-';
    return date.split('T')[0].replace(/-/g, '.');
};

export const validateCoordinates = (lat: number | string, lng: number | string): boolean => {
    const numLat = typeof lat === 'number' ? lat : parseFloat(lat);
    const numLng = typeof lng === 'number' ? lng : parseFloat(lng);
    
    return !isNaN(numLat) && !isNaN(numLng) && 
           numLat >= -90 && numLat <= 90 && 
           numLng >= -180 && numLng <= 180;
}; 

export const withImageSize = (url?: string, width: number = 1000): string | undefined => {
    if (!url) return undefined;
    const separator = url.includes('?');
    return `${url}${separator}w=${width}`;
};