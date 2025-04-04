"use client"

import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
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
import { useAuth } from "../context/AuthContext.tsx"
import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

            // 로그인 요청은 axios 인스턴스를 직접 사용하지 않고 axios 인스턴스를 직접 사용하여
            // 인터셉터의 영향을 받지 않도록 합니다.
            const response = await axios.post(`${API_BASE_URL}/api/agents/login`, loginData, {
                withCredentials: true, // 쿠키를 받기 위해 필수
            })

            // Check if login was successful (status 2xx)
            if (response.status >= 200 && response.status < 300) {
                // Get access token from Authorization header
                const accessToken = response.headers.authorization
                // Get agentId from agentId header
                const agentId = response.headers.agentid ? Number(response.headers.agentid) : null

                if (accessToken && agentId) {
                    // Store token, agentId and update auth state
                    login(accessToken, agentId)
                    navigate("/dashboard")
                } else {
                    throw new Error("No access token or agentId received")
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
        <Card sx={{ width: "100%", maxWidth: "400px", borderRadius: 2, overflow: "hidden" }}>
            <CardHeader
                title="Login"
                subheader="Enter your username and password to access your account"
                titleTypographyProps={{ align: "center", variant: "h5" }}
                subheaderTypographyProps={{ align: "center" }}
            />
            <CardContent sx={{ p: 4 }}>
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
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{
                            mt: 3,
                            mb: 2,
                            bgcolor: "#000",
                            "&:hover": { bgcolor: "#333" },
                            py: 1.5,
                        }}
                        disabled={loading}
                    >
                        {loading ? "Signing In..." : "Sign In"}
                    </Button>
                </Box>
            </CardContent>
            <Divider />
            <CardActions>
                <Box sx={{ width: "100%", textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                        Don't have an account?{" "}
                        <Link to="/signup" style={{ textDecoration: "none" }}>
                            sign up
                        </Link>
                    </Typography>
                </Box>
            </CardActions>

            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
                    {error}
                </Alert>
            </Snackbar>
        </Card>
    )
}

export default Login

