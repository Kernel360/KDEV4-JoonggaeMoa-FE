// 고객 타입
export interface Customer {
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

