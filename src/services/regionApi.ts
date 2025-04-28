import api from "./api"
import type { ApiResponse } from "../types/api"

export interface RegionResponse {
    id: number
    cortarNo: string
    centerLat: number
    centerLon: number
    cortarName: string
    cortarType: string
    areaFull?: string
}

export const regionApi = {
    getAllRegions: async () => {
        try {
            const response = await api.get<ApiResponse<RegionResponse[]>>("/api/regions")
            return response
        } catch (error) {
            console.error("Error fetching regions:", error)
            throw error
        }
    },
    getChildRegions: async (parentId: number) => {
        try {
            const response = await api.get<ApiResponse<RegionResponse[]>>(`/api/regions/${parentId}`)
            return response
        } catch (error) {
            console.error("Error fetching child regions:", error)
            throw error
        }
    }
} 