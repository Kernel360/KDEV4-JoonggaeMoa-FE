// 상담 관련 타입 정의

// 상담 상태
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

// 상담 생성 요청
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

// 상담 수정 요청
export interface ConsultationUpdateRequest {
    consultationType?: ConsultationType
    scheduledAt?: string
    memo?: string
    status?: ConsultationStatus
    propertyInterest?: string
    budget?: string
    result?: string // 상담 결과
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

// 상담 응답
export interface ConsultationResponse {
    id: number
    customer: CustomerInfo
    consultationType: ConsultationType
    scheduledAt: string
    memo: string
    status: ConsultationStatus
    propertyInterest?: string
    budget?: string
    result?: string
    nextAction?: string
    createdAt: string
    updatedAt: string
}

