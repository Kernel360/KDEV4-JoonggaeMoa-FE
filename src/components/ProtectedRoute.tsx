import React, {ReactNode, useState} from "react";
import {Navigate, useLocation} from "react-router-dom"
import {useAuth} from "../context/AuthContext"
import Layout from "./Layout"
import {Alert, Box, CircularProgress, createTheme, Snackbar, ThemeProvider} from "@mui/material"

const theme = createTheme({
    palette: {
        mode: "light",
        primary: {
            main: "#007bff",
        },
        secondary: {
            main: "#6c757d",
        },
    },
});

interface ProtectedRouteProps {
    children: ReactNode
}


const ProtectedRoute: React.FC<ProtectedRouteProps> = ({children}) => {
    const {isAuthenticated, loading} = useAuth();
    const location = useLocation();
    const [error, setError] = useState<string | null>(null);


    if (loading) {
        return (
            <Box sx={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center"
            }}>
                <CircularProgress/>
            </Box>
        )
    }

    // For inquiry pages, allow access but with different layouts
    if (location.pathname.startsWith('/inquiry')) {
        return isAuthenticated ? <Layout>{children}</Layout> : <>{children}</>
    }

    // For other protected routes
    if (!isAuthenticated) {
        return <Navigate to="/"/>
    }

    if (location.pathname.startsWith('/article')) {
        return (
            <ThemeProvider theme={theme}>
                {children}
                {/* Error Snackbar */}
                <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                    <Alert onClose={() => setError(null)} severity="error" sx={{width: "100%"}}>
                        {error}
                    </Alert>
                </Snackbar>
            </ThemeProvider>
        );
    } else {
        return <Layout>{children}</Layout>
    }

}

export default ProtectedRoute

