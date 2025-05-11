import api from "./api"
import type {AxiosResponse} from "axios"
import type {
    AnswerRequest,
    AnswerResponse,
    SurveyCreateRequest,
    SurveyDetailResponse,
    SurveyResponse,
    SurveyUpdateRequest,
} from "../types/survey"
import type {ApiResponse} from "../types/api"

// 설문 생성
export const createSurvey = async (surveyData: SurveyCreateRequest): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.post(`/api/surveys`, surveyData)
}

// 설문 삭제
export const deleteSurvey = async (surveyId: string): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.delete(`/api/surveys/${surveyId}`)
}

// 설문 수정
export const updateSurvey = async (
    surveyId: string,
    surveyData: SurveyUpdateRequest,
): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.patch(`/api/surveys/${surveyId}`, surveyData)
}

// 모든 설문 조회
export const getSurveys = async (): Promise<AxiosResponse<ApiResponse<SurveyResponse[]>>> => {
    return api.get(`/api/surveys`)
}

// 설문 상세 조회
export const getSurveyById = async (surveyId: string): Promise<AxiosResponse<ApiResponse<SurveyDetailResponse>>> => {
    return api.get(`/api/surveys/${surveyId}`)
}

// 설문 답변 제출
export const submitSurveyAnswer = async (
    surveyId: string,
    answerData: AnswerRequest,
): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.post(`/api/surveys/${surveyId}/submit`, answerData)
}

// 모든 설문 답변 조회
export const getAllSurveyAnswers = async (): Promise<AxiosResponse<ApiResponse<AnswerResponse[]>>> => {
    return api.get(`/api/surveys/answers`)
}

// 고객용 설문 조회 API 추가
export const getSurveyForCustomer = async (surveyId: string): Promise<AxiosResponse<ApiResponse<SurveyDetailResponse>>> => {
    return api.get(`/api/customers/surveys/${surveyId}`)
}

// 고객용 설문 답변 제출 API 추가
export const submitSurveyAnswerForCustomer = async (
    surveyId: string,
    answerData: AnswerRequest,
): Promise<AxiosResponse<ApiResponse<void>>> => {
    return api.post(`/api/customers/surveys/${surveyId}`, answerData)
}

// Export both individual functions and the object for backward compatibility
export const surveyApi = {
    createSurvey,
    deleteSurvey,
    updateSurvey,
    getSurveys: (page: number = 0, size: number = 10) => {
        return api.get(`/api/surveys`, {
            params: {
                page,
                size,
                sort: 'id,desc'
            }
        })
    },
    getSurveyById,
    submitSurveyAnswer,
    getAllSurveyAnswers: (page: number = 0, size: number = 10) => {
        return api.get('/api/surveys/answers', {
            params: {
                page,
                size,
                sort: 'id,desc'
            }
        })
    },
    getSurveyForCustomer,
    submitSurveyAnswerForCustomer,
}

