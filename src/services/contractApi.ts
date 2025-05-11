import api from "./api"
import type {AxiosResponse} from "axios"
import type {ApiResponse} from "./customerApi"
import type {ContractResponse, CreateContractRequest, ExpiredContractResponse} from "../types/contract"
import type {PageResponse} from "../types/page"

// 계약 생성
export const createContract = async (
    contractData: CreateContractRequest,
    file: File,
): Promise<AxiosResponse<ApiResponse<string>>> => {
    const formData = new FormData()
    formData.append("contractData", new Blob([JSON.stringify(contractData)], {type: "application/json"}))
    formData.append("file", file)

    return api.post(`/api/contracts`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    })
}

// 계약 삭제
export const deleteContract = async (contractId: string): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete(`/api/contracts/${contractId}`)
}

// 모든 계약 조회 (페이지네이션 적용)
export const getAllContracts = async (
    page: number = 0,
    size: number = 10,
    keyword?: string
): Promise<AxiosResponse<ApiResponse<PageResponse<ContractResponse>>>> => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sort: 'createdAt,desc'
    });

    if (keyword) {
        params.append('keyword', keyword);
    }

    return api.get(`/api/contracts?${params.toString()}`);
}

// 계약 상세 조회
export const getContractById = async (contractId: string): Promise<AxiosResponse<ApiResponse<ContractResponse>>> => {
    return api.get(`/api/contracts/${contractId}`)
}

// Export both individual functions and the object for backward compatibility
export const contractApi = {
    createContract,
    deleteContract,
    getAllContracts,
    getContractById,
    getExpiredContracts: async (): Promise<ExpiredContractResponse> => {
        const response = await api.get<ApiResponse<ExpiredContractResponse>>('/api/dashboard/expired-contract');
        return response.data.data;
    },
}

