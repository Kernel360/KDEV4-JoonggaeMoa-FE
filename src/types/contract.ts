// 계약 관련 타입 정의

// 계약 생성 요청 타입
export interface CreateContractRequest {
    landlordId: number
    tenantId: number
    createdAt: string // LocalDate -> ISO 문자열 형식 (YYYY-MM-DD)
    expiredAt: string // LocalDate -> ISO 문자열 형식 (YYYY-MM-DD)
}

// 계약 수정 요청 타입
export interface UpdateContractRequest {
    createdAt: string // LocalDate -> ISO 문자열 형식 (YYYY-MM-DD)
    expiredAt: string // LocalDate -> ISO 문자열 형식 (YYYY-MM-DD)
}

// 계약 응답 타입
export interface ContractResponse {
    id: number
    landlordId: number
    tenantId: number
    createdAt: string // LocalDate -> ISO 문자열 형식 (YYYY-MM-DD)
    expiredAt: string // LocalDate -> ISO 문자열 형식 (YYYY-MM-DD)
    url: string // 계약서 파일 URL
}

