// 설문 관련 타입 정의

// 질문 타입 (라디오, 체크박스, 텍스트 )
export enum QuestionType {
    RADIO = "RADIO",
    CHECKBOX = "CHECKBOX",
    TEXT = "TEXT",
}

// 질문 생성 요청
export interface QuestionCreateRequest {
    content: string
    type: string
    isRequired: boolean
    options: string[]
}

// 질문 수정 요청
export interface QuestionUpdateRequest {
    id?: number
    content: string
    type: string
    isRequired: boolean
    options: string[]
}

// 질문 응답
export interface QuestionResponse {
    id: number
    content: string
    type: string
    isRequired: boolean
    options: string[]
}

export interface PageResponse<T> {
    content: T[];
    pageable: {
        pageNumber: number;
        pageSize: number;
    };
    last: boolean;
    totalElements: number;
    totalPages: number;
}

// 설문 생성 요청
export interface SurveyCreateRequest {
    title: string
    description: string
    questionList: QuestionCreateRequest[]
}

// 설문 수정 요청
export interface SurveyUpdateRequest {
    title: string
    description: string
    questionList: QuestionUpdateRequest[]
}

// 설문 응답
export interface SurveyResponse {
    id: number
    title: string
    description: string
    questionList: QuestionResponse[]
}

// 고객 정보
export interface CustomerResponse {
    id: number
    name: string
    email: string
    phone: string
    consent: boolean
}

// 질문 답변
export interface QuestionAnswerResponse {
    question: string
    answer: string[]
}

// 설문 답변 요청
export interface AnswerRequest {
    name: string
    email: string
    phone: string
    consent: boolean
    questions: number[]
    answers: string[][]
}

// 설문 답변 응답
export interface AnswerResponse {
    customer: CustomerResponse
    survey: SurveyResponse
    answer: QuestionAnswerResponse[]
    createdAt?: string // 등록 날짜 필드 추가
}

