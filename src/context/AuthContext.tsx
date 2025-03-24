"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { setAccessToken, removeAccessToken } from "../services/api"

interface AuthContextType {
    isAuthenticated: boolean
    login: (token: string) => void
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const navigate = useNavigate()

    // Check if user is authenticated on mount
    useEffect(() => {
        const token = localStorage.getItem("accessToken")
        if (token) {
            setIsAuthenticated(true)
        }
    }, [])

    const login = (token: string) => {
        setAccessToken(token)
        setIsAuthenticated(true)
    }

    const logout = () => {
        removeAccessToken()
        setIsAuthenticated(false)
        navigate("/")
    }

    return <AuthContext.Provider value={{ isAuthenticated, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

