"use client"

import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    InputAdornment,
    Checkbox,
    FormControlLabel,
    Alert,
    Snackbar,
} from "@mui/material"
import { Visibility, VisibilityOff, Person, Lock, CheckCircle } from '@mui/icons-material';
import { useAuth } from "../context/AuthContext.tsx"
import axios from "axios"
import { useNotification } from "../context/NotificationContext.tsx"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const { setupSSEConnection } = useNotification()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
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

            const response = await axios.post(`${API_BASE_URL}/api/agents/login`, loginData, {
                withCredentials: true,
                headers: {
                    'Cookie-SameSite': 'Lax',
                }
            })

            if (response.status >= 200 && response.status < 300) {
                const accessToken = response.headers.authorization
                const agentId = response.headers.agentid ? Number(response.headers.agentid) : null

                if (accessToken && agentId) {
                    login(accessToken, agentId)
                    setupSSEConnection(agentId)
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

    const benefits = [
        '효율적인 매물 관리 시스템',
        '안전한 계약서 작성 및 관리',
        '실시간 시장 동향 분석',
        '전문 중개인 네트워크'
    ];

    return (
        <Box sx={{ 
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            bgcolor: '#ffffff',
            overflow: 'hidden'
        }}>
            {/* 왼쪽 브랜드 소개 영역 */}
            <Box sx={{ 
                display: { xs: 'none', lg: 'flex' },
                width: '50%',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 6,
                background: 'linear-gradient(to right, #e6f3f7, #f0f7fa)',
                height: '100vh'
            }}>
                <Box>
                    <Box sx={{ width: '90px', mb: 4 }}>
                        <img
                            src="/public/로고.png"
                            alt="브랜드 로고"
                            style={{ width: '100%' }}
                        />
                    </Box>
                    <Typography variant="h2" sx={{ 
                        color: '#007ea7',
                        fontWeight: 700,
                        mb: 3,
                        fontSize: '2.5rem',
                        lineHeight: 1.2
                    }}>
                        부동산 중개의<br />새로운 기준
                    </Typography>
                    <Typography sx={{ 
                        color: '#00a8e8',
                        fontSize: '1.25rem',
                        mb: 4
                    }}>
                        더 쉽고 편리한 부동산 중개 서비스로<br />
                        여러분의 성공을 지원합니다.
                    </Typography>
                </Box>

                <Box>
                    <Box sx={{ 
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 2,
                        mb: 4
                    }}>
                        {[
                            { icon: 'home', title: '매물 관리', desc: '효율적인 관리' },
                            { icon: 'handshake', title: '계약 관리', desc: '안전한 계약' },
                            { icon: 'chart-line', title: '실적 분석', desc: '성과 확인' }
                        ].map((item, i) => (
                            <Box key={i} sx={{
                                bgcolor: 'rgba(255,255,255,0.8)',
                                p: 2,
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <Typography sx={{ color: '#007ea7', mb: 1, fontWeight: 600 }}>
                                    {item.title}
                                </Typography>
                                <Typography sx={{ color: '#007ea7', fontSize: '0.875rem' }}>
                                    {item.desc}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                    <Typography sx={{ color: '#007ea7', fontSize: '0.875rem' }}>
                        © 2025 중개모아. All rights reserved.
                    </Typography>
                </Box>
            </Box>

            {/* 오른쪽 로그인 폼 */}
            <Box sx={{ 
                width: { xs: '100%', lg: '50%' },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                height: '100vh',
                overflow: 'auto'
            }}>
                <Box sx={{ width: '100%', maxWidth: '32rem' }}>
                    <Box sx={{ textAlign: { xs: 'center', lg: 'left' }, mb: 5 }}>
                        <Typography variant="h4" sx={{ 
                            fontWeight: 700,
                            color: 'text.primary',
                            mb: 1
                        }}>
                            환영합니다!
                        </Typography>
                        <Typography sx={{ color: 'text.secondary' }}>
                            계정에 로그인하여 모든 기능을 이용해보세요.
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Box sx={{ mb: 3 }}>
                            <Typography sx={{ 
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                color: 'text.primary',
                                mb: 1
                            }}>
                                아이디 <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                            </Typography>
                            <TextField
                                fullWidth
                                id="username"
                                placeholder="아이디를 입력하세요"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '& fieldset': {
                                            borderColor: 'grey.300',
                                        },
                                    },
                                }}
                            />
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            <Box sx={{ 
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1
                            }}>
                                <Typography sx={{ 
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: 'text.primary'
                                }}>
                                    비밀번호 <Box component="span" sx={{ color: 'error.main' }}>*</Box>
                                </Typography>
                            </Box>
                            <TextField
                                fullWidth
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                placeholder="비밀번호를 입력하세요"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock sx={{ color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={() => setShowPassword(!showPassword)}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '& fieldset': {
                                            borderColor: 'grey.300',
                                        },
                                    },
                                }}
                            />
                        </Box>

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                py: 1.5,
                                bgcolor: 'rgba(0, 168, 232, 0.8)',
                                '&:hover': {
                                    bgcolor: '#00a8e8',
                                },
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                            }}
                        >
                            {loading ? "로그인 중..." : "로그인"}
                        </Button>

                        <Box sx={{ 
                            mt: 4,
                            textAlign: 'center'
                        }}>
                            <Typography sx={{ color: 'text.secondary' }}>
                                아직 계정이 없으신가요?{' '}
                                <Link to="/signup" style={{ 
                                    textDecoration: 'none',
                                    color: '#00a8e8',
                                    fontWeight: 500
                                }}>
                                    회원가입
                                </Link>
                            </Typography>
                        </Box>

                        <Box sx={{ 
                            mt: 5,
                            pt: 3,
                            borderTop: '1px solid',
                            borderColor: 'grey.200'
                        }}>
                            
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Snackbar 
                open={openSnackbar} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity="error" 
                    sx={{ width: '100%', borderRadius: 2 }}
                >
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default Login

