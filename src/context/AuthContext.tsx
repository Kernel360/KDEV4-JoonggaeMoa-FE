import type React from "react"
import {createContext, type ReactNode, useContext, useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {removeAccessToken, setAccessToken} from "../services/api"

interface AuthContextType {
    isAuthenticated: boolean
    login: (token: string, agentId: number) => void
    logout: () => void
    agentId: number | null
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Add this custom hook export
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({children}) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [agentId, setAgentId] = useState<number | null>(null)
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)

    // Check if user is authenticated on mount
    useEffect(() => {
        const token = localStorage.getItem("accessToken")
        const storedAgentId = localStorage.getItem("agentId")
        if (token && storedAgentId) {
            setIsAuthenticated(true)
            setAgentId(Number(storedAgentId))
        } else {
            setIsAuthenticated(false);
            setAgentId(null);
        }
        setLoading(false);
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
    return <AuthContext.Provider
        value={{isAuthenticated, login, logout, agentId, loading}}>{children}</AuthContext.Provider>
}