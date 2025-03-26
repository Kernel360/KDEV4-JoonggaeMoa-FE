import axios, {type AxiosError, type AxiosResponse, InternalAxiosRequestConfig} from "axios"

// Create axios instance with base URL
const api = axios.create({
    baseURL: "http://localhost:8080",
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
    async (error: AxiosError) => {
        const originalRequest = error.config

        const isAuthEndpoint =
            originalRequest?.url?.includes("/api/agent/login") ||
            originalRequest?.url?.includes("/api/agent/signup")

        // If error is 401 (Unauthorized) and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest?.headers?.["X-Retry"] && !isAuthEndpoint) {
            try {
                // Try to refresh the token
                const refreshResponse = await axios.post(
                    "/api/refresh-token",
                    {},
                    {
                        baseURL: "http://localhost:8080",
                        withCredentials: true, // Important for sending cookies
                    },
                )

                // If we get a new access token in the header
                const newAccessToken = refreshResponse.headers.authorization
                if (newAccessToken) {
                    // Store the new token
                    setAccessToken(newAccessToken)

                    // Update the original request with the new token
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = newAccessToken
                        originalRequest.headers["X-Retry"] = "true"
                    }

                    // Retry the original request
                    return api(originalRequest)
                }
            } catch (refreshError) {
                // If refresh token is invalid, redirect to login
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

