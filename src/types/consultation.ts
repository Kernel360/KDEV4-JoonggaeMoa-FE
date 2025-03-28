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

// 상담 생성 요청 타입을 백엔드 구조에 맞게 수정
export interface ConsultationCreateRequest {
    customerId: number
    date: string // "yyyy-MM-dd HH:mm" 형식
    // 아래 필드들은 백엔드에서 아직 처리하지 않지만 프론트엔드에서 사용 중
    purpose?: string
    interestProperty?: string
    interestLocation?: string
    contractType?: string
    assetStatus?: string
    memo?: string
    consultationStatus?: string
}

// 상담 수정 요청 - 백엔드 API와 일치하도록 수정
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

// 백엔드에서 제공하는 상담 응답 형태로 변경
export interface ConsultationResponse {
    consultationId: number
    customerId: number
    customerName: string
    customerPhone: string
    date: string
    purpose?: string
    interestProperty?: string
    interestLocation?: string
    contractType?: string
    assetStatus?: string
    memo?: string
    consultationStatus: string
    result?: string
    nextAction?: string
    consultationType?: ConsultationType
}

