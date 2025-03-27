// 설문 관련 타입 정의

// 질문 타입 (라디오, 체크박스, 텍스트 등)
export enum QuestionType {
    RADIO = "RADIO",
    CHECKBOX = "CHECKBOX",
    TEXT = "TEXT"
}

// 질문 생성 요청
export interface QuestionCreateRequest {
    content: string;
    type: QuestionType;
    isRequired: boolean;
    options: string[];
}

// 질문 수정 요청
export interface QuestionUpdateRequest {
    id?: number;
    content: string;
    type: QuestionType;
    isRequired: boolean;
    options: string[];
}

// 질문 응답
export interface QuestionResponse {
    id: number;
    content: string;
    type: QuestionType;
    isRequired: boolean;
    options: string[];
}

// 설문 생성 요청
export interface SurveyCreateRequest {
    title: string;
    description: string;
    questionList: QuestionCreateRequest[];
}

// 설문 수정 요청
export interface SurveyUpdateRequest {
    title: string;
    description: string;
    questionList: QuestionUpdateRequest[];
}

// 설문 응답
export interface SurveyResponse {
    id: number;
    title: string;
    description: string;
    questionList: QuestionResponse[];
}
