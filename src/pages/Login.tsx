"use client"

import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardActions,
    Divider,
    Alert,
    Snackbar,
} from "@mui/material"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import React from "react"

function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [openSnackbar, setOpenSnackbar] = useState(false)

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const loginData = {
                username,
                password,
            }

            const response = await api.post("/api/agent/login", loginData, {
                withCredentials: true, // Important for receiving cookies
            })

            // Check if login was successful (status 2xx)
            if (response.status >= 200 && response.status < 300) {
                // Get access token from Authorization header
                const accessToken = response.headers.authorization

                if (accessToken) {
                    // Store token and update auth state
                    login(accessToken)
                    navigate("/dashboard")
                } else {
                    throw new Error("No access token received")
                }
            } else {
                setError("Login failed. Please try again.")
                setOpenSnackbar(true)
            }
        } catch (err: any) {
            console.error("Login error:", err)
            setError(err.response?.data?.error?.message || "An error occurred during login. Please try again.")
            setOpenSnackbar(true)
        } finally {
            setLoading(false)
        }
    }

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false)
    }

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Card sx={{ width: "100%", mt: 3 }}>
                    <CardHeader
                        title="Login"
                        subheader="Enter your username and password to access your account"
                        titleTypographyProps={{ align: "center", variant: "h5" }}
                        subheaderTypographyProps={{ align: "center" }}
                    />
                    <CardContent>
                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                autoComplete="username"
                                autoFocus
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
                                {loading ? "Signing In..." : "Sign In"}
                            </Button>
                        </Box>
                    </CardContent>
                    <Divider />
                    <CardActions>
                        <Box sx={{ width: "100%", textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                                Don't have an account?{" "}
                                <Link to="/register" style={{ textDecoration: "none" }}>
                                    Register
                                </Link>
                            </Typography>
                        </Box>
                    </CardActions>
                </Card>
            </Box>

            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    )
}

export default Login

