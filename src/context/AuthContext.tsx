"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import api, { setAccessToken, removeAccessToken } from "../services/api"
import { toast } from "react-toastify"
import { getNotificationColor } from '../utils/notificationUtils';  // Add this import
import { useLocation } from 'react-router-dom';  // Add this import at the top

interface AuthContextType {
    isAuthenticated: boolean
    login: (token: string, agentId: number) => void
    logout: () => void
    agentId: number | null
    loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [agentId, setAgentId] = useState<number | null>(null)
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const location = useLocation()  // Add this line

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

    // Add SSE connection useEffect
    useEffect(() => {
        const storedAgentId = localStorage.getItem('agentId');
        let eventSource: EventSource | null = null;

        if (storedAgentId && isAuthenticated) {
            const setupEventSource = () => {
                if (eventSource) {
                    eventSource.close();
                }
                
                eventSource = new EventSource(`${api.defaults.baseURL}/api/notification/subscribe?agentId=${storedAgentId}`);

                eventSource.onopen = () => {
                    console.log("SSE connection opened");
                };
                
                eventSource.addEventListener("notification", (event) => {
                    const rawNotification = JSON.parse(event.data);
                    // Check if current page is not survey submit page
                    if (rawNotification.type !== 'CONNECTION' && !location.pathname.includes('/surveys/submit/')) {
                        toast.info(
                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <div style={{ width: 4, height: 40, borderRadius: 4, backgroundColor: getNotificationColor(rawNotification.type), marginRight: 12 }} />
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{rawNotification.content}</div>
                                    <span style={{ backgroundColor: `${getNotificationColor(rawNotification.type)}15`, color: getNotificationColor(rawNotification.type), padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600 }}>
                                        {rawNotification.type}
                                    </span>
                                </div>
                            </div>
                        );
                    }
                });

                eventSource.onerror = (err) => {
                    console.error("SSE error:", err);
                    eventSource?.close();
                    setTimeout(setupEventSource, 30000);
                };
            };

            setupEventSource();

            return () => {
                if (eventSource) {
                    eventSource.close();
                }
            };
        }
    }, [isAuthenticated]);  // Add location.pathname to dependencies

    return <AuthContext.Provider value={{ isAuthenticated, login, logout, agentId, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

