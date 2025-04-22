import axios from "axios"
import api from "./api"
import type { AxiosResponse } from "axios"

// API 응답 타입
export interface ApiResponse<T> {
    success: boolean
    data: T | null
    error: {
        message: string
        code?: string
        details?: any
    } | null
}

// 고객 생성 요청 타입
export interface CreateCustomerRequest {
    name: string
    birthday: string // LocalDate -> ISO 문자열 형식 (YYYY-MM-DD)
    phone: string
    email: string
    job: string
    isVip: boolean
    memo: string
    consent: boolean
    interestProperty?: string
    interestLocation?: string
    assetStatus?: string
}

// 고객 수정 요청 타입
export interface UpdateCustomerRequest {
    name: string
    birthday: string // LocalDate -> ISO 문자열 형식 (YYYY-MM-DD)
    phone: string
    email: string
    job: string
    isVip: boolean
    memo: string
    consent: boolean
    interestProperty?: string
    interestLocation?: string
    assetStatus?: string
}

// 고객 히스토리 타입
export interface History {
    id: string;
    type: 'CONSULTATION' | 'CONTRACT' | 'MESSAGE' | 'SURVEY';
    date: string;
    purpose?: string;
    startDate?: string;
    endDate?: string;
    content?: string;
    sendStatus?: string;
}

// 고객 응답 타입
export interface CustomerResponse {
    id: number
    name: string
    birthday: string
    phone: string
    email: string
    job: string
    isVip: boolean
    memo: string
    consent: boolean
    createdAt: string
    updatedAt: string
    interestProperty?: string
    interestLocation?: string
    assetStatus?: string
    history: History[]
}

// 고객 히스토리 응답 타입
export interface CustomerHistoryResponse {
    customer: CustomerResponse;
    history: History[];
}

//Page 응답 타입
export interface PageResponse<T>{
    content: T[]
    totalPages: number 
    totalElements: number
    number: number // 현재 페이지 번호 (0부터 시작)
    size: number // 페이지당 데이터 수
    // sort: Sort // 필요하다면 정렬 정보 추가
    // pageable: Pageable // 필요하다면 페이지 정보 추가
    first: boolean
    last: boolean
    empty: boolean
}

// 고객 생성
export const createCustomer = async (
    customerData: CreateCustomerRequest,
): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.post(`/api/customers`, customerData)
}

// 고객 일괄 생성 (엑셀 파일 업로드)
export const bulkCreateCustomers = async (file: File): Promise<AxiosResponse<ApiResponse<void>>> => {
    const formData = new FormData()
    formData.append("file", file)

    return api.post(`/api/customers/bulk`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
}

// 고객 삭제
export const deleteCustomer = async (customerId: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete(`/api/customers/${customerId}`)
}

// 고객 수정
export const updateCustomer = async (
    customerId: number,
    customerData: UpdateCustomerRequest,
): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.patch(`/api/customers/${customerId}`, customerData)
}

// // 모든 고객 조회
// export const getCustomers = async (p0: { page: number; size: number; sort: string }): Promise<AxiosResponse<ApiResponse<CustomerResponse[]>>> => {
//     return api.get(`/api/customers`)
// }
// 모든 고객 조회 (페이지네이션 적용)
export const getCustomers = async (page: number = 0, size: number = 10): Promise<AxiosResponse<ApiResponse<PageResponse<CustomerResponse>>>> => {
    return api.get(`/api/customers?page=${page}&size=${size}`)
}

// 고객 상세 조회
export const getCustomerById = async (customerId: number): Promise<AxiosResponse<ApiResponse<CustomerHistoryResponse>>> => {
    return api.get(`/api/customers/${customerId}`)
}

// Export both individual functions and the object for backward compatibility
export const customerApi = {
    createCustomer,
    bulkCreateCustomers,
    deleteCustomer,
    updateCustomer,
    getCustomers,
    getCustomerById,
    
    // Add new method for downloading excel format
    getExcelFormat: () => {
        return api.get<ApiResponse<string>>(`api/customers/bulk`)
    },
}

