import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios"

import { type ApiResponse } from "../types/api"


// 환경 변수에서 API URL 가져오기
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Create axios instance with base URL
const api = axios.create({
    baseURL: VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // withCredentials: true,
})

// Function to get access token from localStorage
const getAccessToken = (): string | null => {
    return localStorage.getItem("accessToken")
}

// Function to set access token in localStorage
export const setAccessToken = (token: string): void => {
    localStorage.setItem("accessToken", token)
}

// Function to remove access token from localStorage (logout)
export const removeAccessToken = (): void => {
    localStorage.removeItem("accessToken")
}

// Request interceptor to add Authorization header with access token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken()
        if (token && config.headers) {
            config.headers.Authorization = token
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    },
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response: AxiosResponse) => {
        return response
    },
    async (error: AxiosError<ApiResponse<unknown>>) => {
        const originalRequest = error.config

        const isAuthEndpoint =
            originalRequest?.url?.includes("/api/agent/login") || originalRequest?.url?.includes("/api/agent/signup")

        if (error.response?.data?.error?.code === 4011 && !originalRequest?.headers?.["X-Retry"] && !isAuthEndpoint) {
            try {
                const refreshResponse = await axios.post(
                    "/api/refresh-token",
                    {},
                    {
                        baseURL: VITE_API_BASE_URL,
                        withCredentials: true, // Important for sending cookies
                        headers: {
                            'Cookie-SameSite': 'Lax', // Use Lax instead of None when possible
                        }
                    },
                )

                const newAccessToken = refreshResponse.headers.authorization
                if (newAccessToken) {
                    setAccessToken(newAccessToken)

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = newAccessToken
                        originalRequest.headers["X-Retry"] = "true"
                    }

                    return api(originalRequest)
                }
            } catch (refreshError) {
                console.error("Error refreshing token:", refreshError)
                removeAccessToken()
                window.location.href = "/"
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    },
)

export default api
