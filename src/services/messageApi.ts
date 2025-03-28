import api from "./api"
import type { AxiosResponse } from "axios"
import type { ApiResponse } from "./customerApi"
import type { MessageCategory } from "../types/message"

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

// 현재 로그인한 에이전트 ID 가져오기
const getAgentId = (): number => {
    // 임시로 1을 반환, 실제로는 로그인한 사용자의 ID를 반환해야 함
    return 1
}

// 메시지 목록 조회
const getMessages = async (lastMessageId?: number): Promise<AxiosResponse<ApiResponse<MessageResponse[]>>> => {
    const agentId = getAgentId()
    const url = `/api/agents/${agentId}/messages${lastMessageId ? `?lastMessageId=${lastMessageId}` : ""}`
    return api.get(url)
}

// 메시지 생성 (예약)
const createMessage = async (messageData: MessageRequest): Promise<AxiosResponse<ApiResponse<void>>> => {
    const agentId = getAgentId()
    return api.post(`/api/agents/${agentId}/messages`, messageData)
}

// 모든 함수를 객체로 묶어서 export
export const messageApi = {
    getMessages,
    createMessage,
}

