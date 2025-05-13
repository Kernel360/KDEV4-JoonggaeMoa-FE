import api from "@/global/api/services/api"
import type {AxiosResponse} from "axios"
import type {ApiResponse} from "@/global/api/types/api"

// 메시지 응답 타입
export interface MessageResponse {
    id: number
    customerId: number
    customerName: string
    customerPhone: string
    content: string
    createdAt: string
    sendAt: string
    sendStatus: string
}

// 예약 메시지 요청 타입
export interface MessageCreateRequest {
    content: string
    sendAt: string
    customerIdList: number[]
}

// 메시지 수정 요청 타입
export interface MessageUpdateRequest {
    content: string
    sendAt: string
}

// 예약 메시지 응답 타입
export interface ReservedMessageResponse {
    id: number
    customerId: number
    customerName: string
    customerPhone: string
    content: string
    createdAt: string
    sendAt: string
    sendStatus: string
}

// 페이지 응답 타입
export interface PageResponse<T> {
    content: T[]
    totalPages: number
    totalElements: number
    last: boolean
    size: number
    number: number
}

export interface MessagePaginationParams {
    page: number
    size: number
    searchType?: "name" | "phone"
    keyword?: string
}

export interface MessagePageResponse {
    content: ReservedMessageResponse[]
    totalElements: number
    totalPages: number
    number: number
    size: number
    first: boolean
    last: boolean
}

// 메시지 API 함수들
export const messageApi = {
    // 전송된 메시지 목록 조회
    getMessages: async (
        params?: MessagePaginationParams,
    ): Promise<AxiosResponse<ApiResponse<PageResponse<MessageResponse>>>> => {
        return api.get("/api/all-messages", {params})
    },

    // 메시지 예약/전송
    createMessage: async (data: MessageCreateRequest): Promise<AxiosResponse<ApiResponse<void>>> => {
        return api.post("/api/messages", data)
    },

    // 예약된 메시지 목록 조회
    getReservedMessages: async (params: MessagePaginationParams) => {
        const response = await api.get<ApiResponse<MessagePageResponse>>("/api/all-messages", {
            params: {
                page: params.page,
                size: params.size,
                "search-type": params.searchType,
                keyword: params.keyword
            }
        })
        return response
    },

    // 메시지 수정
    updateMessage: async (reservedMessageId: number, data: MessageUpdateRequest): Promise<AxiosResponse<ApiResponse<void>>> => {
        return api.patch(`/api/messages/${reservedMessageId}`, data)
    },

    // 메시지 삭제
    deleteMessage: async (reservedMessageId: number): Promise<AxiosResponse<ApiResponse<void>>> => {
        return api.delete(`/api/messages/${reservedMessageId}`)
    },
}