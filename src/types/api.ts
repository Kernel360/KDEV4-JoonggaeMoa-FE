// API response types
export interface ExceptionDto {
    message: string;
    code?: string;
    details?: any;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data: T | null;
    error: ExceptionDto | null;
}

// Auth types
export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token?: string;
    user?: {
        username: string;
        name: string;
        // Add other user fields as needed
    };
}

export interface SignupRequest {
    username: string;
    password: string;
    name: string;
    phone: string;
    email: string;
    office: string;
    region: string;
    businessNo: string;
}

export interface SignupResponse {
    // Define the expected response data structure
    id?: string;
    username?: string;
    // Add other fields as needed
}
