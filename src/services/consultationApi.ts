import api from "./api"
import type { AxiosResponse } from "axios"
import type {
    ConsultationCreateRequest,
    ConsultationUpdateRequest,
    ConsultationResultRequest,
    ConsultationResponse,
} from "../types/consultation"
import type { ApiResponse } from "../types/api"

// 현재 로그인한 에이전트 ID 가져오기
const getAgentId = (): number => {
    // 실제 구현에서는 AuthContext에서 가져와야 함
    return 1
}

// 상담 생성
export const createConsultation = async (
    consultationData: ConsultationCreateRequest,
): Promise<AxiosResponse<ApiResponse<ConsultationResponse>>> => {
    const agentId = getAgentId()
    return api.post(`/api/agents/${agentId}/consultations`, consultationData)
}

// 상담 삭제
export const deleteConsultation = async (consultationId: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    const agentId = getAgentId()
    return api.delete(`/api/agents/${agentId}/consultations/${consultationId}`)
}

// 상담 수정
export const updateConsultation = async (
    consultationId: number,
    consultationData: ConsultationUpdateRequest,
): Promise<AxiosResponse<ApiResponse<ConsultationResponse>>> => {
    const agentId = getAgentId()
    return api.patch(`/api/agents/${agentId}/consultations/${consultationId}`, consultationData)
}

// 상담 결과 업데이트
export const updateConsultationResult = async (
    consultationId: number,
    resultData: ConsultationResultRequest,
): Promise<AxiosResponse<ApiResponse<ConsultationResponse>>> => {
    const agentId = getAgentId()
    return api.patch(`/api/agents/${agentId}/consultations/${consultationId}/result`, resultData)
}

// 모든 상담 조회
export const getAllConsultations = async (): Promise<AxiosResponse<ApiResponse<any[]>>> => {
    const agentId = getAgentId()
    return api.get(`/api/agents/${agentId}/consultations`)
}

// 상담 상세 조회
export const getConsultationById = async (consultationId: number): Promise<AxiosResponse<ApiResponse<any>>> => {
    const agentId = getAgentId()
    return api.get(`/api/agents/${agentId}/consultations/${consultationId}`)
}

// 오늘 예정된 상담 조회
export const getTodayConsultations = async (): Promise<AxiosResponse<ApiResponse<ConsultationResponse[]>>> => {
    const agentId = getAgentId()
    return api.get(`/api/agents/${agentId}/consultations/today`)
}

// 날짜별 상담 조회
export const getConsultationsByDate = async (
    date: string, // YYYY-MM-DD 형식
): Promise<AxiosResponse<ApiResponse<ConsultationResponse[]>>> => {
    const agentId = getAgentId()
    return api.get(`/api/agents/${agentId}/consultations/date/${date}`)
}

// 고객별 상담 조회
export const getConsultationsByCustomer = async (
    customerId: number,
): Promise<AxiosResponse<ApiResponse<ConsultationResponse[]>>> => {
    const agentId = getAgentId()
    return api.get(`/api/agents/${agentId}/customers/${customerId}/consultations`)
}

