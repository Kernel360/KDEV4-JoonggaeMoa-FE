import api from "./api"
import type { AxiosResponse } from "axios"
import type { ApiResponse } from "./customerApi"

// 메시지 템플릿 요청 타입
export interface MessageTemplateRequest {
    category: string
    content: string
}

// 메시지 템플릿 응답 타입
export interface MessageTemplateResponse {
    category: string
    content: string
    title?: string // 프론트엔드에서 사용하기 위한 필드
}

// 메시지 템플릿 조회
const getMessageTemplate = async (category: string): Promise<AxiosResponse<ApiResponse<MessageTemplateResponse>>> => {
    return api.get(`/api/message/template?category=${category}`)
}

// 메시지 템플릿 수정
const updateMessageTemplate = async (
    templateData: MessageTemplateRequest,
): Promise<AxiosResponse<ApiResponse<MessageTemplateResponse>>> => {
    return api.patch(`/api/message/template`, templateData)
}

// 메시지 템플릿 삭제
const deleteMessageTemplate = async (category: string): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete(`/api/message/template?category=${category}`)
}

// 모든 함수를 객체로 묶어서 export
export const messageTemplateApi = {
    getMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
}

