"use client"

import React, { useEffect, useState, useRef } from "react"
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
    Container,
    AppBar,
    Toolbar,
    CircularProgress,
    ToggleButtonGroup,
    ToggleButton,
    Snackbar,
    Alert,
    Checkbox,
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
    Logout,
    ArrowBack,
} from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import { PieChart } from "@toast-ui/chart"
import { dashboardApi } from "../services/dashboardApi"
import type { RealEstateTypeSummaryResponse, TradeTypeSummaryResponse } from "../types/dashboard"
import { TooltipModel } from "@toast-ui/chart/types/components/tooltip"
import { TooltipTheme } from "@toast-ui/chart/types/theme"

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
    isRead: boolean;
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
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationError, setNotificationError] = useState<string | null>(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const { logout } = useAuth()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [realEstateTypePeriod, setRealEstateTypePeriod] = useState<string>("daily");
    const [tradeTypePeriod, setTradeTypePeriod] = useState<string>("daily");
    const [realEstateTypeData, setRealEstateTypeData] = useState<RealEstateTypeSummaryResponse[]>([]);
    const [tradeTypeData, setTradeTypeData] = useState<TradeTypeSummaryResponse[]>([]);
    
    // 차트 인스턴스 ref
    const realEstateTypeChartInstance = useRef<any>(null);
    const tradeTypeChartInstance = useRef<any>(null);
    
    // 차트 컨테이너 ref
    const realEstateTypeChartRef = useRef<HTMLDivElement>(null);
    const tradeTypeChartRef = useRef<HTMLDivElement>(null);
    
    // 로딩 상태 분리
    const [realEstateTypeLoading, setRealEstateTypeLoading] = useState(false);
    const [tradeTypeLoading, setTradeTypeLoading] = useState(false);
    
    // 에러 상태 분리
    const [realEstateTypeError, setRealEstateTypeError] = useState<string | null>(null);
    const [tradeTypeError, setTradeTypeError] = useState<string | null>(null);

    // Add these missing notification handler functions
    const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationAnchorEl(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotificationAnchorEl(null);
    };

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
    
    const handleNotificationNavigation = async (notification: Notification) => {
        console.log("Notification being handled:", notification);
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                navigate('/');
                return;
            }
    
            await api.patch("/api/notification/read", null, {
                params: {
                    notificationId: notification.id,
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            // Update local state to mark notification as read
            setNotifications(prev => 
                prev.map(n => 
                    n.id === notification.id ? { ...n, isRead: true } : n
                )
            );
            
            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            handleNotificationClose();
            
            // Navigate based on type
            switch (notification.type) {
                case 'SURVEY':
                    handleSurveyManagement();  
                    break;
                case 'ARTICLE':
                    handleArticleManagement();
                    break;
                case 'CONSULTATION':
                    handleConsultationManagement();
                    break;
                case 'MESSAGE':
                    handleMessageManagement();
                    break;
                case 'CONTRACT':
                    handleContractManagement();
                    break;
                default:
                    navigate('/dashboard');
            }
        } catch (error: any) {
            console.error("Error marking notification as read:", error);
            if (error.response && error.response.status === 401) {
                console.log("Authentication error, redirecting to login");
                navigate('/');
            }
        }
    };

    useEffect(() => {
        // 프로필 정보를 가져오는 함수
        const fetchProfile = async () => {
            try {
                const response = await api.get("/api/agents"); // API 요청
                if (response.data.success && response.data.data) {
                    setProfile({
                        name: response.data.data.name,
                        email: response.data.data.email,
                    });
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
        
        // 주기적으로 프로필 정보 업데이트 (5분마다)
        const profileInterval = setInterval(fetchProfile, 5 * 60 * 1000);
        
        // 컴포넌트 언마운트 시 인터벌 정리
        return () => {
            clearInterval(profileInterval);
        };
    }, []);

    useEffect(() => {
        const agentId = localStorage.getItem('agentId');
        let eventSource: EventSource | null = null;

        if (!agentId) {
            console.warn("agentId is missing or invalid:", agentId);
            return;
        }    

        const setupEventSource = () => {
            if (eventSource) {
                eventSource.close();
            }
            console.log("Setting up EventSource with agentId:", agentId);
            
            eventSource = new EventSource(`${api.defaults.baseURL}/api/notification/subscribe?agentId=${agentId}`);

            eventSource.onopen = () => {
                console.log("SSE connection opened");
            };
            
            eventSource.addEventListener("notification", (event)  => {
                console.log("Received notification:", event.data);
                const rawNotification = JSON.parse(event.data);
                const newNotification = {
                    ...rawNotification,
                    isRead: rawNotification.read
                };
                
                setNotifications(prev => {
                    return [newNotification, ...prev].sort((a, b) => b.id - a.id);
                });

                setUnreadCount(count => count + 1);
            });

            eventSource.onerror = (err) => {
                console.error("SSE error:", err);
                eventSource?.close();
                setTimeout(setupEventSource, 30000);
            };
        };

        // 초기 알림 데이터 로드
        const fetchNotifications = async () => {
            try {
                const response = await api.get("/api/notification");
                if (response.data.success) {
                    const allNotifications = response.data.data.map(notification => ({
                        ...notification,
                        isRead: notification.read
                    }));
                    
                    setNotifications(allNotifications);
                    const unreadCount = allNotifications.filter(n => !n.isRead).length;
                    setUnreadCount(unreadCount);
                }
            } catch (err) {
                console.error("Error fetching notifications:", err);
                setNotificationError("알림을 불러오는데 실패했습니다");
            }
        };

        fetchNotifications();
        setupEventSource();

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, []);

    // 초기 로딩 시에만 전체 데이터를 가져오는 useEffect
    useEffect(() => {
        const initialFetch = async () => {
            try {
                setLoading(true);
                
                // 초기 데이터 로딩
                await Promise.all([
                    fetchRealEstateTypeData(realEstateTypePeriod),
                    fetchTradeTypeData(tradeTypePeriod)
                ]);
                
                setError(null);
            } catch (err) {
                console.error("Error fetching initial dashboard data:", err);
                setError("초기 대시보드 데이터를 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };
        
        initialFetch();
        
        // 컴포넌트 언마운트 시 차트 인스턴스 정리
        return () => {
            cleanupCharts();
        };
    }, []); // 의존성 배열 비움 - 컴포넌트 마운트 시 한 번만 실행tradeTypePeriod]);

    const fetchRealEstateTypeData = async (period) => {
        try {
            setRealEstateTypeLoading(true);
            setRealEstateTypeError(null);
            const response = await dashboardApi.getRealEstateTypeSummary(period);
            if (response.data.success && response.data.data) {
                setRealEstateTypeData(response.data.data);
            }
            return true;
        } catch (err) {
            console.error("Error fetching real estate type data:", err);
            setRealEstateTypeError("부동산 유형 데이터를 불러오는데 실패했습니다.");
            return false;
        } finally {
            setRealEstateTypeLoading(false);
        }
    };

    const fetchTradeTypeData = async (period) => {
        try {
            setTradeTypeLoading(true);
            setTradeTypeError(null);
            const response = await dashboardApi.getTradeTypeSummary(period);
            if (response.data.success && response.data.data) {
                setTradeTypeData(response.data.data);
            }
            return true;
        } catch (err) {
            console.error("Error fetching trade type data:", err);
            setTradeTypeError("거래 유형 데이터를 불러오는데 실패했습니다.");
            return false;
        } finally {
            setTradeTypeLoading(false);
        }
    };

    const cleanupCharts = () => {
        if (realEstateTypeChartInstance.current) {
            realEstateTypeChartInstance.current.destroy();
            realEstateTypeChartInstance.current = null;
        }
        if (tradeTypeChartInstance.current) {
            tradeTypeChartInstance.current.destroy();
            tradeTypeChartInstance.current = null;
        }
    };

    // 부동산 유형 기간 변경 핸들러
    const handleRealEstateTypePeriodChange = (event, newPeriod) => {
        if (newPeriod !== null) {
            setRealEstateTypePeriod(newPeriod);
            fetchRealEstateTypeData(newPeriod);
        }
    };
    
    const handleTradeTypePeriodChange = (event, newPeriod) => {
        if (newPeriod !== null) {
            setTradeTypePeriod(newPeriod);
            fetchTradeTypeData(newPeriod);
        }
    };

    // 차트 렌더링
    useEffect(() => {
        if (!realEstateTypeData.length || !realEstateTypeChartRef.current) return;

        // 부동산 유형 차트 렌더링
        if (realEstateTypeChartInstance.current) {
            realEstateTypeChartInstance.current.destroy();
            realEstateTypeChartInstance.current = null;
        }

        // 5% 미만인 부동산 유형을 '기타'로 통합
        const THRESHOLD = 5;
        const sortedRealEstateTypes = [...realEstateTypeData]
            .sort((a, b) => b.ratio - a.ratio);

        const mainTypes = sortedRealEstateTypes.filter(item => item.ratio >= THRESHOLD);
        const otherTypes = sortedRealEstateTypes.filter(item => item.ratio < THRESHOLD);
        
        const otherRatio = otherTypes.reduce((sum, item) => sum + item.ratio, 0);
        
        const realEstateChartData = {
            series: [
                ...mainTypes.map(item => ({
                    name: item.type,
                    data: item.ratio
                })),
                ...(otherRatio > 0 ? [{
                    name: '기타',
                    data: otherRatio
                }] : [])
            ]
        };

        try {
            realEstateTypeChartInstance.current = new PieChart({
                el: realEstateTypeChartRef.current,
                data: realEstateChartData,
                options: {
                    chart: { 
                    },
                    series: {
                        dataLabels: {
                            visible: true,
                            anchor: 'outer',
                            formatter: (value: any) => `${parseFloat(value).toFixed(1)}%`,
                        },
                        radiusRange: {
                            inner: '40%',
                            outer: '100%'
                        },
                        selectable: true
                    },
                    theme: {
                        series: {
                            colors: [
                                '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', 
                                '#FF5722', '#607D8B', '#795548', '#3F51B5'
                            ]
                        }
                    },
                    tooltip: {
                        template: (model: TooltipModel) => {
                            return ``;
                        }
                    },
                    exportMenu: {
                        visible: false
                    }
                }
            });
        } catch (err) {
            console.error("Error creating real estate type chart:", err);
        }

        return () => {
            if (realEstateTypeChartInstance.current) {
                realEstateTypeChartInstance.current.destroy();
                realEstateTypeChartInstance.current = null;
            }
        };
    }, [realEstateTypeData]);

    // 거래 유형 차트 렌더링
    useEffect(() => {
        if (!tradeTypeData.length || !tradeTypeChartRef.current) return;

        // 거래 유형 차트 렌더링
        if (tradeTypeChartInstance.current) {
            tradeTypeChartInstance.current.destroy();
            tradeTypeChartInstance.current = null;
        }

        const types = tradeTypeData.filter(item => item.ratio >= 0.5);
        
        const tradeTypeChartData = {
            series: types.map(item => ({
                name: item.type,
                data: item.ratio
            }))
        };

        try {
            tradeTypeChartInstance.current = new PieChart({
                el: tradeTypeChartRef.current,
                data: tradeTypeChartData,
                options: {
                    chart: { 
                        // width: 400, 
                        // height: 350 
                    },
                    series: {
                        dataLabels: {
                            visible: true,
                            anchor: 'outer',
                            formatter: (value: any) => `${parseFloat(value).toFixed(1)}%`,
                        },
                        radiusRange: {
                            inner: '40%',
                            outer: '100%'
                        },
                        selectable: true
                    },
                    theme: {
                        series: {
                            colors: ['#2196F3', '#4CAF50', '#FFC107', '#FF5722']
                        }
                    },
                    tooltip: {
                        template: (model: TooltipModel) => {
                            return ``;
                        }
                    },
                    exportMenu: {
                        visible: false
                    }
                }
            });
        } catch (err) {
            console.error("Error creating trade type chart:", err);
        }

        return () => {
            if (tradeTypeChartInstance.current) {
                tradeTypeChartInstance.current.destroy();
                tradeTypeChartInstance.current = null;
            }
        };
    }, [tradeTypeData]);

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
                            <IconButton onClick={handleNotificationClick}>
                                <Badge badgeContent={unreadCount} color="error">
                                    <Notifications />
                                </Badge>
                            </IconButton>
                            {/* In the Menu component, filter notifications to show only unread ones */}
                            <Menu
                                anchorEl={notificationAnchorEl}
                                open={Boolean(notificationAnchorEl)}
                                onClose={handleNotificationClose}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right",
                                }}
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right",
                                }}
                                PaperProps={{
                                    sx: {
                                        mt: 1.5,
                                        width: 360,
                                        maxHeight: 400,
                                        overflowY: 'auto',
                                    }
                                }}
                            >
                                <Box sx={{ p: 2, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                                    <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                                        알림 ({unreadCount})
                                    </Typography>
                                </Box>
                                {notifications
                                        .slice() // Create a copy to avoid mutating the original array
                                        .sort((a, b) => b.id - a.id) // Sort by id in descending order
                                        .map((notification) => (
                                            <MenuItem 
                                                key={`${notification.id}-${notification.isRead}`}
                                                onClick={() => handleNotificationNavigation(notification)}
                                                sx={{ 
                                                    py: 2,
                                                    px: 2,
                                                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                                                    '&:last-child': { borderBottom: 'none' },
                                                    bgcolor: notification.isRead ? 'action.hover' : 'transparent',
                                                }}
                                            >
                                                <Box sx={{ 
                                                    width: 4, 
                                                    height: 40, 
                                                    borderRadius: '4px',
                                                    bgcolor: notification.isRead ? 'grey.400' : getNotificationColor(notification.type),
                                                    mr: 2
                                                }} />
                                                <Box>
                                                    <Typography 
                                                        variant="body1" 
                                                        sx={{ 
                                                            fontWeight: notification.isRead ? 400 : 600,
                                                            color: notification.isRead ? 'text.disabled' : 'text.primary',
                                                            mb: 0.5,
                                                            fontSize: '0.95rem',
                                                        }}
                                                    >
                                                        {notification.content}
                                                    </Typography>
                                                    <Typography 
                                                        component="span"
                                                        variant="body2"
                                                        sx={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            bgcolor: notification.isRead ? 'grey.100' : `${getNotificationColor(notification.type)}15`,
                                                            color: notification.isRead ? 'grey.500' : getNotificationColor(notification.type),
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
                                            </MenuItem>
                                        ))}
                                <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                                    <Button 
                                        fullWidth
                                        variant="text"
                                        onClick={() => {
                                            handleNotificationClose();
                                            navigate('/notification-list');
                                        }}
                                        sx={{
                                            color: 'primary.main',
                                            '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.04)' },
                                        }}
                                    >
                                        전체 알림 보기
                                    </Button>
                                </Box>
                            </Menu>
                            
                            {/* Add profile display here */}
                            {profile && (
                                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={handleMenuOpen}>
                                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#1976d2' }}>
                                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                                    </Avatar>
                                    <Box sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            {profile.name}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.8rem' }}>
                                            {profile.email}
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                            
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                            >
                                <MenuItem onClick={() => { navigate("/my-page"); handleMenuClose(); }}>
                                    <ListItemIcon>
                                        <Person fontSize="small" />
                                    </ListItemIcon>
                                    마이페이지
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <ListItemIcon>
                                        <Logout fontSize="small" /> {/* Settings에서 Logout으로 변경 */}
                                    </ListItemIcon>
                                    로그아웃
                                </MenuItem>
                            </Menu>
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
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h6">부동산 유형 분포</Typography>
                                    <ToggleButtonGroup
                                        value={realEstateTypePeriod}
                                        exclusive
                                        onChange={handleRealEstateTypePeriodChange}
                                        aria-label="부동산 유형 기간 선택"
                                        size="small"
                                    >
                                        <ToggleButton value="daily" aria-label="일간">
                                            일간
                                        </ToggleButton>
                                        <ToggleButton value="weekly" aria-label="주간">
                                            주간
                                        </ToggleButton>
                                        <ToggleButton value="monthly" aria-label="월간">
                                            월간
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                                
                                {realEstateTypeLoading ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : realEstateTypeError ? (
                                    <Box sx={{ textAlign: "center", py: 3 }}>
                                        <Typography color="error">{realEstateTypeError}</Typography>
                                        <Button 
                                            variant="contained" 
                                            sx={{ mt: 2 }} 
                                            onClick={() => handleRealEstateTypePeriodChange(null as any, realEstateTypePeriod)}
                                        >
                                            다시 시도
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box 
                                        ref={realEstateTypeChartRef} 
                                        sx={{ 
                                            width: '100%',
                                            height: '350px',
                                            '& canvas': {
                                                width: '100% !important',
                                                height: '100% !important'
                                            }
                                        }} 
                                    />
                                )}
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h6">거래 유형 분포</Typography>
                                    <ToggleButtonGroup
                                        value={tradeTypePeriod}
                                        exclusive
                                        onChange={handleTradeTypePeriodChange}
                                        aria-label="거래 유형 기간 선택"
                                        size="small"
                                    >
                                        <ToggleButton value="daily" aria-label="일간">
                                            일간
                                        </ToggleButton>
                                        <ToggleButton value="weekly" aria-label="주간">
                                            주간
                                        </ToggleButton>
                                        <ToggleButton value="monthly" aria-label="월간">
                                            월간
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                                
                                {tradeTypeLoading ? (
                                    <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : tradeTypeError ? (
                                    <Box sx={{ textAlign: "center", py: 3 }}>
                                        <Typography color="error">{tradeTypeError}</Typography>
                                        <Button 
                                            variant="contained" 
                                            sx={{ mt: 2 }} 
                                            onClick={() => handleTradeTypePeriodChange(null as any, tradeTypePeriod)}
                                        >
                                            다시 시도
                                        </Button>
                                    </Box>
                                ) : (
                                    <Box 
                                        ref={tradeTypeChartRef} 
                                        sx={{ 
                                            width: '100%',
                                            height: '350px',
                                            '& canvas': {
                                                width: '100% !important',
                                                height: '100% !important'
                                            }
                                        }} 
                                    />
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                    {/* In the activity list section */}
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
                                    {notifications
                                        .slice()
                                        .sort((a, b) => b.id - a.id)
                                        .slice(0, 5)
                                        .map((notification) => (
                                        <ListItem 
                                            key={notification.id}
                                            sx={{ 
                                                py: 2,
                                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                                                '&:last-child': { borderBottom: 'none' },
                                                borderRadius: '8px',
                                                '&:hover': {
                                                    bgcolor: 'rgba(0,0,0,0.02)',
                                                    cursor: 'pointer'
                                                },
                                                transition: 'all 0.2s ease',
                                            }}
                                            onClick={() => handleNotificationNavigation(notification)}
                                        >
                                            <Box sx={{ 
                                                width: 4, 
                                                height: 40, 
                                                borderRadius: '4px',
                                                bgcolor: notification.isRead ? 'grey.400' : getNotificationColor(notification.type),
                                                mr: 2 
                                            }} />
                                            <ListItemText 
                                                primary={
                                                    <>
                                                        <Typography 
                                                            variant="body1" 
                                                            sx={{ 
                                                                fontWeight: notification.isRead ? 400 : 600,
                                                                color: notification.isRead ? 'text.disabled' : 'text.primary',
                                                                mb: 0.5,
                                                                fontSize: '0.95rem',
                                                            }}
                                                        >
                                                            {notification.content}
                                                        </Typography>
                                                        <Typography 
                                                            component="span"
                                                            variant="body2"
                                                            sx={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                bgcolor: notification.isRead ? 'grey.100' : `${getNotificationColor(notification.type)}15`,
                                                                color: notification.isRead ? 'grey.500' : getNotificationColor(notification.type),
                                                                py: 0.5,
                                                                px: 1,
                                                                borderRadius: '4px',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {notification.type}
                                                        </Typography>
                                                    </>
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

            {/* 에러 메시지 스낵바 */}
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
                    {error}
                </Alert>
            </Snackbar>

            <Box sx={{ bgcolor: "#fff", p: 2, textAlign: "center", mt: 4 }}>
                <Typography variant="caption" color="textSecondary">
                    © 2024 Customer Management System. All rights reserved.
                </Typography>
            </Box>
        </ThemeProvider>
    )
}

export default Dashboard