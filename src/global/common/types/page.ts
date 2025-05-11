export interface PageResponse<T> {
    content: T[]
    totalPages: number
    totalElements: number
    number: number
    size: number
    first: boolean
    last: boolean
    empty: boolean
} 