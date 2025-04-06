// 매물 응답 타입
export interface ArticleResponse {
    id: number;
    cortarNo: string;
    articleNo: string;
    name: string;
    realEstateType: string;
    tradeType: string;
    price: string;
    rentPrice: number;
    confirmedAt: string;
    latitude: number;
    longitude: number;
    imageUrl: string;
    direction: string;
    tags: string[];
    subwayInfo: string;
    companyId: string;
    companyName: string;
    agentName: string;
    cortarName: string;
}