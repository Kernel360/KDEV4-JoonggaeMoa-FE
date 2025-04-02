import api from "./api"
import type { AxiosResponse } from "axios"
import type { ApiResponse } from "./customerApi"
import type { MessageCategory } from "../types/message"
import type { ReservedMessage } from "../types/message"

// 메시지 생성 요청 타입
export interface MessageRequest {
    content: string
    sendAt: string
    customerIdList: number[]
    category?: MessageCategory
}

// 메시지 응답 타입
export interface MessageResponse {
    id: number
    customerId: number
    customerName: string
    customerPhone?: string
    content: string
    createdAt: string
    sendStatus: string
    category?: MessageCategory
}

// 메시지 목록 조회 (과거 전송된 메시지)
const getMessages = async (params: { page?: number; size?: number } = {}): Promise<AxiosResponse<ApiResponse<MessageResponse[]>>> => {
    const url = `/api/messages${params.page ? `?page=${params.page}` : ""}${params.page && params.size ? `&size=${params.size}` : (params.size ? `?size=${params.size}` : "")}`
    return api.get(url)
}

// 예약된 메시지 목록 조회
const getReservedMessages = async (params: { page?: number; size?: number } = {}): Promise<AxiosResponse<ApiResponse<ReservedMessage[]>>> => {
    const url = `/api/reserved-message${params.page ? `?page=${params.page}` : ""}${params.page && params.size ? `&size=${params.size}` : (params.size ? `?size=${params.size}` : "")}`
    return api.get(url)
}

// 메시지 생성 (예약)
const createMessage = async (messageData: MessageRequest): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.post(`/api/messages`, messageData)
}

// 모든 함수를 객체로 묶어서 export
// Remove the duplicate getMessages function and update the export
export const messageApi = {
    getMessages: async (params: { page: number; size: number }) => {
        return api.get('/api/messages', {
            params: {
                page: params.page,
                size: params.size,
                sort: 'createdAt,desc'
            }
        })
    },
    getReservedMessages,
    createMessage,
}