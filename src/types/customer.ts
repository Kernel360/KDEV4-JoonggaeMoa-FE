// 고객 정보 타입 정의

export interface CustomerResponse {
    id: number
    name: string
    birthday?: string
    phone: string
    email?: string
    job?: string
    isVip: boolean
    memo?: string
    consent: boolean
    createdAt: string
    updatedAt: string
}

