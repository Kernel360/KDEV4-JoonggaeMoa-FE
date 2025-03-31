"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { setAccessToken, removeAccessToken } from "../services/api"

interface AuthContextType {
    isAuthenticated: boolean
    login: (token: string, agentId: number) => void
    logout: () => void
    agentId: number | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [agentId, setAgentId] = useState<number | null>(null)
    const navigate = useNavigate()

    // Check if user is authenticated on mount
    useEffect(() => {
        const token = localStorage.getItem("accessToken")
        const storedAgentId = localStorage.getItem("agentId")

        if (token && storedAgentId) {
            setIsAuthenticated(true)
            setAgentId(Number(storedAgentId))
        }
    }, [])

    // Update the login function to extract agentId from response headers
    const login = (token: string, agentId: number) => {
        setAccessToken(token)
        // Store agentId in localStorage
        localStorage.setItem("agentId", agentId.toString())
        setAgentId(agentId)
        setIsAuthenticated(true)
    }

    // Update the logout function to also remove agentId
    const logout = () => {
        removeAccessToken()
        localStorage.removeItem("agentId")
        setIsAuthenticated(false)
        setAgentId(null)
        navigate("/")
    }

    return <AuthContext.Provider value={{ isAuthenticated, login, logout, agentId }}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

