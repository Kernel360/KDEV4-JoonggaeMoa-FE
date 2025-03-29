import api from "./api"
import type { AxiosResponse } from "axios"
import type { ApiResponse } from "./customerApi"
import type { CreateContractRequest, UpdateContractRequest, ContractResponse } from "../types/contract"

// 계약 생성
export const createContract = async (
    contractData: CreateContractRequest,
    file: File,
): Promise<AxiosResponse<ApiResponse<string>>> => {
    const formData = new FormData()
    formData.append("contractData", new Blob([JSON.stringify(contractData)], { type: "application/json" }))
    formData.append("file", file)

    return api.post(`/api/contracts`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
}

// 계약 삭제
export const deleteContract = async (contractId: number): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete(`/api/contracts/${contractId}`)
}

// 계약 수정
export const updateContract = async (
    contractId: number,
    contractData: UpdateContractRequest,
    file: File,
): Promise<AxiosResponse<ApiResponse<void>>> => {
    const formData = new FormData()
    formData.append("contractData", new Blob([JSON.stringify(contractData)], { type: "application/json" }))
    formData.append("file", file)

    return api.patch(`/api/contracts/${contractId}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
}

// 모든 계약 조회
export const getAllContracts = async (): Promise<AxiosResponse<ApiResponse<ContractResponse[]>>> => {
    return api.get(`/api/contracts`)
}

// 계약 상세 조회
export const getContractById = async (contractId: number): Promise<AxiosResponse<ApiResponse<ContractResponse>>> => {
    return api.get(`/api/contracts/${contractId}`)
}

// Export both individual functions and the object for backward compatibility
export const contractApi = {
    createContract,
    deleteContract,
    updateContract,
    getAllContracts,
    getContractById,
}

