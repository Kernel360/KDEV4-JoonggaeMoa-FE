// 상담 관련 타입 정의

// 상담 상태 enum을 백엔드와 일치하도록 수정
export enum ConsultationStatus {
    WAITING = "WAITING", // 상담 예약 대기
    CONFIRMED = "CONFIRMED", // 예약 확정
    CANCELED = "CANCELED", // 예약 취소
    COMPLETED = "COMPLETED", // 진행 완료
}

// 상담 유형
export enum ConsultationType {
    VISIT = "VISIT", // 방문 상담
    CALL = "CALL", // 전화 상담
    VIDEO = "VIDEO", // 화상 상담
}

export interface ConsultationCreateRequest {
    customerId: number
    date: string // "yyyy-MM-dd HH:mm" 형식
    purpose?: string
    interestProperty?: string
    interestLocation?: string
    contractType?: string
    assetStatus?: string
    memo?: string
    consultationStatus?: string
}

export interface ConsultationUpdateRequest {
    date?: string // "yyyy-MM-dd HH:mm" 형식
    purpose?: string
    interestProperty?: string
    interestLocation?: string
    contractType?: string
    assetStatus?: string
    memo?: string
    consultationStatus?: string
}

// 상담 결과 요청
export interface ConsultationResultRequest {
    result: string
    nextAction?: string
}

// 고객 정보
export interface CustomerInfo {
    id: number
    name: string
    phone: string
    email?: string
}

// Page 타입 정의
export interface Page<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
        sort: {
            empty: boolean;
            sorted: boolean;
            unsorted: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    totalElements: number;
    totalPages: number;
    last: boolean;
    size: number;
    number: number;
    sort: {
        empty: boolean;
        sorted: boolean;
        unsorted: boolean;
    };
    numberOfElements: number;
    first: boolean;
    empty: boolean;
}

// 기존 ConsultationResponse 인터페이스 제거
// export interface ConsultationResponse { ... }

// 새로운 ConsultationResponse 인터페이스 정의
export interface ConsultationResponse {
    consultationId: number;
    customerId: number;
    customerName: string;
    customerPhone: string;
    date: string;
    purpose: string;
    memo: string;
    consultationStatus: ConsultationStatus;
}

export interface ConsultationMonthInfo {
    consultationAll: number;
    consultationWaiting: number;
    consultationConfirmed: number;
    consultationCancelled: number;
    consultationCompleted: number;
    daysCount: number[];
}

export interface ConsultationHistoryDto {
    customer: CustomerResponse;
    consultations: Page<ConsultationResponse>;
}

export interface CustomerResponse {
    id: number;
    name: string;
    birthday: string;
    phone: string;
    email: string;
    job: string;
    isVip: boolean;
    memo: string;
    consent: boolean;
    interestProperty?: string;
    interestLocation?: string;
    assetStatus?: string;
}
