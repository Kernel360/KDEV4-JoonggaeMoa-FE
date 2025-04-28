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
import type { 
    RealEstateTypeSummaryResponse, 
    TradeTypeSummaryResponse,
    CustomerSummaryResponse,
    ContractSummaryResponse,
    ConsultationSummaryResponse
} from "../types/dashboard"
import { format, differenceInMonths, isSameMonth, isToday, parseISO, addMonths, differenceInDays } from 'date-fns';

import { TooltipModel } from "@toast-ui/chart/types/components/tooltip"
import { TooltipTheme } from "@toast-ui/chart/types/theme"

import { toast } from 'react-toastify';
import Layout from "../components/Layout"


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

interface Contract {
    id: string;
    landlordName: string;
    tenantName: string;
    createdAt: string;
    expiredAt: string;
    url: string;
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);
    const [realEstateTypePeriod, setRealEstateTypePeriod] = useState<string>("daily");
    const [tradeTypePeriod, setTradeTypePeriod] = useState<string>("daily");
    const [realEstateTypeData, setRealEstateTypeData] = useState<RealEstateTypeSummaryResponse[]>([]);
    const [tradeTypeData, setTradeTypeData] = useState<TradeTypeSummaryResponse[]>([]);
    const [customerSummary, setCustomerSummary] = useState<CustomerSummaryResponse | null>(null);
    const [contractSummary, setContractSummary] = useState<ContractSummaryResponse | null>(null);
    const [consultationSummary, setConsultationSummary] = useState<ConsultationSummaryResponse | null>(null);
    
    // 차트 인스턴스 ref
    const realEstateTypeChartInstance = useRef<any>(null);
    const tradeTypeChartInstance = useRef<any>(null);
    
    // 차트 컨테이너 ref
    const realEstateTypeChartRef = useRef<HTMLDivElement>(null);
    const tradeTypeChartRef = useRef<HTMLDivElement>(null);
    
    // 로딩 상태 분리
    const [realEstateTypeLoading, setRealEstateTypeLoading] = useState(false);
    const [tradeTypeLoading, setTradeTypeLoading] = useState(false);
    const [customerSummaryLoading, setCustomerSummaryLoading] = useState(false);
    const [contractSummaryLoading, setContractSummaryLoading] = useState(false);
    const [consultationSummaryLoading, setConsultationSummaryLoading] = useState(false);
    
    // 에러 상태 분리
    const [realEstateTypeError, setRealEstateTypeError] = useState<string | null>(null);
    const [tradeTypeError, setTradeTypeError] = useState<string | null>(null);
    const [customerSummaryError, setCustomerSummaryError] = useState<string | null>(null);
    const [contractSummaryError, setContractSummaryError] = useState<string | null>(null);
    const [consultationSummaryError, setConsultationSummaryError] = useState<string | null>(null);

    //계약
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [contractsLoading, setContractsLoading] = useState(false);
    const [contractsError, setContractsError] = useState<string | null>(null);

    const [selectedPeriod, setSelectedPeriod] = useState('today');

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
        localStorage.removeItem('sseSubscribed');
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

    const fetchContracts = async () => {
        try {
            setContractsLoading(true);
            setContractsError(null);
            const response = await api.get("/api/contracts");
            if (response.data.success) {
                setContracts(response.data.data.content);
            }
        } catch (err) {
            console.error("Error fetching contracts:", err);
            setContractsError("계약 정보를 불러오는데 실패했습니다.");
        } finally {
            setContractsLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);
    

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

        return () => {
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
                    fetchTradeTypeData(tradeTypePeriod),
                    fetchCustomerSummary(),
                    fetchContractSummary(),
                    fetchConsultationSummary()
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
    }, []); // 의존성 배열 비움 - 컴포넌트 마운트 시 한 번만 실행

    

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

    const fetchCustomerSummary = async () => {
        try {
            setCustomerSummaryLoading(true);
            setCustomerSummaryError(null);
            const response = await dashboardApi.getCustomerSummary();
            if (response.data.success && response.data.data) {
                setCustomerSummary(response.data.data);
            }
            return true;
        } catch (err) {
            console.error("Error fetching customer summary data:", err);
            setCustomerSummaryError("고객 요약 데이터를 불러오는데 실패했습니다.");
            return false;
        } finally {
            setCustomerSummaryLoading(false);
        }
    };

    const fetchContractSummary = async () => {
        try {
            setContractSummaryLoading(true);
            setContractSummaryError(null);
            const response = await dashboardApi.getContractSummary();
            if (response.data.success && response.data.data) {
                setContractSummary(response.data.data);
            }
            return true;
        } catch (err) {
            console.error("Error fetching contract summary data:", err);
            setContractSummaryError("계약 요약 데이터를 불러오는데 실패했습니다.");
            return false;
        } finally {
            setContractSummaryLoading(false);
        }
    };

    const fetchConsultationSummary = async () => {
        try {
            setConsultationSummaryLoading(true);
            setConsultationSummaryError(null);
            const response = await dashboardApi.getConsultationSummary();
            if (response.data.success && response.data.data) {
                setConsultationSummary(response.data.data);
            }
            return true;
        } catch (err) {
            console.error("Error fetching consultation summary data:", err);
            setConsultationSummaryError("상담 요약 데이터를 불러오는데 실패했습니다.");
            return false;
        } finally {
            setConsultationSummaryLoading(false);
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

    const handlePeriodChange = (event: React.MouseEvent<HTMLElement>, newPeriod: string) => {
        if (newPeriod !== null) {
            setSelectedPeriod(newPeriod);
        }
    };

    const getContractsByPeriod = (period: string = selectedPeriod) => {
        if (!contracts) return [];
        
        return contracts.filter(contract => {
            const expiredDate = parseISO(contract.expiredAt);
            switch (period) {
                case 'today':
                    return isToday(expiredDate);
                case '1-2month':
                    return !isToday(expiredDate) && (
                        isSameMonth(expiredDate, new Date()) ||
                        isSameMonth(expiredDate, addMonths(new Date(), 1))
                    );
                case '3month':
                    const daysDiff3 = differenceInDays(expiredDate, new Date());
                    return daysDiff3 > 60 && daysDiff3 <= 90;
                case '4-6month':
                    const daysDiff6 = differenceInDays(expiredDate, new Date());
                    return daysDiff6 > 90 && daysDiff6 <= 180;
                default:
                    return false;
            }
        }).sort((a, b) => new Date(a.expiredAt).getTime() - new Date(b.expiredAt).getTime());
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
                        formatter: (value: any) => {
                            if (value.label === '기타') {
                                const otherTypesInfo = otherTypes
                                    .map(type => `${type.type}: ${type.ratio.toFixed(1)}%`)
                                    .join('<br/>');
                                return `기타 (${value.data.toFixed(1)}%)<br/><br/>${otherTypesInfo}`;
                            }
                            return `${value.label}: ${value.data.toFixed(1)}%`;
                        }
                    },
                    legend: {
                        visible: true,
                        showCheckbox: false 
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
                        formatter: (value: any) => `${value.label}: ${value.data.toFixed(1)}%`
                    },
                    legend: {
                        visible: true,
                        showCheckbox: false 
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

    const handleContractClick = (contractId: string) => {
    navigate(`/contract/${contractId}`);
};

    return (
        <Box sx={{ px: 4, pb: 6 }}>
            {/* 통계 */}
            <Grid container spacing={4} sx={{ mb: 4, mt: 2 }}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 4, bgcolor: '#ffffff', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box>
                                <Typography color="#003459" variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                    금주 신규 고객
                                </Typography>
                                {customerSummaryLoading ? (
                                    <CircularProgress size={24} />
                                ) : customerSummaryError ? (
                                    <Typography color="error" variant="body2">
                                        {customerSummaryError}
                                    </Typography>
                                ) : customerSummary ? (
                                    <Typography variant="h4" sx={{ color: '#00171f', fontWeight: 600 }}>
                                        {customerSummary.count}
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        데이터를 불러올 수 없습니다.
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{ 
                                p: 1.5, 
                                bgcolor: '#00a8e8', 
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <People sx={{ color: '#ffffff' }} />
                            </Box>
                        </Box>
                        {customerSummary && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: customerSummary.rate >= 0 ? '#007ea7' : '#00171f',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5
                                    }}
                                >
                                    {customerSummary.rate >= 0 ? '+' : ''}{customerSummary.rate.toFixed(1)}%
                                </Typography>
                                <Typography variant="body2" color="#003459">
                                    전주 대비
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 4, bgcolor: '#ffffff', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box>
                                <Typography color="#003459" variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                    진행중인 계약
                                </Typography>
                                {contractSummaryLoading ? (
                                    <CircularProgress size={24} />
                                ) : contractSummaryError ? (
                                    <Typography color="error" variant="body2">
                                        {contractSummaryError}
                                    </Typography>
                                ) : contractSummary ? (
                                    <Typography variant="h4" sx={{ color: '#00171f', fontWeight: 600 }}>
                                        {contractSummary.count}
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        데이터를 불러올 수 없습니다.
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{ 
                                p: 1.5, 
                                bgcolor: '#00a8e8', 
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <InsertDriveFile sx={{ color: '#ffffff' }} />
                            </Box>
                        </Box>
                        {contractSummary && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: contractSummary.rate >= 0 ? '#007ea7' : '#00171f',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5
                                    }}
                                >
                                    {contractSummary.rate >= 0 ? '+' : ''}{contractSummary.rate.toFixed(1)}%
                                </Typography>
                                <Typography variant="body2" color="#003459">
                                    전주 대비
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Paper 
                        sx={{ 
                            p: 4, 
                            bgcolor: '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            '&:hover': {
                                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
                                transform: 'translateY(-4px)'
                            }
                        }}
                        onClick={() => navigate('/consultation')}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box>
                                <Typography color="#003459" variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                                    오늘 상담
                                </Typography>
                                {consultationSummaryLoading ? (
                                    <CircularProgress size={24} />
                                ) : consultationSummaryError ? (
                                    <Typography color="error" variant="body2">
                                        {consultationSummaryError}
                                    </Typography>
                                ) : consultationSummary ? (
                                    <Typography variant="h4" sx={{ color: '#00171f', fontWeight: 600 }}>
                                        {consultationSummary.todayCount}
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        데이터를 불러올 수 없습니다.
                                    </Typography>
                                )}
                            </Box>
                            <Box sx={{ 
                                p: 1.5, 
                                bgcolor: '#00a8e8', 
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Forum sx={{ color: '#ffffff' }} />
                            </Box>
                        </Box>
                        {consultationSummary && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: '#007ea7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5
                                    }}
                                >
                                    {consultationSummary.remainingCount}건 남음
                                </Typography>
                                <Typography variant="body2" color="#003459">
                                    오늘의 상담 일정
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* 만료 예정 계약 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 4, bgcolor: '#ffffff', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" sx={{ color: '#00171f', fontWeight: 600 }}>
                                만료 예정 계약
                            </Typography>
                            <ToggleButtonGroup
                                value={selectedPeriod}
                                exclusive
                                onChange={handlePeriodChange}
                                aria-label="만료 계약 기간 선택"
                                size="small"
                                sx={{
                                    '& .MuiToggleButton-root': {
                                        px: 2,
                                        py: 0.5,
                                        fontSize: '0.875rem',
                                        color: '#003459',
                                        '&.Mui-selected': {
                                            bgcolor: '#007ea7',
                                            color: '#ffffff',
                                            '&:hover': {
                                                bgcolor: '#003459',
                                            },
                                        },
                                    },
                                }}
                            >
                                <ToggleButton value="today" aria-label="오늘">
                                    오늘 ({contracts.filter(c => isToday(parseISO(c.expiredAt))).length})
                                </ToggleButton>
                                <ToggleButton value="1-2month" aria-label="1-2개월">
                                    1-2개월 ({contracts.filter(c => {
                                        const expiredDate = parseISO(c.expiredAt);
                                        return !isToday(expiredDate) && (
                                            isSameMonth(expiredDate, new Date()) ||
                                            isSameMonth(expiredDate, addMonths(new Date(), 1))
                                        );
                                    }).length})
                                </ToggleButton>
                                <ToggleButton value="3month" aria-label="3개월">
                                    3개월 ({contracts.filter(c => {
                                        const expiredDate = parseISO(c.expiredAt);
                                        const today = new Date();
                                        const daysDiff = differenceInDays(expiredDate, today);
                                        return daysDiff > 60 && daysDiff <= 90;
                                    }).length})
                                </ToggleButton>
                                <ToggleButton value="4-6month" aria-label="4-6개월">
                                    4-6개월 ({contracts.filter(c => {
                                        const expiredDate = parseISO(c.expiredAt);
                                        const today = new Date();
                                        const daysDiff = differenceInDays(expiredDate, today);
                                        return daysDiff > 90 && daysDiff <= 180;
                                    }).length})
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        {contractsLoading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : contractsError ? (
                            <Typography color="error" variant="body2">
                                {contractsError}
                            </Typography>
                        ) : (
                            <Box sx={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ 
                                            backgroundColor: '#e9ecef',
                                            borderBottom: '1px solid #e9ecef'
                                        }}>
                                            <th style={{ 
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                color: '#003459'
                                            }}>임대인</th>
                                            <th style={{ 
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                color: '#003459'
                                            }}>임차인</th>
                                            <th style={{ 
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                color: '#003459'
                                            }}>만료일</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getContractsByPeriod().filter(contract => {
                                            const expiredDate = parseISO(contract.expiredAt);
                                            switch (selectedPeriod) {
                                                case 'today':
                                                    return isToday(expiredDate);
                                                case '1-2month':
                                                    return !isToday(expiredDate) && (
                                                        isSameMonth(expiredDate, new Date()) ||
                                                        isSameMonth(expiredDate, addMonths(new Date(), 1))
                                                    );
                                                case '3month':
                                                    const daysDiff3 = differenceInDays(expiredDate, new Date());
                                                    return daysDiff3 > 60 && daysDiff3 <= 90;
                                                case '4-6month':
                                                    const daysDiff6 = differenceInDays(expiredDate, new Date());
                                                    return daysDiff6 > 90 && daysDiff6 <= 180;
                                                default:
                                                    return false;
                                            }
                                        }).length === 0 ? (
                                            <tr>
                                                <td colSpan={4} style={{ 
                                                    padding: '24px',
                                                    textAlign: 'center',
                                                    color: '#00a8e8'
                                                }}>
                                                    {selectedPeriod === 'today' && '오늘 만료되는 계약이 없습니다.'}
                                                    {selectedPeriod === '1-2month' && '1-2개월 이내 만료되는 계약이 없습니다.'}
                                                    {selectedPeriod === '3month' && '3개월 이내 만료되는 계약이 없습니다.'}
                                                    {selectedPeriod === '4-6month' && '4-6개월 이내 만료되는 계약이 없습니다.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            getContractsByPeriod()
                                                .map(contract => (
                                                    <tr 
                                                        key={contract.id}
                                                        style={{ 
                                                            borderBottom: '1px solid #e9ecef',
                                                            cursor: 'pointer',
                                                            backgroundColor: 'transparent',
                                                            transition: 'background-color 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                        onClick={() => handleContractClick(contract.id)}
                                                    >
                                                        <td style={{ 
                                                            padding: '12px 16px',
                                                            fontSize: '0.875rem',
                                                            color: '#00171f'
                                                        }}>
                                                            {contract.landlordName}
                                                        </td>
                                                        <td style={{ 
                                                            padding: '12px 16px',
                                                            fontSize: '0.875rem',
                                                            color: '#00171f'
                                                        }}>
                                                            {contract.tenantName}
                                                        </td>
                                                        <td style={{ 
                                                            padding: '12px 16px',
                                                            fontSize: '0.875rem',
                                                            color: '#666666'
                                                        }}>
                                                            {format(parseISO(contract.expiredAt), 'yyyy년 M월 d일')}
                                                        </td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6">매물 유형별 분포</Typography>
                            <ToggleButtonGroup
                                value={realEstateTypePeriod}
                                exclusive
                                onChange={handleRealEstateTypePeriodChange}
                                aria-label="매물 유형 기간 선택"
                                size="small"
                                sx={{
                                    '& .MuiToggleButton-root': {
                                        px: 2,
                                        py: 0.5,
                                        fontSize: '0.875rem',
                                        color: '#003459',
                                        '&.Mui-selected': {
                                            bgcolor: '#003459',
                                            color: '#ffffff',
                                            '&:hover': {
                                                bgcolor: '#002137',
                                            },
                                        },
                                    },
                                }}
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
                    <Paper sx={{ p: 3, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6">거래 유형별 분포</Typography>
                            <ToggleButtonGroup
                                value={tradeTypePeriod}
                                exclusive
                                onChange={handleTradeTypePeriodChange}
                                aria-label="거래 유형 기간 선택"
                                size="small"
                                sx={{
                                    '& .MuiToggleButton-root': {
                                        px: 2,
                                        py: 0.5,
                                        fontSize: '0.875rem',
                                        color: '#003459',
                                        '&.Mui-selected': {
                                            bgcolor: '#003459',
                                            color: '#ffffff',
                                            '&:hover': {
                                                bgcolor: '#002137',
                                            },
                                        },
                                    },
                                }}
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

            <Box sx={{ p: 2, textAlign: "center", mt: 4 }}>
                <Typography variant="caption" color="textSecondary">
                    © 2025 중개모아. All rights reserved.
                </Typography>
            </Box>
            
        </Box>
    )
}

export default Dashboard