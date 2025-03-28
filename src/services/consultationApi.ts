import api from "./api"
import type { AxiosResponse } from "axios"
import type { ConsultationResultRequest, ConsultationResponse } from "../types/consultation"
import type { ApiResponse } from "../types/api"

// 현재 로그인한 에이전트 ID 가져오기
const getAgentId = (): number => {
    // 실제 구현에서는 AuthContext에서 가져와야 함
    return 1
}

// 상담 생성 - 백엔드 API 구조에 맞게 수정 (필수 필드만 받도록)
export const createConsultation = async (consultationData: {
    customerId: number
    date: string
}): Promise<AxiosResponse<ApiResponse<void>>> => {
    const agentId = getAgentId()
    return api.post(`/api/agents/${agentId}/consultations`, consultationData)
}

// 상담 삭제
export const deleteConsultation = async (consultationId: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    const agentId = getAgentId()
    return api.delete(`/api/agents/${agentId}/consultations/${consultationId}`)
}

// 상담 수정 - 백엔드 API 구조에 맞게 수정
export const updateConsultation = async (
    consultationId: number,
    consultationData: {
        date?: string
        purpose?: string
        interestProperty?: string
        interestLocation?: string
        contractType?: string
        assetStatus?: string
        memo?: string
        consultationStatus?: string
    },
): Promise<AxiosResponse<ApiResponse<void>>> => {
    const agentId = getAgentId()
    return api.patch(`/api/agents/${agentId}/consultations/${consultationId}`, consultationData)
}

// 상담 정보 수정 (상태 제외) - 백엔드 API 구조에 맞게 수정
export const updateConsultationInfo = async (
    consultationId: number,
    consultationData: {
        date?: string
        purpose?: string
        interestProperty?: string
        interestLocation?: string
        contractType?: string
        assetStatus?: string
        memo?: string
    },
): Promise<AxiosResponse<ApiResponse<void>>> => {
    const agentId = getAgentId()
    return api.patch(`/api/agents/${agentId}/consultations/${consultationId}`, consultationData)
}

// 상담 상태 수정 - 백엔드 API 구조에 맞게 수정
export const updateConsultationStatus = async (
    consultationId: number,
    consultationStatus: string,
): Promise<AxiosResponse<ApiResponse<void>>> => {
    const agentId = getAgentId()
    // 백엔드 API 구조에 맞게 수정 필요
    // 현재는 쿼리 파라미터로 전달하지만, 백엔드 API가 요청 본문을 기대한다면 수정 필요
    return api.patch(`/api/agents/${agentId}/consultations/${consultationId}`, { consultationStatus })
}

// 상담 결과 업데이트
export const updateConsultationResult = async (
    consultationId: number,
    resultData: ConsultationResultRequest,
): Promise<AxiosResponse<ApiResponse<void>>> => {
    const agentId = getAgentId()
    // 백엔드 API 구조에 맞게 수정 필요
    return api.patch(`/api/agents/${agentId}/consultations/${consultationId}/result`, resultData)
}

// 모든 상담 조회
export const getConsultations = async (): Promise<AxiosResponse<ApiResponse<ConsultationResponse[]>>> => {
    const agentId = getAgentId()
    return api.get(`/api/agents/${agentId}/consultations`)
}

// 상담 상세 조회
export const getConsultationById = async (
    consultationId: number,
): Promise<AxiosResponse<ApiResponse<ConsultationResponse>>> => {
    const agentId = getAgentId()
    console.log(`API 호출: /api/agents/${agentId}/consultations/${consultationId}`) // 로그 추가
    try {
        const response = await api.get(`/api/agents/${agentId}/consultations/${consultationId}`)
        console.log("상담 상세 API 응답:", response.data)
        return response
    } catch (error) {
        console.error("상담 상세 API 오류:", error)
        throw error
    }
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

// Export both individual functions and the object for backward compatibility
export const consultationApi = {
    createConsultation,
    deleteConsultation,
    updateConsultation,
    updateConsultationInfo,
    updateConsultationStatus,
    updateConsultationResult,
    getConsultations,
    getConsultationById,
    getTodayConsultations,
    getConsultationsByDate,
    getConsultationsByCustomer,
}

