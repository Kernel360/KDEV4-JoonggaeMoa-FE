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
        return `${priceStr}만`;
    } else if (length <= 8) {
        const man = priceStr.slice(-4);
        const eok = priceStr.slice(0, length - 4);
        return `${eok}억 ${man !== '0000' ? man + '만' : ''}`;
    } else {
        const man = priceStr.slice(-4);
        const eok = priceStr.slice(-8, -4);
        const cheok = priceStr.slice(0, length - 8);
        return `${cheok}천억 ${eok !== '0000' ? eok + '억' : ''} ${man !== '0000' ? man + '만' : ''}`;
    }
}; 