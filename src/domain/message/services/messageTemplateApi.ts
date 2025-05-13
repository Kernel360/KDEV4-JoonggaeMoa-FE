import api from "@/global/api/services/api"
import type {AxiosResponse} from "axios"
import type {ApiResponse} from "@/global/api/types/api"

// 메시지 템플릿 요청 타입
export interface MessageTemplateRequest {
    title: string
    content: string
}

// 메시지 템플릿 응답 타입
export interface MessageTemplateResponse {
    id: number
    title: string
    content: string
}

// 메시지 템플릿 API 함수들
export const messageTemplateApi = {
    // 템플릿 목록 조회
    getMessageTemplates: async (): Promise<AxiosResponse<ApiResponse<MessageTemplateResponse[]>>> => {
        return api.get("/api/messages/templates")
    },

    // 템플릿 생성
    createMessageTemplate: async (templateData: MessageTemplateRequest): Promise<AxiosResponse<ApiResponse<void>>> => {
        return api.post("/api/messages/templates", templateData)
    },

    // 템플릿 수정
    updateMessageTemplate: async (
        templateId: number,
        templateData: MessageTemplateRequest,
    ): Promise<AxiosResponse<ApiResponse<void>>> => {
        return api.patch(`/api/messages/templates/${templateId}`, templateData)
    },

    // 템플릿 삭제
    deleteMessageTemplate: async (templateId: number): Promise<AxiosResponse<ApiResponse<void>>> => {
        return api.delete(`/api/messages/templates/${templateId}`)
    },
}

