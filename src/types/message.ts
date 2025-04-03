// 메시지 상태 enum
export enum MessageStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    FAILED = "FAILED",
}

// 메시지 타입 - 백엔드 DTO와 일치하도록 업데이트
export interface Message {
    id: number
    customerId: number
    customerName: string
    content: string
    createdAt: string
    sendStatus: MessageStatus
}

// 예약된 메시지 타입 - 백엔드 응답과 일치하도록 업데이트
export interface ReservedMessage {
    id: number
    customerId: number
    customerName: string
    content: string
    createdAt: string
    sendStatus: MessageStatus
}

export interface ReservedMessageResponse {
    content: ReservedMessage[]
    totalPages: number
    totalElements: number
    last: boolean
    size: number
    number: number
}

// 메시지 템플릿 타입
export interface MessageTemplate {
    id: number
    title: string
    content: string
}

// 메시지 생성 요청 타입 - 백엔드 요청과 일치하도록 업데이트
export interface MessageCreateRequest {
    content: string
    sendAt: string
    customerIdList: number[]
}

// 메시지 목록 응답 타입
export interface MessageListResponse {
    content: Message[]
    totalPages: number
    totalElements: number
    size: number
    number: number
}

