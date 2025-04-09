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

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth()
    
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

    if (!isAuthenticated) {
        return <Navigate to="/" />
    }

    return <Layout>{children}</Layout>
}

export default ProtectedRoute

