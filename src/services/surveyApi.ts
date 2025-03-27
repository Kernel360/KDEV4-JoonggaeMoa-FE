import api from "./api";
import type { AxiosResponse } from "axios";
import type {
    SurveyCreateRequest,
    SurveyUpdateRequest,
    SurveyResponse,
    AnswerRequest,
    AnswerResponse,
} from "../types/survey"
import type { ApiResponse } from "../types/api";

// 현재 로그인한 에이전트 ID 가져오기
const getAgentId = (): number => {
    // 실제 구현에서는 AuthContext에서 가져와야 함
    return 1;
};

// 설문 생성
export const createSurvey = async (
    surveyData: SurveyCreateRequest
): Promise<AxiosResponse<ApiResponse<void>>> => {
    const agentId = getAgentId();
    return api.post(`/api/agents/${agentId}/surveys`, surveyData);
};

// 설문 삭제
export const deleteSurvey = async (
    surveyId: number
): Promise<AxiosResponse<ApiResponse<void>>> => {
    const agentId = getAgentId();
    return api.delete(`/api/agents/${agentId}/surveys/${surveyId}`);
};

// 설문 수정
export const updateSurvey = async (
    surveyId: number,
    surveyData: SurveyUpdateRequest
): Promise<AxiosResponse<ApiResponse<void>>> => {
    const agentId = getAgentId();
    return api.patch(`/api/agents/${agentId}/surveys/${surveyId}`, surveyData);
};

// 모든 설문 조회
export const getAllSurveys = async (): Promise<AxiosResponse<ApiResponse<SurveyResponse[]>>> => {
    const agentId = getAgentId();
    return api.get(`/api/agents/${agentId}/surveys`);
};

// 설문 상세 조회
export const getSurveyById = async (
    surveyId: number
): Promise<AxiosResponse<ApiResponse<SurveyResponse>>> => {
    const agentId = getAgentId();
    return api.get(`/api/agents/${agentId}/surveys/${surveyId}`);
};

// 설문 답변 제출
export const submitSurveyAnswer = async (
    surveyId: number,
    answerData: AnswerRequest,
): Promise<AxiosResponse<ApiResponse<void>>> => {
    const agentId = getAgentId()
    return api.post(`/api/agents/${agentId}/surveys/${surveyId}/submit`, answerData)
}

// 모든 설문 답변 조회
export const getAllSurveyAnswers = async (): Promise<AxiosResponse<ApiResponse<AnswerResponse[]>>> => {
    const agentId = getAgentId()
    return api.get(`/api/agents/${agentId}/surveys/answer`)
}