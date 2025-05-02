import api from "./api"
import type { AxiosResponse } from "axios"
import type { ConsultationResultRequest, ConsultationResponse, ConsultationMonthInfo, ConsultationHistoryDto } from "../types/consultation"
import type { ApiResponse } from "../types/api"
import axios from "axios"
import { ConsultationStatus } from "../types/consultation"

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
    return api.patch(`/api/consultations/${consultationId}/status?consultationStatus=${consultationStatus}`)
}

// 상담 결과 업데이트
export const updateConsultationResult = async (
    consultationId: number,
    resultData: ConsultationResultRequest,
): Promise<AxiosResponse<ApiResponse<void>>> => {
    // 백엔드 API 구조에 맞게 수정 필요
    return api.patch(`/api/consultations/${consultationId}/result`, resultData)
}

// 상담 ID로 상담 내역 조회
export const getConsultationHistoryByConsultationId = async (
    consultationId: number,
    page: number = 0,
    size: number = 5
): Promise<AxiosResponse<ApiResponse<ConsultationHistoryDto>>> => {
    return await api.get(`/api/consultations/${consultationId}/customers`, {
        params: {
            page,
            size,
            sort: 'date,desc'
        }
    })
}

// 오늘 예정된 상담 조회
export const getTodayConsultations = async (): Promise<AxiosResponse<ApiResponse<ConsultationResponse[]>>> => {
    return api.get(`/api/consultations/today`)
}

// 날짜별 상담 조회
export const getConsultationsByDate = async (date: string): Promise<AxiosResponse<ApiResponse<ConsultationResponse[]>>> => {
    return await api.get(`/api/consultations/date?date=${date}`);
}

// 상담 삭제
const deleteConsultation = (consultationId: number) => {
    return api.delete(`/api/consultations/${consultationId}`)
}

// 상담 ID로 상담 정보 조회
export const getConsultationById = async (consultationId: number): Promise<AxiosResponse<ApiResponse<ConsultationResponse>>> => {
    return api.get(`/api/consultations/${consultationId}`)
}

// 월별 상담 정보 조회
export const getConsultationMonthInfo = async (month: string): Promise<AxiosResponse<ApiResponse<ConsultationMonthInfo>>> => {
    return api.get(`/api/consultations/month-inform?month=${month}`);
};

// 상태별 상담 목록 가져오기
export const getConsultationsByStatus = async (month: string, status: ConsultationStatus) : Promise<AxiosResponse<ApiResponse<ConsultationResponse[]>>> => {
    return api.get(`/api/consultations/status?month=${month}&status=${status}`)
}

export const consultationApi = {
    createConsultation,
    updateConsultation,
    updateConsultationInfo,
    updateConsultationStatus,
    updateConsultationResult,
    getConsultationHistoryByConsultationId,
    getTodayConsultations,
    getConsultationsByDate,
    deleteConsultation,
    getConsultationMonthInfo,
    getConsultationById,
    getConsultationsByStatus
};