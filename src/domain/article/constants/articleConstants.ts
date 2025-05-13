import { RealEstateType, TradeType } from '../types/article';

// 매물 유형 상수
export const REAL_ESTATE_OPTIONS: RealEstateType[] = [
    "아파트",
    "오피스텔",
    "빌라",
    "전원주택",
    "단독/다가구",
    "상가주택",
    "한옥주택",
    "상가",
    "사무실"
];

// 거래 유형 상수
export const TRADE_TYPE_OPTIONS: TradeType[] = ["매매", "전세", "월세"];

// 거래 유형별 색상 상수
export const TRADE_TYPE_COLORS = {
    '매매': 'primary',
    '전세': 'success',
    '월세': 'warning',
    'default': 'default'
}; 