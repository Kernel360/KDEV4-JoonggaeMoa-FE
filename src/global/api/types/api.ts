export interface ApiError {
    code: number
    message: string
}

export interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
    error?: ApiError
}

export interface AnswerRequest {
    name: string
    email: string
    phone: string
    consent: boolean
    questions: string[]
    answers: string[]
}

