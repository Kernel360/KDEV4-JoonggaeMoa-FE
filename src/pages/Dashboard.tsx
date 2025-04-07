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
    Menu,
    MenuItem,
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

interface Notification {
    id: number;
    type: string;
    content: string;
}

// Add this helper function before the Dashboard component
const getNotificationColor = (type: string) => {
    switch (type) {
        case 'SURVEY':
            return '#2196f3';
        case 'ARTICLE':
            return '#4caf50';
        case 'CONSULTATION':
            return '#ff9800';
        case 'MESSAGE':
            return '#9c27b0';
        case 'CONTRACT':
            return '#f44336';
        default:
            return '#757575';
    }
};

const Dashboard = () => {
    // Add these two state declarations with the other state variables
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationError, setNotificationError] = useState<string | null>(null);
    
    const { logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
    const[loading, setLoading] = useState(true);
    const[error, setError] = useState<string | null>(null);
    const[anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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

    const handleArticleManagement = () => {
        navigate("/article")
    }

    const handleMyPage = () => {
        navigate("/my-page")
    }

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        if (anchorEl) {
            handleMenuClose();
        } else {
            setAnchorEl(event.currentTarget);
        }
    }

    const handleMenuClose = () => {
        setAnchorEl(null);
    }

    const handleLogout = () => {
        logout();
        navigate("/");
        handleMenuClose();
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

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await api.get("/api/notification");
                if (response.data.success) {
                    setNotifications(response.data.data.slice(0, 5));
                } else {
                    setNotificationError("Failed to load notifications");
                }
            } catch (err) {
                console.error("Error fetching notifications:", err);
                setNotificationError("Failed to load notifications");
            }
        };

        fetchNotifications();
    }, []);

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
                            button
                            onClick={handleArticleManagement}
                            sx={{ 
                                py: 1.5,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
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
                            {/* 프로필 이니셜 및 이름 */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer" }} onClick={handleMenuOpen}>
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

                                {/* 드롭다운 메뉴 */}
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                    anchorOrigin={{
                                        vertical: "bottom",
                                        horizontal: "right",
                                    }}
                                    transformOrigin={{
                                        vertical: "top",
                                        horizontal: "right",
                                    }}
                                >
                                    <MenuItem onClick={handleMyPage}>마이페이지</MenuItem>
                                    <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
                                </Menu>
                                
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
                    <Box sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>최근 활동</Typography>
                        </Box>
                        <Paper sx={{ p: 3 }}>
                            {notificationError ? (
                                <Typography color="error" sx={{ fontWeight: 500 }}>{notificationError}</Typography>
                            ) : notifications.length === 0 ? (
                                <Typography color="textSecondary" sx={{ fontWeight: 500 }}>최근 활동이 없습니다.</Typography>
                            ) : (
                                <List sx={{ '& .MuiListItem-root': { px: 2 } }}>
                                    {notifications.map((notification) => (
                                        <ListItem 
                                            key={notification.id}
                                            sx={{ 
                                                py: 2,
                                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                                                '&:last-child': { borderBottom: 'none' },
                                                borderRadius: '8px',
                                                '&:hover': {
                                                    bgcolor: 'rgba(0,0,0,0.02)',
                                                },
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            <Box sx={{ 
                                                width: 4, 
                                                height: 40, 
                                                borderRadius: '4px',
                                                bgcolor: getNotificationColor(notification.type),
                                                mr: 2 
                                            }} />
                                            <ListItemText 
                                                primary={
                                                    <Typography 
                                                        variant="body1" 
                                                        sx={{ 
                                                            fontWeight: 600,
                                                            color: 'text.primary',
                                                            mb: 0.5,
                                                            fontSize: '0.95rem',
                                                        }}
                                                    >
                                                        {notification.content}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box sx={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: 1 
                                                    }}>
                                                        <Typography 
                                                            component="span" 
                                                            variant="body2"
                                                            sx={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                bgcolor: `${getNotificationColor(notification.type)}15`,
                                                                color: getNotificationColor(notification.type),
                                                                py: 0.5,
                                                                px: 1,
                                                                borderRadius: '4px',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {notification.type}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    </Box>
                </Box>
            </Box>
        </ThemeProvider>
    )
}

export default Dashboard

