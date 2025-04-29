"use client"

import type React from "react"

import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Layout from "./Layout"
import { CircularProgress, Box } from "@mui/material"

interface ProtectedRouteProps {
    children: ReactNode
}

import { useLocation } from "react-router-dom"

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth()
    const location = useLocation()
    
    if (loading) {
        return (
            <Box sx={{ 
                width: "100vw", 
                height: "100vh", 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center" 
            }}>
                <CircularProgress />
            </Box>
        )
    }

    // For inquiry pages, allow access but with different layouts
    if (location.pathname.startsWith('/inquiry')) {
        return isAuthenticated ? <Layout>{children}</Layout> : <>{children}</>
    }

    // For other protected routes
    if (!isAuthenticated) {
        return <Navigate to="/" />
    }

    return <Layout>{children}</Layout>
}

export default ProtectedRoute

