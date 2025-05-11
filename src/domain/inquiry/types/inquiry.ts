export interface InquiryAnswerResponse {
    agentId: number;
    agentName: string;
    agentOffice: string;
    agentRegion: string;
    content: string;
    createdAt: string;
}

export interface InquiryDetailResponse {
    id: number;
    name: string;
    title: string;
    content: string | null;
    createdAt: string;
    updatedAt: string;
    answers: InquiryAnswerResponse[];
}

export interface InquiryResponse {
    id: number;
    name: string;
    title: string;
    content: string | null;
    createdAt: string;
    count: number;
}

export interface InquiryRequest {
    name: string;
    password: string;
    title: string;
    content: string;
}

export interface InquiryConsultationRequest {
    agentId: number;
    name: string;
    phone: string;
    email: string;
    consent: boolean;
    consultAt: string;
}

export interface PageInfo {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
}