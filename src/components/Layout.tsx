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
    QuestionAnswer,
    KeyboardArrowDown
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from 'react-toastify';
import { useNotification } from "../context/NotificationContext";
import { formatDistanceToNow } from 'date-fns';

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
        MuiListItem: {
            styleOverrides: {
                root: {
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        borderLeft: '4px solid #1976d2',
                        '&:hover': {
                            backgroundColor: 'rgba(25, 118, 210, 0.12)',
                        },
                    },
                    '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
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
    createdAt: string;
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
    // Remove the local notifications state
    // const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationError, setNotificationError] = useState<string | null>(null);
    const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
    // Get notifications from context
    const { notifications, unreadCount, markAsRead } = useNotification();
    
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
        setAnchorEl(event.currentTarget);
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
            
            if(notification.isRead === false) {
                markAsRead(notification.id);
            }
    
            
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
                {/* Header */}
                <Box sx={{ 
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1100,
                    bgcolor: 'white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}>
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        height: 64,
                        px: 3,
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                onClick={() => navigate("/dashboard")}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    cursor: 'pointer',
                                    '&:hover': {
                                        '& .logo-title': {
                                            color: '#007ea7',
                                        },
                                    },
                                }}
                            >
                                <img 
                                    src="/로고.png" 
                                    alt="중개모아 로고" 
                                    style={{ width: '45px', height: '50px' }}
                                />
                                <Box>
                                    <Typography 
                                        variant="h5" 
                                        className="logo-title"
                                        sx={{ 
                                            fontWeight: 800, 
                                            color: '#003459',
                                            fontSize: '1.4rem',
                                            transition: 'color 0.2s ease',
                                        }}
                                    >
                                        중개모아
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        공인중개사 솔루션
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <IconButton 
                                color="inherit" 
                                onClick={handleNotificationClick}
                                sx={{ 
                                    position: 'relative',
                                    mr: 2
                                }}
                            >
                                <Badge badgeContent={unreadCount} color="error">
                                    <Notifications />
                                </Badge>
                            </IconButton>
                            <Menu
                                anchorEl={notificationAnchorEl}
                                open={Boolean(notificationAnchorEl)}
                                onClose={handleNotificationClose}
                                PaperProps={{
                                    sx: {
                                        width: 320,
                                        maxHeight: 400,
                                        mt: 1,
                                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                        borderRadius: 2
                                    }
                                }}
                                MenuListProps={{
                                    sx: { overflow: 'auto' }
                                }}
                                disableScrollLock={true}
                            >
                                <Box sx={{ p: 1.5, borderBottom: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        알림
                                    </Typography>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            navigate("/notification-list");
                                            handleNotificationClose();
                                        }}
                                        sx={{ 
                                            color: 'primary.main',
                                            fontWeight: 500
                                        }}
                                    >
                                        전체 알림 보기
                                    </Button>
                                </Box>
                                {notificationError ? (
                                    <Box sx={{ p: 2, textAlign: 'center' }}>
                                        <Typography color="error" variant="body2">
                                            {notificationError}
                                        </Typography>
                                    </Box>
                                ) : notifications.length === 0 ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            새로운 알림이 없습니다
                                        </Typography>
                                    </Box>
                                ) : (
                                    <List sx={{ p: 0 }}>
                                        {notifications
                                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                            .map((notification) => (
                                            <ListItem
                                                key={notification.id}
                                                button
                                                onClick={() => handleNotificationNavigation(notification)}
                                                sx={{
                                                    py: 1.5,
                                                    px: 2,
                                                    borderBottom: '1px solid #f0f0f0',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(0, 0, 0, 0.04)'
                                                    }
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 40 }}>
                                                    <Box
                                                        sx={{
                                                            width: 32,
                                                            height: 32,
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            bgcolor: `${getNotificationColor(notification.type)}20`,
                                                            color: getNotificationColor(notification.type)
                                                        }}
                                                    >
                                                        {notification.type === 'SURVEY' && <Assignment fontSize="small" />}
                                                        {notification.type === 'ARTICLE' && <InsertDriveFile fontSize="small" />}
                                                        {notification.type === 'CONSULTATION' && <Forum fontSize="small" />}
                                                        {notification.type === 'MESSAGE' && <Email fontSize="small" />}
                                                        {notification.type === 'CONTRACT' && <InsertDriveFile fontSize="small" />}
                                                    </Box>
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                fontWeight: notification.isRead ? 400 : 600,
                                                                color: notification.isRead ? 'text.primary' : 'primary.main'
                                                            }}
                                                        >
                                                            {notification.content}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                        </Typography>
                                                    }
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </Menu>
                            {profile && (
                                <Box 
                                    sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: 'rgba(0,0,0,0.04)',
                                            borderRadius: 1,
                                        },
                                        p: 1,
                                    }} 
                                    onClick={handleMenuOpen}
                                >
                                    <Avatar 
                                        sx={{ 
                                            width: 36, 
                                            height: 36, 
                                            bgcolor: '#007ea7',
                                            fontSize: '1rem',
                                        }}
                                    >
                                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                                    </Avatar>
                                    <Box sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                            {profile.name}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ ml: 0.5, display: 'flex', alignItems: 'center' }}>
                                        <KeyboardArrowDown sx={{ color: '#003459', fontSize: '1.2rem' }} />
                                    </Box>
                                </Box>
                            )}
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                PaperProps={{
                                    sx: {
                                        mt: 1.5,
                                        minWidth: 180,
                                        borderRadius: 2,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    }
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                MenuListProps={{
                                    sx: { overflow: 'auto' }
                                }}
                                disableScrollLock={true}
                            >
                                <MenuItem 
                                    onClick={() => {
                                        navigate("/my-page");
                                        handleMenuClose();
                                    }}
                                    sx={{ 
                                        py: 1.5,
                                        px: 2,
                                        '&:hover': {
                                            bgcolor: 'rgba(0,0,0,0.04)',
                                        }
                                    }}
                                >
                                    <ListItemIcon>
                                        <Person sx={{ color: '#007ea7' }} />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="마이페이지" 
                                        primaryTypographyProps={{
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                        }}
                                    />
                                </MenuItem>
                                <MenuItem 
                                    onClick={handleLogout}
                                    sx={{ 
                                        py: 1.5,
                                        px: 2,
                                        '&:hover': {
                                            bgcolor: 'rgba(0,0,0,0.04)',
                                        }
                                    }}
                                >
                                    <ListItemIcon>
                                        <Logout sx={{ color: '#007ea7' }} />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary="로그아웃" 
                                        primaryTypographyProps={{
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                        }}
                                    />
                                </MenuItem>
                            </Menu>
                        </Box>
                    </Box>
                </Box>

                {/* Sidebar */}
                <Box
                    sx={{
                        width: 240,
                        minWidth: sidebarOpen ? 240 : 0,
                        bgcolor: 'white',
                        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
                        color: 'text.primary',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                        position: 'fixed',
                        height: '100vh',
                        transform: sidebarOpen ? 'none' : 'translateX(-240px)',
                        zIndex: 1200,
                        top: 64,
                    }}
                >
                    {/* Toggle Button */}
                    <IconButton
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        sx={{
                            position: 'absolute',
                            right: -20,
                            top: 12,
                            bgcolor: 'white',
                            color: 'text.primary',
                            width: 20,
                            height: 40,
                            '&:hover': {
                                bgcolor: 'grey.100',
                            },
                            zIndex: 1200,
                            borderRadius: '0 8px 8px 0',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <ChevronLeft sx={{ transform: sidebarOpen ? 'none' : 'scaleX(-1)' }} />
                    </IconButton>

                    {/* Menu Items */}
                    <List sx={{ py: 1 }}>
                        <ListItem 
                            button 
                            onClick={() => navigate("/dashboard")}
                            selected={location.pathname === "/dashboard"}
                            sx={{ py: 1.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <DashboardIcon color={location.pathname === "/dashboard" ? "primary" : "action"} />
                            </ListItemIcon>
                            <ListItemText 
                                primary="대시보드" 
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                    color: location.pathname === "/dashboard" ? "primary" : "text.primary",
                                }}
                            />
                        </ListItem>

                        <ListItem 
                            button
                            onClick={handleArticleManagement}
                            selected={location.pathname.startsWith("/article")}
                            sx={{ py: 1.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <Business color={location.pathname.startsWith("/article") ? "primary" : "action"} />
                            </ListItemIcon>
                            <ListItemText 
                                primary="매물 관리"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                    color: location.pathname.startsWith("/article") ? "primary" : "text.primary",
                                }}
                            />
                        </ListItem>

                        <ListItem 
                            button 
                            onClick={() => navigate("/contract")}
                            selected={location.pathname.startsWith("/contract")}
                            sx={{ py: 1.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <InsertDriveFile color={location.pathname.startsWith("/contract") ? "primary" : "action"} />
                            </ListItemIcon>
                            <ListItemText 
                                primary="계약 관리"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                    color: location.pathname.startsWith("/contract") ? "primary" : "text.primary",
                                }}
                            />
                        </ListItem>

                        <ListItem 
                            button 
                            onClick={() => navigate("/customer-management")}
                            selected={location.pathname.startsWith("/customer-management")}
                            sx={{ py: 1.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <People color={location.pathname.startsWith("/customer-management") ? "primary" : "action"} />
                            </ListItemIcon>
                            <ListItemText 
                                primary="고객 관리"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                    color: location.pathname.startsWith("/customer-management") ? "primary" : "text.primary",
                                }}
                            />
                        </ListItem>

                        <ListItem 
                            button 
                            onClick={() => navigate("/consultation")}
                            selected={location.pathname.startsWith("/consultation")}
                            sx={{ py: 1.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <Forum color={location.pathname.startsWith("/consultation") ? "primary" : "action"} />
                            </ListItemIcon>
                            <ListItemText 
                                primary="상담 관리"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                    color: location.pathname.startsWith("/consultation") ? "primary" : "text.primary",
                                }}
                            />
                        </ListItem>

                        <ListItem 
                            button 
                            onClick={() => navigate("/survey")}
                            selected={location.pathname.startsWith("/survey")}
                            sx={{ py: 1.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <Assignment color={location.pathname.startsWith("/survey") ? "primary" : "action"} />
                            </ListItemIcon>
                            <ListItemText 
                                primary="설문 관리"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                    color: location.pathname.startsWith("/survey") ? "primary" : "text.primary",
                                }}
                            />
                        </ListItem>

                        <ListItem 
                            button 
                            onClick={() => navigate("/message")}
                            selected={location.pathname.startsWith("/message")}
                            sx={{ py: 1.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <Email color={location.pathname.startsWith("/message") ? "primary" : "action"} />
                            </ListItemIcon>
                            <ListItemText 
                                primary="문자 관리"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                    color: location.pathname.startsWith("/message") ? "primary" : "text.primary",
                                }}
                            />
                        </ListItem>

                        <ListItem 
                            button 
                            onClick={() => navigate("/inquiry")}
                            selected={location.pathname.startsWith("/inquiry")}
                            sx={{ py: 1.5 }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <QuestionAnswer color={location.pathname.startsWith("/inquiry") ? "primary" : "action"} />
                            </ListItemIcon>
                            <ListItemText 
                                primary="문의 게시판"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                    color: location.pathname.startsWith("/inquiry") ? "primary" : "text.primary",
                                }}
                            />
                        </ListItem>
                    </List>

                    <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                        <ListItem 
                            button
                            onClick={() => navigate("/my-page")}
                            selected={location.pathname === "/my-page"}
                            sx={{ 
                                borderRadius: '8px',
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <Person color={location.pathname === "/my-page" ? "primary" : "action"} />
                            </ListItemIcon>
                            <ListItemText 
                                primary="마이페이지"
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                    color: location.pathname === "/my-page" ? "primary" : "text.primary",
                                }}
                            />
                        </ListItem>
                    </Box>
                </Box>

                {/* Main Content */}
                <Box sx={{ 
                    flexGrow: 1, 
                    transition: 'all 0.3s ease',
                    marginLeft: sidebarOpen ? '240px' : 0,
                    width: sidebarOpen ? 'calc(100% - 240px)' : '100%',
                    mt: 8,
                }}>
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