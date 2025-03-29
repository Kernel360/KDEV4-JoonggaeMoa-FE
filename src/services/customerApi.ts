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

// 모든 고객 조회
export const getCustomers = async (): Promise<AxiosResponse<ApiResponse<CustomerResponse[]>>> => {
    return api.get(`/api/customers`)
}

// 고객 상세 조회
export const getCustomerById = async (customerId: number): Promise<AxiosResponse<ApiResponse<CustomerResponse>>> => {
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
}

