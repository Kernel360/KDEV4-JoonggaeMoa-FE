import api from "./api"
import type { AxiosResponse } from "axios"
import type { ApiResponse } from "./customerApi"
import type { ArticleResponse } from "../types/article"
import qs from "qs"

// 모든 매물 조회 (페이지네이션)
export const getAllArticles = async (params: any = {}): Promise<AxiosResponse<ApiResponse<{
    content: ArticleResponse[];
    totalElements: number;
    totalPages: number;
    size: number;x
    number: number;
    last: boolean;
}>>> => {
    return api.get('/api/articles', {
        params,
        paramsSerializer: params => {
            return qs.stringify(params, { arrayFormat: 'repeat' })
        }
    })
}

// Export the API object
export const articleApi = {
    getAllArticles,
} 