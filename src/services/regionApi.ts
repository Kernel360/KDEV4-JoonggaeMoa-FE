import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface RegionResponse {
    id: number
    area: string
    createdAt: string
    updatedAt: string
}

export const regionApi = {
    getAllRegions: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/regions`)
            console.log("Region API response:", response)
            return response
        } catch (error) {
            console.error("Error in regionApi.getAllRegions:", error)
            throw error
        }
    }
} 