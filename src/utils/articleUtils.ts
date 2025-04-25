import type { ArticleResponse } from "../types/article";

export const getTypeColor = (type: string): string => {
    switch (type) {
        case '아파트':
            return '#4CAF50'; // 녹색
        case '오피스텔':
            return '#2196F3'; // 파란색
        case '빌라':
            return '#FF9800'; // 주황색
        case '아파트분양권':
            return '#8BC34A'; // 연한 녹색
        case '오피스텔분양권':
            return '#03A9F4'; // 연한 파란색
        case '재건축':
            return '#9C27B0'; // 보라색
        case '전원주택':
            return '#795548'; // 갈색
        case '단독/다가구':
            return '#FFC107'; // 황색
        case '상가주택':
            return '#673AB7'; // 진한 보라색
        case '한옥주택':
            return '#3F51B5'; // 남색
        case '재개발':
            return '#E91E63'; // 분홍색
        case '원룸':
            return '#009688'; // 청록색
        case '고시원':
            return '#607D8B'; // 청회색
        case '상가':
            return '#F44336'; // 빨간색
        case '사무실':
            return '#00BCD4'; // 청색
        case '공장/창고':
            return '#455A64'; // 진한 청회색
        case '건물':
            return '#9E9E9E'; // 회색
        case '토지':
            return '#8D6E63'; // 갈색
        case '지식산업센터':
            return '#78909C'; // 연한 청회색
        default:
            return '#9E9E9E'; // 기본 회색
    }
};

export const getTradeTypeColor = (tradeType: string): string => {
    switch (tradeType) {
        case '매매':
            return '#E53935'; // 빨간색
        case '전세':
            return '#1E88E5'; // 파란색
        case '월세':
            return '#43A047'; // 녹색
        case '단기임대':
            return '#FB8C00'; // 주황색
        default:
            return '#757575'; // 회색
    }
};

export const getTypeEmoji = (type: string): string => {
    switch (type) {
        case '아파트':
            return '🏢';
        case '오피스텔':
            return '🏬';
        case '빌라':
            return '🏘️';
        case '아파트분양권':
            return '📝';
        case '오피스텔분양권':
            return '📋';
        case '재건축':
            return '🏗️';
        case '전원주택':
            return '🏡';
        case '단독/다가구':
            return '🏠';
        case '상가주택':
            return '🏪';
        case '한옥주택':
            return '🏯';
        case '재개발':
            return '🚧';
        case '원룸':
            return '🛌';
        case '고시원':
            return '📚';
        case '상가':
            return '🛒';
        case '사무실':
            return '💼';
        case '공장/창고':
            return '🏭';
        case '건물':
            return '🏢';
        case '토지':
            return '🌳';
        case '지식산업센터':
            return '🧠';
        default:
            return '🏠';
    }
};

export const convertKoreanPriceToNumber = (price: string): number => {
    if (!price) return 0;
    
    let result = price.replace(/,/g, '');
    
    const trillion = result.match(/(\d+)조/);
    const billion = result.match(/(\d+)억/);
    const million = result.match(/(\d+)만/);
    const thousand = result.match(/(\d+)천/);
    
    let convertedNumber = 0;
    
    if (trillion) {
        convertedNumber += parseInt(trillion[1]) * 1000000000000;
    }
    
    if (billion) {
        convertedNumber += parseInt(billion[1]) * 100000000;
    }
    
    if (million) {
        convertedNumber += parseInt(million[1]) * 10000;
    }
    
    if (thousand) {
        convertedNumber += parseInt(thousand[1]) * 1000;
    }
    
    if (convertedNumber === 0) {
        return parseInt(result);
    }
    
    return convertedNumber;
};

export const isZeroPrice = (price: number | string | null): boolean => {
    if (price === null || price === undefined) return false;
    if (typeof price === 'string') {
        return price === "0" || price === "0.0" || price === "0.00";
    }
    return price === 0;
};

export const formatPrice = (price: number | string | null): string => {
    if (price === null || price === undefined) return "-";
    
    // 입력된 price에 10000을 곱해 실제 가격으로 변환 (API가 만단위로 축소된 값 제공)
    let numPrice = typeof price === 'string' ? parseFloat(price) : price;
    numPrice = numPrice * 10000; // 만단위 변환
    
    if (isNaN(numPrice)) {
        console.warn(`Invalid price value: ${price}`);
        return "-";
    }
    
    if (numPrice === 0) return "0";
    
    // 조 단위 표시 제외 (요청에 따라)
    
    if (numPrice >= 100000000) {
        const billion = Math.floor(numPrice / 100000000);
        const million = Math.floor((numPrice % 100000000) / 10000);
        
        return million > 0 
            ? `${billion}억 ${million}만` 
            : `${billion}억`;
    } else if (numPrice >= 10000) {
        const million = Math.floor(numPrice / 10000);
        const thousand = Math.floor((numPrice % 10000) / 1000);
        
        return thousand > 0 
            ? `${million}만 ${thousand}천` 
            : `${million}만`;
    } else {
        return numPrice.toLocaleString();
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