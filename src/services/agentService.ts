import axios from "axios"
import api from "./api"

export interface AgentInfo {
    username: string
    name: string
    phone: string
    email: string
    office: string
    region: string
    businessNo: string
}

export interface AgentUpdateRequest {
    username: string
    name: string
    phone: string
    email: string
    office: string
    region: string
    businessNo: string
}

export const getAgent = async (): Promise<AgentInfo> => {
    const response = await api.get("/api/agents/me")
    return response.data.data
}

export const updateAgent = async (data: AgentUpdateRequest): Promise<void> => {
    // Get current agent data
    const currentData = await getAgent()
    
    // Merge current data with update data
    const mergedData = {
        ...currentData,
        ...data
    }
    
    await api.patch("/api/agents/me", mergedData)
} 