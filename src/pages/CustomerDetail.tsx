"use client"

import { useState, useEffect } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Button,
    Divider,
    AppBar,
    Toolbar,
    IconButton,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert,
} from "@mui/material"
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import { ArrowBack, Edit, Delete, Campaign, Message, Assignment, Description, Poll } from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { customerApi } from "../services/customerApi"
import type { CustomerResponse, History, CustomerHistoryResponse } from "../services/customerApi"

const CustomerDetail = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [customer, setCustomer] = useState<CustomerResponse | null>(null)
    const [history, setHistory] = useState<History[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteSuccess, setDeleteSuccess] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<string>('전체')
    const [filteredHistory, setFilteredHistory] = useState<History[]>([])

    const getHistoryIcon = (type: History['type']) => {
        switch (type) {
            case 'CONSULTATION':
                return <Description />
            case 'CONTRACT':
                return <Assignment />
            case 'MESSAGE':
                return <Message />
            case 'SURVEY':
                return <Poll />
            default:
                return <Description />
        }
    }

    const getHistoryColor = (type: History['type']) => {
        switch (type) {
            case 'CONSULTATION':
                return 'primary'
            case 'CONTRACT':
                return 'success'
            case 'MESSAGE':
                return 'info'
            case 'SURVEY':
                return 'warning'
            default:
                return 'primary'
        }
    }

    useEffect(() => {
        if (!history || history.length === 0) {
            setFilteredHistory([]);
            return;
        }
        
        let filteredItems: History[] = [];
        
        if (activeTab === '전체') {
            filteredItems = [...history];
        } else {
            const typeMap: Record<string, History['type']> = {
                '계약': 'CONTRACT',
                '상담': 'CONSULTATION',
                '메시지': 'MESSAGE',
                '설문': 'SURVEY'
            };

            const targetType = typeMap[activeTab as keyof typeof typeMap];

            filteredItems = history.filter(item => item.type === targetType);
            
        }
        
        const sortedItems = filteredItems.sort((a, b) => {
            const dateA = a.type === 'CONTRACT' && !a.date ? a.startDate : a.date;
            const dateB = b.type === 'CONTRACT' && !b.date ? b.startDate : b.date;
            
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
            
            return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        
        setFilteredHistory(sortedItems);
    }, [activeTab, history]);

    const getTabCount = (tabName: string): number => {
        if (!history || history.length === 0) return 0;
        
        if (tabName === '전체') return history.length;
        
        const typeMap: Record<string, History['type']> = {
            '계약': 'CONTRACT',
            '상담': 'CONSULTATION',
            '메시지': 'MESSAGE',
            '설문': 'SURVEY'
        };
        
        const targetType = typeMap[tabName];
        if (!targetType) return 0;
        
        return history.filter(item => item.type === targetType).length;
    };

    useEffect(() => {
        if (id) {
            fetchCustomerDetails(Number.parseInt(id))
        }
    }, [id])

    const fetchCustomerDetails = async (customerId: number) => {
        try {
            setLoading(true)
            const response = await customerApi.getCustomerById(customerId)

            if (response.data.success && response.data.data) {
                const { history, ...customerData } = response.data.data
                setCustomer(customerData)
                setHistory(history)
            } else {
                setError("고객 정보를 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching customer details:", err)
            setError("고객 정보를 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const formatHistoryContent = (history: History) => {
        const getMessageStatus = (status: string | null) => {
            if (!status) return '상태 정보 없음';
            
            switch (status) {
                case 'PENDING':
                    return '전송 예약';
                case 'FAILED':
                    return '전송 실패';
                case 'SENT':
                    return '전송 완료';
                default:
                    return status;
            }
        };

        const truncateText = (text: string, maxLength: number) => {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        };

        switch (history.type) {
            case 'CONSULTATION':
                return `상담 목적: ${truncateText(history.purpose || '없음', 30)}`
            case 'CONTRACT':
                return `계약 기간: ${history.startDate || '없음'} ~ ${history.endDate || '없음'}`
            case 'MESSAGE':
                const content = history.content || '없음';
                const status = getMessageStatus(history.sendStatus);
                const maxContentLength = 25;
                
                if (content.length > maxContentLength) {
                    return `메시지: ${truncateText(content, maxContentLength)} (상태: ${status})`;
                } else {
                    return `메시지: ${content} (상태: ${status})`;
                }
            case 'SURVEY':
                return '설문 완료'
            default:
                return ''
        }
    }

    const handleDeleteClick = () => {
        setOpenDeleteDialog(true)
    }

    const handleDeleteClose = () => {
        setOpenDeleteDialog(false)
    }

    const handleDeleteConfirm = async () => {
        if (!id) return

        try {
            setDeleteLoading(true)
            setDeleteError(null)

            const response = await customerApi.deleteCustomer(Number.parseInt(id))

            if (response.data.success) {
                setDeleteSuccess(true)
                handleDeleteClose()

                // Redirect after successful deletion
                navigate("/customer-management")
            } else {
                setDeleteError(response.data.error?.message || "고객 삭제에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error deleting customer:", err)
            setDeleteError(err.response?.data?.error?.message || "고객 삭제에 실패했습니다.")
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleHistoryItemClick = (item: History) => {
        switch (item.type) {
            case 'CONSULTATION':
                navigate(`/consultation/${item.id}?customerId=${id}`);
                break;
            case 'CONTRACT':
                navigate(`/contract/${item.id}`);
                break;
            case 'SURVEY':
                navigate(`/survey/answers`);
                break;
            case 'MESSAGE':
                navigate('/message/history');
                break;
            default:
                break;
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error || !customer) {
        return (
            <Container>
                <Box sx={{ mt: 5, textAlign: "center" }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        {error || "고객을 찾을 수 없습니다."}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate("/customer-management")} sx={{ mt: 2 }}>
                        고객 목록으로 돌아가기
                    </Button>
                </Box>
            </Container>
        )
    }

    return (
        <Box sx={{ flexGrow: 1, minHeight: "100vh", py: 3 }}>
            <Container
                maxWidth="lg"
                sx={{
                    mx: "auto",
                }}
            >
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper 
                            elevation={0} 
                            sx={{ 
                                p: 4, 
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                        >
                            <Box sx={{ 
                                display: "flex", 
                                alignItems: "center", 
                                mb: 4,
                                justifyContent: "space-between"
                            }}>
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <IconButton 
                                        onClick={() => navigate("/customer-management")} 
                                        sx={{ 
                                            mr: 2,
                                            color: 'text.secondary'
                                        }}
                                    >
                                        <ArrowBack />
                                    </IconButton>
                                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                        고객 상세 정보
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Button
                                        startIcon={<Edit />}
                                        onClick={() => navigate(`/customer-management/edit/${id}`)}
                                        sx={{ 
                                            color: 'text.secondary',
                                            '&:hover': {
                                                bgcolor: 'rgba(0,0,0,0.04)'
                                            }
                                        }}
                                    >
                                        수정
                                    </Button>
                                    <Button 
                                        startIcon={<Delete />} 
                                        onClick={handleDeleteClick}
                                        sx={{ 
                                            color: 'error.main',
                                            '&:hover': {
                                                bgcolor: 'error.lighter'
                                            }
                                        }}
                                    >
                                        삭제
                                    </Button>
                                </Box>
                            </Box>

                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        이름
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {customer.name}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        상태
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box
                                            sx={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: '50%',
                                                bgcolor: customer.isVip ? 'success.main' : 'text.secondary',
                                                mr: 1
                                            }}
                                        />
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                            {customer.isVip ? "VIP" : "일반"}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        연락처
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {customer.phone}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        이메일
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {customer.email || "-"}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        생년월일
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {customer.birthday || "-"}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        직업
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {customer.job || "-"}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        관심 매물
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {customer.interestProperty || "-"}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        관심 지역
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {customer.interestLocation || "-"}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        자산 상태
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {customer.assetStatus || "-"}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        마케팅 동의
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {customer.consent ? "동의함" : "동의하지 않음"}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 3 }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        메모
                                    </Typography>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3,
                                            bgcolor: "#f8f9fa",
                                            minHeight: "100px",
                                            borderRadius: 1,
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                            {customer.memo || "메모가 없습니다."}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper 
                            elevation={0} 
                            sx={{ 
                                p: 4, 
                                borderRadius: 2, 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 500, mb: 3 }}>
                                고객 히스토리
                            </Typography>
                            {loading ? (
                                <Box sx={{ display: "flex", justifyContent: "center", p: 3, flexGrow: 1 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <Box sx={{ 
                                    overflowY: 'auto', 
                                    maxHeight: 'calc(100vh - 250px)', 
                                    pr: 2,
                                    flexGrow: 1
                                }}>
                                    <Box sx={{ mb: 3 }}>
                                        <Box sx={{ 
                                            display: 'flex', 
                                            gap: 1, 
                                            mb: 2,
                                            overflowX: 'auto',
                                            '&::-webkit-scrollbar': {
                                                display: 'none'
                                            }
                                        }}>
                                            {['전체', '계약', '상담', '메시지', '설문'].map((tab) => (
                                                <Button
                                                    key={tab}
                                                    variant="text"
                                                    size="small"
                                                    onClick={() => setActiveTab(tab)}
                                                    sx={{
                                                        borderRadius: '20px',
                                                        px: 2,
                                                        py: 0.5,
                                                        minWidth: 'auto',
                                                        color: activeTab === tab ? 'white' : 'text.primary',
                                                        bgcolor: activeTab === tab ? 'primary.main' : 'grey.100',
                                                        '&:hover': {
                                                            bgcolor: activeTab === tab ? 'primary.dark' : 'grey.200'
                                                        }
                                                    }}
                                                >
                                                    {tab} ({getTabCount(tab)})
                                                </Button>
                                            ))}
                                        </Box>
                                    </Box>
                                    <Timeline sx={{ 
                                        p: 0,
                                        m: 0,
                                        '& .MuiTimelineItem-root': {
                                            minHeight: 'auto',
                                            '&:before': {
                                                display: 'none'
                                            }
                                        },
                                        '& .MuiTimelineContent-root': {
                                            padding: '0 0 12px 12px'
                                        }
                                    }}>
                                        {filteredHistory.map((item, index) => (
                                            <TimelineItem key={`${item.id}-${index}`}>
                                                <TimelineSeparator>
                                                    <TimelineDot 
                                                        sx={{ 
                                                            boxShadow: 'none',
                                                            p: 0.75,
                                                            m: 0
                                                        }}
                                                        color={getHistoryColor(item.type)}
                                                    >
                                                        {getHistoryIcon(item.type)}
                                                    </TimelineDot>
                                                    <TimelineConnector sx={{ bgcolor: 'grey.200' }} />
                                                </TimelineSeparator>
                                                <TimelineContent>
                                                    <Box 
                                                        onClick={() => handleHistoryItemClick(item)}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            p: 1.5,
                                                            borderRadius: 1,
                                                            '&:hover': {
                                                                bgcolor: 'rgba(0,0,0,0.02)'
                                                            }
                                                        }}
                                                    >
                                                        <Typography 
                                                            variant="caption" 
                                                            sx={{ 
                                                                color: 'text.secondary',
                                                                display: 'block',
                                                                mb: 0.25
                                                            }}
                                                        >
                                                            {item.type === 'CONTRACT' && !item.date ? 
                                                                (item.startDate ? new Date(item.startDate).toLocaleString() : '날짜 정보 없음') : 
                                                                (item.date ? new Date(item.date).toLocaleString() : '날짜 정보 없음')}
                                                        </Typography>
                                                        <Typography 
                                                            variant="body2" 
                                                            sx={{ 
                                                                color: 'text.primary',
                                                                fontWeight: 500,
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                maxWidth: '250px'
                                                            }}
                                                        >
                                                            {formatHistoryContent(item)}
                                                        </Typography>
                                                    </Box>
                                                </TimelineContent>
                                            </TimelineItem>
                                        ))}
                                        {filteredHistory.length === 0 && (
                                            <Box sx={{ 
                                                textAlign: 'center', 
                                                py: 4,
                                                color: 'text.secondary'
                                            }}>
                                                <Typography variant="body2">
                                                    {activeTab === '전체' ? 
                                                        '히스토리가 없습니다.' : 
                                                        `${activeTab} 히스토리가 없습니다.`}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Timeline>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* Delete Confirmation Dialog */}
            <Dialog 
                open={openDeleteDialog} 
                onClose={handleDeleteClose}
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1 }}>고객 삭제</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: 'text.secondary' }}>
                        {customer.name} 고객의 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 1 }}>
                    <Button 
                        onClick={handleDeleteClose} 
                        disabled={deleteLoading}
                        sx={{ 
                            color: 'text.secondary',
                            '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.04)'
                            }
                        }}
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
                        sx={{
                            '&:hover': {
                                bgcolor: 'error.light'
                            }
                        }}
                    >
                        {deleteLoading ? "삭제 중..." : "삭제"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Snackbar */}
            <Snackbar 
                open={deleteSuccess} 
                autoHideDuration={6000} 
                onClose={() => setDeleteSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setDeleteSuccess(false)} 
                    severity="success" 
                    sx={{ 
                        width: "100%",
                        borderRadius: 2
                    }}
                >
                    고객이 성공적으로 삭제되었습니다. 고객 목록 페이지로 이동합니다.
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar 
                open={!!deleteError} 
                autoHideDuration={6000} 
                onClose={() => setDeleteError(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    onClose={() => setDeleteError(null)} 
                    severity="error" 
                    sx={{ 
                        width: "100%",
                        borderRadius: 2
                    }}
                >
                    {deleteError}
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default CustomerDetail

