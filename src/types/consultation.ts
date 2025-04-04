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

export interface ConsultationResponse {
    customerEmail: string
    id: number
    consultationId?: number  // 백엔드 응답용
    customerId: number
    customerName: string
    customerPhone: string
    customer: {
        id: number
        name: string
        phone: string
        email?: string
    }
    content: string
    consultationType: ConsultationType
    date: string
    scheduledAt: string
    purpose?: string
    interestProperty?: string
    interestLocation?: string
    contractType?: string
    assetStatus?: string
    memo?: string
    consultationStatus: ConsultationStatus
    status?: ConsultationStatus  // 프론트엔드용
    result?: string
    nextAction?: string
    propertyInterest?: string
    budget?: string
    createdAt: string
    updatedAt: string
}


export interface ConsultationDateCount {
    success: boolean;
    data: number[];
    error: null | string;
}


