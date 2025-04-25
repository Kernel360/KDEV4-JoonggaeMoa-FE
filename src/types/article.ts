// 매물 응답 타입
export type RealEstateType = 
    | "아파트"
    | "오피스텔"
    | "빌라"
    | "아파트분양권"
    | "오피스텔분양권"
    | "재건축"
    | "전원주택"
    | "단독/다가구"
    | "상가주택"
    | "한옥주택"
    | "재개발"
    | "원룸"
    | "고시원"
    | "상가"
    | "사무실"
    | "공장/창고"
    | "건물"
    | "토지"
    | "지식산업센터";

export type TradeType = "매매" | "전세" | "월세" | "단기임대";

export interface ArticleResponse {
    id: number;
    dongCode: string;        // 이전: cortarNo, 법정동코드
    articleCode: string;     // 이전: articleNo, 매물번호
    articleName: string;     // 이전: name, 매물이름
    buildingName?: string;   // 건물명
    articleType: RealEstateType; // 이전: realEstateType, 매물유형
    tradeType: TradeType;    // 거래유형
    priceSale: number;       // 이전: price, 매매가/보증금
    priceRent: number;       // 이전: rentPrice, 월세
    priceRoomMin?: number;   // 최소 단기임대 비용
    priceRoomMax?: number;   // 최대 단기임대 비용
    confirmedAt: string;     // 건물 사용승인일
    latitude: number;        // 위도
    longitude: number;       // 경도
    imageUrl: string;        // 대표 이미지 URL
    direction: string;       // 방향 (남향, 북향 등)
    tags: Tag[];             // 수정 후: 태그 목록
    subwayInfo: string;      // 주변 지하철 정보
    companyName: string;     // 정보 제공 출처명
    agentName: string;       // 공인중개사 사무소명
    
    // 새로 추가된 필드들
    floors?: string;         // 매물층수/건물층수
    areaSupply?: string;     // 공급면적 (단위: 제곱미터)
    areaExclusive?: string;  // 전용면적 (단위: 제곱미터)
    atclFetrDesc?: string;   // 매물 특징 설명
    isChecked?: boolean;     // 실매물 확인 여부
    articleDescRoom?: string; // 고시원 기본 정보
    articleDescMw?: string;   // 고시원 특징
    emptyRoomCount?: number;  // 빈방 수
    
    // 주소 관련 필드들
    lotAddress?: string;     // 지번 주소
    roadAddress?: string;    // 도로명 주소
    city?: string;           // 시/도
    district?: string;       // 구/군
    town?: string;           // 동/읍/면
    mainAddressNo?: string;  // 지번주소 주번지
    subAddressNo?: string;   // 지번주소 부번지
    roadName?: string;       // 도로명
    mainBuildingNo?: string; // 도로명주소 건물번호
    subBuildingNo?: string;  // 도로명주소 건물번호 부번
    zipCode?: string;        // 우편번호
    
    // 백엔드에서는 region 객체로 참조하지만 API 응답에서는 아래와 같이 포함될 수 있음
    cortarName?: string;     // 법정동 이름
}

export interface ArticleListResponse {
    content: ArticleResponse[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    last: boolean;
}

export interface ArticleListParams {
    page?: number;
    size?: number;
    sort?: string;
    excludeIds?: number[];
    realEstateType?: RealEstateType[];
    tradeType?: TradeType[];
    name?: string;
    cortarNo?: string;
    cortarName?: string;
    minPrice?: number;
    maxPrice?: number;
}

// 새로 추가할 Tag 타입
export interface Tag {
    id: number;
    name: string;
}