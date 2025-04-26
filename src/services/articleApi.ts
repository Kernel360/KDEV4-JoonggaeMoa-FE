import api from "./api"
import type { AxiosResponse } from "axios"
import type { ApiResponse } from "./customerApi"
import type { ArticleResponse, ArticleListParams, ArticleListResponse, ComplexResponse } from "../types/article"
import qs from "qs"
import axios from 'axios'

// 모든 매물 조회 (페이지네이션)
export const getAllArticles = async (params: ArticleListParams = {}): Promise<AxiosResponse<ApiResponse<ArticleListResponse>>> => {
    return api.get('/api/articles', {
        params,
        paramsSerializer: params => {
            return qs.stringify(params, { arrayFormat: 'repeat' })
        }
    })
}

export const getArticleById = async (id: number): Promise<AxiosResponse<ApiResponse<ArticleResponse>>> => {
    return api.get(`/api/articles/${id}`)
}

export const searchArticles = async (params: ArticleListParams): Promise<AxiosResponse<ApiResponse<ArticleListResponse>>> => {
    return api.get('/api/articles/search', {
        params,
        paramsSerializer: params => {
            return qs.stringify(params, { arrayFormat: 'repeat' })
        }
    })
}

export const getComplex = async (id: number): Promise<AxiosResponse<ApiResponse<ComplexResponse>>> => {
    return axios.get<ApiResponse<ComplexResponse>>(`/api/complexes/${id}`)
}

// Export the API object
export const articleApi = {
    getAllArticles,
    getArticleById,
    searchArticles,
    getComplex,
} 