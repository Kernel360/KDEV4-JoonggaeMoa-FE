// 메시지 상태 enum
export enum MessageStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    FAILED = "FAILED",
}

// 메시지 카테고리 enum - 새로운 카테고리로 업데이트
export enum MessageCategory {
    BIRTHDAY = "BIRTHDAY",
    EXPIRATION = "EXPIRATION",
    WELCOME = "WELCOME",
}

// 메시지 타입
export interface Message {
    id: number
    customerId: number
    customerName: string
    content: string
    createdAt: string
    sendStatus: MessageStatus
}

// 메시지 템플릿 타입
export interface MessageTemplate {
    category: string
    content: string
}

// 메시지 생성 요청 타입
export interface MessageCreateRequest {
    content: string
    sendAt: string
    customerIdList: number[]
    category?: MessageCategory // 카테고리 필드 추가
}

// 메시지 목록 응답 타입
export interface MessageListResponse {
    content: Message[]
    totalPages: number
    totalElements: number
    size: number
    number: number
}

