"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { setAccessToken, removeAccessToken } from "../services/api"
import {jwtDecode} from "jwt-decode"

interface AuthContextType {
    isAuthenticated: boolean
    login: (token: string) => void
    logout: () => void
    agentId: number | null
}

interface JwtPayload {
    sub: string
    agentId: number
    exp: number
    // 기타 필요한 JWT 필드들
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [agentId, setAgentId] = useState<number | null>(null)
    const navigate = useNavigate()

    // Check if user is authenticated on mount
    useEffect(() => {
        const token = localStorage.getItem("accessToken")
        if (token) {
            try {
                const decoded = jwtDecode<JwtPayload>(token)
                setAgentId(decoded.agentId)
                setIsAuthenticated(true)
            } catch (error) {
                console.error("Invalid token:", error)
                removeAccessToken()
                setIsAuthenticated(false)
                setAgentId(null)
            }
        }
    }, [])

    const login = (token: string) => {
        setAccessToken(token)
        try {
            const decoded = jwtDecode<JwtPayload>(token)
            setAgentId(decoded.agentId)
            setIsAuthenticated(true)
        } catch (error) {
            console.error("Invalid token:", error)
            setIsAuthenticated(false)
            setAgentId(null)
        }
    }

    const logout = () => {
        removeAccessToken()
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

