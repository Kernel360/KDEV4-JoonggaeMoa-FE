"use client"

import React, { useEffect, useState } from "react"
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Grid,
    Avatar,
    IconButton,
    Badge,
    Button,
    createTheme,
    ThemeProvider,
} from "@mui/material"
import {
    Business,
    People,
    Forum,
    Email,
    Home,
    Person,
    Notifications,
    Assignment,
    InsertDriveFile,
    Search,
    Dashboard as DashboardIcon,
    Settings,
    Menu as MenuIcon,
    ChevronLeft,
} from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"

// 커스텀 테마 생성
const theme = createTheme({
    typography: {
        fontFamily: "'Pretendard', -apple-system, sans-serif",
        h4: {
            fontWeight: 600,
            fontSize: '1.5rem',
        },
        h6: {
            fontWeight: 600,
            fontSize: '1rem',
        },
        body1: {
            fontSize: '0.9rem',
        },
        body2: {
            fontSize: '0.875rem',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: '8px',
                    fontWeight: 500,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                },
            },
        },
    },
});

const Dashboard = () => {
    const { logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
    const[loading, setLoading] = useState(true);
    const[error, setError] = useState<string | null>(null);

    const handleCustomerManagement = () => {
        navigate("/customer-management")
    }

    const handleSurveyManagement = () => {
        navigate("/survey")
    }

    const handleConsultationManagement = () => {
        navigate("/consultation")
    }

    const handleContractManagement = () => {
        navigate("/contract")
    }

    const handleMessageManagement = () => {
        navigate("/message")
    }

    const handleMyPage = () => {
        navigate("/my-page")
    }

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get("/api/agents"); // API 요청
                if (response.data.success && response.data.data) {
                    setProfile({
                        name: response.data.data.name,
                        email: response.data.data.email,
                    });
                    console.log(response.data.data.name);
                    
                } else {
                    setError("프로필 정보를 불러오는데 실패했습니다.");
                }
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError("프로필 정보를 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []); // 컴포넌트 마운트 시 실행

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ display: 'flex', bgcolor: '#f8f9fa', minHeight: "100vh" }}>
                {/* Sidebar */}
                <Box
                    sx={{
                        width: 240,
                        minWidth: sidebarOpen ? 240 : 0,
                        bgcolor: '#111',
                        color: 'white',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                        position: 'fixed',
                        height: '100vh',
                        transform: sidebarOpen ? 'none' : 'translateX(-240px)',
                        zIndex: 1200,
                    }}
                >
                    {/* Toggle Button */}
                    <IconButton
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        sx={{
                            position: 'absolute',
                            right: -20,
                            top: 20,
                            bgcolor: '#111',
                            color: 'white',
                            width: 20,
                            height: 40,
                            '&:hover': {
                                bgcolor: '#333',
                            },
                            zIndex: 1200,
                            borderRadius: '0 8px 8px 0',
                        }}
                    >
                        <ChevronLeft sx={{ transform: sidebarOpen ? 'none' : 'scaleX(-1)' }} />
                    </IconButton>

                    {/* Logo */}
                    <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography variant="h5" sx={{ 
                            fontWeight: 700, 
                            color: 'white',
                            fontSize: '1.25rem',
                            whiteSpace: 'nowrap',
                        }}>
                            부동산 CRM
                        </Typography>
                    </Box>

                    {/* Menu Items */}
                    <List sx={{ py: 1, whiteSpace: 'nowrap' }}>
                        <ListItem 
                            button 
                            onClick={() => navigate("/dashboard")}
                            selected 
                            sx={{ 
                                py: 1.5,
                                bgcolor: 'rgba(255,255,255,0.1)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                <DashboardIcon />
                            </ListItemIcon>
                            <ListItemText 
                                primary="대시보드" 
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                }}
                            />
                        </ListItem>

                        <ListItem 
                            disabled
                            sx={{ 
                                py: 1.5,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                                opacity: 0.5,
                            }}
                        >
                            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                <Business />
                            </ListItemIcon>
                            <ListItemText 
                                primary="매물 관리"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                }}
                            />
                        </ListItem>

                        <ListItem 
                            button 
                            onClick={() => navigate("/contract")}
                            sx={{ 
                                py: 1.5,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                <InsertDriveFile />
                            </ListItemIcon>
                            <ListItemText 
                                primary="계약 관리"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                }}
                            />
                        </ListItem>

                        <ListItem 
                            button 
                            onClick={() => navigate("/customer-management")}
                            sx={{ 
                                py: 1.5,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                <People />
                            </ListItemIcon>
                            <ListItemText 
                                primary="고객 관리"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                }}
                            />
                        </ListItem>

                        <ListItem 
                            button 
                            onClick={() => navigate("/consultation")}
                            sx={{ 
                                py: 1.5,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                <Forum />
                            </ListItemIcon>
                            <ListItemText 
                                primary="상담 관리"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                }}
                            />
                        </ListItem>

                        <ListItem 
                            button 
                            onClick={() => navigate("/survey")}
                            sx={{ 
                                py: 1.5,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                <Assignment />
                            </ListItemIcon>
                            <ListItemText 
                                primary="설문 관리"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                }}
                            />
                        </ListItem>

                        <ListItem 
                            button 
                            onClick={() => navigate("/message")}
                            sx={{ 
                                py: 1.5,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                <Email />
                            </ListItemIcon>
                            <ListItemText 
                                primary="문자 관리"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                }}
                            />
                        </ListItem>
                    </List>

                    <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <ListItem 
                            button
                            onClick={() => navigate("/my-page")}
                            sx={{ 
                                borderRadius: '8px',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
                                opacity: 0.5,
                            }}
                        >
                            <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                <Person />
                            </ListItemIcon>
                            <ListItemText 
                                primary="마이페이지"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                }}
                            />
                        </ListItem>
                    </Box>
                </Box>

                {/* Main Content */}
                <Box sx={{ 
                    flexGrow: 1, 
                    p: 4,
                    transition: 'all 0.3s ease',
                    marginLeft: sidebarOpen ? '240px' : 0,
                    width: sidebarOpen ? 'calc(100% - 240px)' : '100%',
                }}>
                    {/* Header */}
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 4, 
                        justifyContent: 'flex-end',
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton>
                                <Badge badgeContent={5} color="error">
                                    <Notifications />
                                </Badge>
                            </IconButton>
                            {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32 }}>김</Avatar>
                                <Typography variant="body2">김부동</Typography>
                            </Box> */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                    {profile?.name?.charAt(0) || "?"}
                                </Avatar>
                                {loading ? (
                                    <Typography variant="body2">로딩 중...</Typography>
                                ) : error ? (
                                    <Typography variant="body2" color="error">
                                        {error}
                                    </Typography>
                                ) : (
                                    <Box>
                                        <Typography variant="body2">{profile?.name}</Typography>
                                    </Box>
                                )}
                            </Box>

                        </Box>
                    </Box>

                    {/* Stats */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3 }}>
                                <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                                    활성 매물
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                    <Typography variant="h4">146</Typography>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            color: '#4caf50',
                                            bgcolor: '#e8f5e9',
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: '4px',
                                        }}
                                    >
                                        +12%
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                    전주 대비
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3 }}>
                                <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                                    진행중인 계약
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                    <Typography variant="h4">28</Typography>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            color: '#4caf50',
                                            bgcolor: '#e8f5e9',
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: '4px',
                                        }}
                                    >
                                        +5%
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                    전주 대비
                                </Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3 }}>
                                <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                                    이번달 거래 완료
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                    <Typography variant="h4">42</Typography>
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            color: '#4caf50',
                                            bgcolor: '#e8f5e9',
                                            px: 1,
                                            py: 0.5,
                                            borderRadius: '4px',
                                        }}
                                    >
                                        +18%
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                    전월 대비
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Charts */}
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 3 }}>월별 계약 실적</Typography>
                                {/* Add Chart Component Here */}
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" sx={{ mb: 3 }}>매물 유형별 분포</Typography>
                                {/* Add Pie Chart Component Here */}
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Recent Activities */}
                    <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">최근 활동</Typography>
                            <Button variant="text" sx={{ color: '#666' }}>전체</Button>
                        </Box>
                        <Paper sx={{ p: 0 }}>
                            <List>
                                <ListItem sx={{ py: 2 }}>
                                    <ListItemIcon>
                                        <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}>
                                            <Business />
                                        </Avatar>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="신규 매물 등록"
                                        secondary="강남구 역삼동 2층 사무실"
                                        secondaryTypographyProps={{ sx: { color: '#666' } }}
                                    />
                                    <Typography variant="body2" color="textSecondary">방금 전</Typography>
                                </ListItem>
                                <ListItem sx={{ py: 2 }}>
                                    <ListItemIcon>
                                        <Avatar sx={{ bgcolor: '#fce4ec', color: '#d81b60' }}>
                                            <Person />
                                        </Avatar>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="고객 상담 완료"
                                        secondary="이창호 고객님 - 전세 문의"
                                        secondaryTypographyProps={{ sx: { color: '#666' } }}
                                    />
                                    <Typography variant="body2" color="textSecondary">1시간 전</Typography>
                                </ListItem>
                                <ListItem sx={{ py: 2 }}>
                                    <ListItemIcon>
                                        <Avatar sx={{ bgcolor: '#e8f5e9', color: '#43a047' }}>
                                            <InsertDriveFile />
                                        </Avatar>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="계약 진행 상태 변경"
                                        secondary="서초동 오피스텔 - 계약금 입금"
                                        secondaryTypographyProps={{ sx: { color: '#666' } }}
                                    />
                                    <Typography variant="body2" color="textSecondary">2시간 전</Typography>
                                </ListItem>
                            </List>
                        </Paper>
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    )
}

export default Dashboard

