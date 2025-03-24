"use client"

import type React from "react"

import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

interface ProtectedRouteProps {
    children: ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated } = useAuth()

    if (!isAuthenticated) {
        return <Navigate to="/" />
    }

    return <>{children}</>
}

export default ProtectedRoute

