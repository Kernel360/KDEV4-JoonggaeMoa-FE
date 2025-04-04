import api from "./api"
import type { AxiosResponse } from "axios"
import type { ConsultationResultRequest, ConsultationResponse, ConsultationMonthInfo } from "../types/consultation"
import type { ApiResponse } from "../types/api"

// 상담 생성 - 백엔드 API 구조에 맞게 수정 (필수 필드만 받도록)
export const createConsultation = async (consultationData: {
    customerId: number
    date: string
}): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.post(`/api/consultations`, consultationData)
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
    return api.patch(`/api/consultations/${consultationId}`, consultationData)
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
    return api.patch(`/api/consultations/${consultationId}`, consultationData)
}

// 상담 상태 수정 - 백엔드 API 구조에 맞게 수정
export const updateConsultationStatus = async (
    consultationId: number,
    consultationStatus: string,
): Promise<AxiosResponse<ApiResponse<void>>> => {
    // 백엔드 API 구조에 맞게 수정 필요
    // 현재는 쿼리 파라미터로 전달하지만, 백엔드 API가 요청 본문을 기대한다면 수정 필요
    return api.patch(`/api/consultations/${consultationId}`, { consultationStatus })
}

// 상담 결과 업데이트
export const updateConsultationResult = async (
    consultationId: number,
    resultData: ConsultationResultRequest,
): Promise<AxiosResponse<ApiResponse<void>>> => {
    // 백엔드 API 구조에 맞게 수정 필요
    return api.patch(`/api/consultations/${consultationId}/result`, resultData)
}

// 상담 상세 조회
export const getConsultationById = async (
    consultationId: number,
): Promise<AxiosResponse<ApiResponse<ConsultationResponse>>> => {
    console.log(`API 호출: /api/consultations/${consultationId}`) // 로그 추가
    try {
        const response = await api.get(`/api/consultations/${consultationId}`)
        console.log("상담 상세 API 응답:", response.data)
        return response
    } catch (error) {
        console.error("상담 상세 API 오류:", error)
        throw error
    }
}

// 오늘 예정된 상담 조회
export const getTodayConsultations = async (): Promise<AxiosResponse<ApiResponse<ConsultationResponse[]>>> => {
    return api.get(`/api/consultations/today`)
}

// 날짜별 상담 조회
export const getConsultationsByDate = async (date: string): Promise<ApiResponse<ConsultationResponse[]>> => {
    try {
        const response = await api.get<ApiResponse<ConsultationResponse[]>>(`/api/consultations/date?date=${date}`);
        return response.data;
    } catch (error: any) {
        console.error("날짜별 상담 조회 오류:", error);
        return {
            success: false,
            data: [],
            error: {
                code: 'FETCH_CONSULTATIONS_BY_DATE_FAILED',
                message: error.message || '날짜별 상담 조회 실패',
            },
        };
    }
}

// 고객별 상담 조회
export const getConsultationsByCustomer = async (
    customerId: number,
): Promise<AxiosResponse<ApiResponse<ConsultationResponse[]>>> => {
    return api.get(`/api/customers/${customerId}/consultations`)
}

// 상담 삭제
const deleteConsultation = (consultationId: number) => {
    return api.delete(`/api/consultations/${consultationId}`)
}

// 월별 상담 정보 조회
export const getConsultationMonthInfo = async (month: string): Promise<AxiosResponse<ApiResponse<ConsultationMonthInfo>>> => {
    return api.get(`/api/consultations/month-inform?month=${month}`);
};

export const consultationApi = {
    createConsultation,
    updateConsultation,
    updateConsultationInfo,
    updateConsultationStatus,
    updateConsultationResult,
    getConsultationById,
    getTodayConsultations,
    getConsultationsByDate,
    getConsultationsByCustomer,
    deleteConsultation,
    getConsultationMonthInfo
};