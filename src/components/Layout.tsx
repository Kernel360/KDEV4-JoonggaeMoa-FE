import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Badge,
    Button,
    createTheme,
    ThemeProvider,
    Menu,
    MenuItem,
    Avatar,
    CircularProgress,
    Snackbar,
    Alert,
} from "@mui/material";
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
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from 'react-toastify';
import { useNotification } from "../context/NotificationContext";

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

// Add this helper function before the Layout component
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

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationError, setNotificationError] = useState<string | null>(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
    const { unreadCount } = useNotification();
    const { markAsRead } = useNotification();
    
    const { logout } = useAuth();
    const { closeSSEConnection } = useNotification();  // Add this line
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    // Add these missing notification handler functions
    const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationAnchorEl(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotificationAnchorEl(null);
    };

    const handleCustomerManagement = () => {
        navigate("/customer-management");
    };

    const handleSurveyManagement = () => {
        navigate("/survey");
    };

    const handleConsultationManagement = () => {
        navigate("/consultation");
    };

    const handleContractManagement = () => {
        navigate("/contract");
    };

    const handleMessageManagement = () => {
        navigate("/message");
    };

    const handleArticleManagement = () => {
        navigate("/article");
    };

    const handleMyPage = () => {
        navigate("/my-page");
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        if (anchorEl) {
            handleMenuClose();
        } else {
            setAnchorEl(event.currentTarget);
        }
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        closeSSEConnection();
        logout();
        navigate("/");
        handleMenuClose();
    };
    
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
            markAsRead(notification.id);
            
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
                            selected={location.pathname === "/dashboard"}
                            sx={{ 
                                py: 1.5,
                                bgcolor: location.pathname === "/dashboard" ? 'rgba(255,255,255,0.1)' : 'transparent',
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
                            selected={location.pathname.startsWith("/article")}
                            sx={{ 
                                py: 1.5,
                                bgcolor: location.pathname.startsWith("/article") ? 'rgba(255,255,255,0.1)' : 'transparent',
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
                            selected={location.pathname.startsWith("/contract")}
                            sx={{ 
                                py: 1.5,
                                bgcolor: location.pathname.startsWith("/contract") ? 'rgba(255,255,255,0.1)' : 'transparent',
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
                            selected={location.pathname.startsWith("/customer-management")}
                            sx={{ 
                                py: 1.5,
                                bgcolor: location.pathname.startsWith("/customer-management") ? 'rgba(255,255,255,0.1)' : 'transparent',
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
                            selected={location.pathname.startsWith("/consultation")}
                            sx={{ 
                                py: 1.5,
                                bgcolor: location.pathname.startsWith("/consultation") ? 'rgba(255,255,255,0.1)' : 'transparent',
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
                            selected={location.pathname.startsWith("/survey")}
                            sx={{ 
                                py: 1.5,
                                bgcolor: location.pathname.startsWith("/survey") ? 'rgba(255,255,255,0.1)' : 'transparent',
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
                            selected={location.pathname.startsWith("/message")}
                            sx={{ 
                                py: 1.5,
                                bgcolor: location.pathname.startsWith("/message") ? 'rgba(255,255,255,0.1)' : 'transparent',
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
                            selected={location.pathname === "/my-page"}
                            sx={{ 
                                borderRadius: '8px',
                                bgcolor: location.pathname === "/my-page" ? 'rgba(255,255,255,0.1)' : 'transparent',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
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
                                        <Logout fontSize="small" />
                                    </ListItemIcon>
                                    로그아웃
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Box>

                    {/* Page Content */}
                    {children}
                </Box>
            </Box>

            {/* 에러 메시지 스낵바 */}
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
                    {error}
                </Alert>
            </Snackbar>
        </ThemeProvider>
    );
};

export default Layout;