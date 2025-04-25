export interface InquiryAnswer {
    agentName: string;
    agentOffice: string;
    agentRegion: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface Inquiry {
    id: number;
    name: string;
    title: string;
    content: string | null;
    createdAt: string;
    updatedAt: string;
    answers: InquiryAnswer[];
}

export interface InquiryRequest {
    name: string;
    password: string;
    title: string;
    content: string;
}

export interface PageInfo {
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalElements: number;
}