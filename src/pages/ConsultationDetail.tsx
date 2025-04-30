"use client"

import React, { useState, useEffect } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Button,
    IconButton,
    Chip,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    CircularProgress,
    Snackbar,
    Alert,
    Link,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from "@mui/material"
import {
    ArrowBack,
    Edit,
    Save,
    Add,
    Phone,
    Email,
    Cake,
    Campaign,
    Person,
    ChevronLeft,
    ChevronRight,
} from "@mui/icons-material"
import { useNavigate, useParams, Link as RouterLink, useLocation } from "react-router-dom"
import { consultationApi } from "../services/consultationApi"
import { ConsultationStatus, ConsultationResponse, ConsultationHistoryDto, ConsultationCreateRequest, ConsultationUpdateRequest } from "../types/consultation"
import { format } from 'date-fns'

// 상담 상태별 칩 색상 및 텍스트 - 새로운 상태 값에 맞게 업데이트
const statusConfig = {
    [ConsultationStatus.WAITING]: { color: "#e3f2fd", textColor: "#1976d2", label: "예약 대기" },
    [ConsultationStatus.CONFIRMED]: { color: "#fff8e1", textColor: "#f57c00", label: "예약 확정" },
    [ConsultationStatus.COMPLETED]: { color: "#e8f5e9", textColor: "#2e7d32", label: "진행 완료" },
    [ConsultationStatus.CANCELED]: { color: "#ffebee", textColor: "#c62828", label: "예약 취소" },
}

const ConsultationDetail = () => {
    const { id: consultationId } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const location = useLocation()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [consultationHistory, setConsultationHistory] = useState<ConsultationHistoryDto | null>(null)
    const [selectedConsultation, setSelectedConsultation] = useState<ConsultationResponse | null>(null)
    const [isNewConsultation, setIsNewConsultation] = useState(true)
    const [currentPage, setCurrentPage] = useState(0)
    const [pageSize] = useState(5)
    const [editFormData, setEditFormData] = useState<Partial<ConsultationResponse>>({
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        consultationStatus: ConsultationStatus.WAITING,
    })
    const [originalConsultationData, setOriginalConsultationData] = useState<Partial<ConsultationResponse> | null>(null)
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
        open: false,
        message: "",
        severity: "success",
    })
    const [viewMode, setViewMode] = useState<'history' | 'detail'>('history')
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [consultationToEdit, setConsultationToEdit] = useState<ConsultationResponse | null>(null)
    const [confirmNewConsultationDialogOpen, setConfirmNewConsultationDialogOpen] = useState(false)
    const [currentlyEditingConsultationId, setCurrentlyEditingConsultationId] = useState<number | null>(null)
    const [initialConsultationId, setInitialConsultationId] = useState<number | null>(null)
    const [isLoadingConsultation, setIsLoadingConsultation] = useState(false)
    const [openStatusMenuId, setOpenStatusMenuId] = useState<number | null>(null)
    const [initialConsultationLoaded, setInitialConsultationLoaded] = useState(false)
    const [customerId, setCustomerId] = useState<number | null>(null)

    useEffect(() => {
        // Get customerId from query parameters
        const searchParams = new URLSearchParams(location.search)
        const customerIdParam = searchParams.get('customerId')
        
        if (customerIdParam) {
            const parsedCustomerId = parseInt(customerIdParam, 10)
            if (!isNaN(parsedCustomerId)) {
                setCustomerId(parsedCustomerId)
            }
        }
        
        if (consultationId) {
            fetchConsultationById(parseInt(consultationId, 10))
        }
    }, [consultationId, location.search])

    // Effect to load consultation history when customerId is available
    useEffect(() => {
        if (customerId) {
            fetchConsultationHistory()
        }
    }, [customerId, currentPage])

    const fetchConsultationHistory = async () => {
        try {
            setLoading(true)
            setError(null)
            
            if (!consultationId) {
                setError("상담 ID가 필요합니다.")
                return
            }

            const response = await consultationApi.getConsultationHistoryByConsultationId(
                parseInt(consultationId, 10),
                currentPage,
                pageSize
            )

            if (response.data?.data) {
                setConsultationHistory(response.data.data)
                
                // Only fetch consultation by ID if we're not already loading it
                if (currentlyEditingConsultationId && !isLoadingConsultation) {
                    await fetchConsultationById(currentlyEditingConsultationId)
                }
            } else {
                setError("상담 내역을 불러오는데 실패했습니다.")
            }
        } catch (error) {
            console.error("Error fetching consultation history:", error)
            setError("상담 내역을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const fetchConsultationById = async (consultationId: number) => {
        // Skip if we're already loading this consultation
        if (isLoadingConsultation) {
            return
        }

        try {
            setIsLoadingConsultation(true)
            const response = await consultationApi.getConsultationById(consultationId)
            
            if (response.data?.data) {
                const consultation = response.data.data
                
                // Check if we're already editing this consultation
                if (currentlyEditingConsultationId === consultationId && originalConsultationData) {
                    // Always preserve the user's edits
                    setSelectedConsultation(consultation)
                    
                    // Update the original data to match the fetched consultation
                    setOriginalConsultationData({
                        consultationId: consultation.consultationId,
                        date: consultation.date,
                        consultationStatus: consultation.consultationStatus,
                        purpose: consultation.purpose,
                        memo: consultation.memo,
                    })
                } else if (consultationId === initialConsultationId && initialConsultationLoaded) {
                    // If this is the initial consultation and it's already loaded, don't reload it
                    console.log("Initial consultation already loaded, skipping reload")
                } else {
                    // If we're not already editing this consultation, start editing it
                    setSelectedConsultation(consultation)
                    setEditFormData({
                        consultationId: consultation.consultationId,
                        date: consultation.date,
                        consultationStatus: consultation.consultationStatus,
                        purpose: consultation.purpose,
                        memo: consultation.memo,
                    })
                    setOriginalConsultationData({
                        consultationId: consultation.consultationId,
                        date: consultation.date,
                        consultationStatus: consultation.consultationStatus,
                        purpose: consultation.purpose,
                        memo: consultation.memo,
                    })
                    setCurrentlyEditingConsultationId(consultationId)
                    // Set isNewConsultation to false since we're editing an existing consultation
                    setIsNewConsultation(false)
                }
            }
        } catch (error) {
            console.error("Error fetching consultation by ID:", error)
            setError("상담 정보를 불러오는데 실패했습니다.")
        } finally {
            setIsLoadingConsultation(false)
        }
    }

    const handleConsultationSelect = (consultation: ConsultationResponse) => {
        setSelectedConsultation(consultation)
        setViewMode('detail')
    }

    const handleBackToHistory = () => {
        setViewMode('history')
    }

    const handleNewConsultation = () => {
        if (editFormData.purpose || editFormData.memo) {
            setConfirmNewConsultationDialogOpen(true)
        } else {
            setIsNewConsultation(true)
            setEditFormData({
                customerId: customerId,
                date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                consultationStatus: ConsultationStatus.WAITING,
            })
            setCurrentlyEditingConsultationId(null)
        }
    }

    const handleConfirmNewConsultationDialogClose = (confirmed: boolean) => {
        setConfirmNewConsultationDialogOpen(false)
        if (confirmed) {
            setIsNewConsultation(true)
            setEditFormData({
                customerId: customerId,
                date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
                consultationStatus: ConsultationStatus.WAITING,
            })
            setCurrentlyEditingConsultationId(null)
        }
    }

    const handleEditChange = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<ConsultationStatus>
    ) => {
        const { name, value } = event.target
        
        // 날짜 입력의 경우 연도를 4자리로 제한
        if (name === 'date') {
            const year = value.split('-')[0];
            if (year.length > 4) return;
        }
        
        setEditFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSave = async () => {
        if (!consultationHistory) return

        if (!editFormData.purpose) {
            setSnackbar({
                open: true,
                message: "상담 목적을 입력해주세요.",
                severity: "error"
            })
            return
        }

        // Check if the consultation date is in the future for new consultations
        if (isNewConsultation) {
            const consultationDate = new Date(editFormData.date || "")
            const now = new Date()
            
            if (consultationDate <= now) {
                setSnackbar({
                    open: true,
                    message: "상담 일시는 미래의 시간이어야 합니다.",
                    severity: "error"
                })
                return
            }
        }

        try {
            if (isNewConsultation) {
                const createData: ConsultationCreateRequest = {
                    customerId: customerId!,
                    date: format(new Date(editFormData.date || ""), "yyyy-MM-dd HH:mm"),
                    purpose: editFormData.purpose,
                    memo: editFormData.memo,
                    consultationStatus: editFormData.consultationStatus
                }
                const response = await consultationApi.createConsultation(createData)
                if (response.data.success) {
                    // 새 상담이 생성되면 상담 목록을 새로고침
                    await fetchConsultationHistory()
                    
                    // 모든 페이지를 검색하여 새로 생성된 상담을 찾음
                    let foundNewConsultation = false
                    let currentPage = 0
                    
                    while (!foundNewConsultation) {
                        const historyResponse = await consultationApi.getConsultationHistoryByConsultationId(
                            parseInt(consultationId!, 10),
                            currentPage,
                            pageSize
                        )
                        
                        if (!historyResponse.data?.data || historyResponse.data.data.consultations.content.length === 0) {
                            break
                        }
                        
                        // 현재 페이지에서 새 상담을 찾음
                        const newConsultation = historyResponse.data.data.consultations.content.find(
                            consultation => 
                                consultation.date === format(new Date(editFormData.date || ""), "yyyy-MM-dd HH:mm") &&
                                consultation.purpose === editFormData.purpose &&
                                consultation.memo === editFormData.memo
                        )
                        
                        if (newConsultation) {
                            // 새 상담 정보로 수정 폼 업데이트
                            setEditFormData({
                                consultationId: newConsultation.consultationId,
                                date: newConsultation.date,
                                consultationStatus: newConsultation.consultationStatus,
                                purpose: newConsultation.purpose,
                                memo: newConsultation.memo,
                            })
                            setIsNewConsultation(false)
                            foundNewConsultation = true
                            break
                        }
                        
                        currentPage++
                    }
                }
                setSnackbar({
                    open: true,
                    message: "새로운 상담이 등록되었습니다.",
                    severity: "success"
                })
            } else if (selectedConsultation) {
                const updateData: ConsultationUpdateRequest = {
                    purpose: editFormData.purpose,
                    memo: editFormData.memo,
                    consultationStatus: editFormData.consultationStatus,
                    date: selectedConsultation.date // 수정 시에는 날짜를 변경하지 않음
                }
                await consultationApi.updateConsultation(selectedConsultation.consultationId, updateData)
                setSnackbar({
                    open: true,
                    message: "상담 정보가 수정되었습니다.",
                    severity: "success"
                })
            }
        } catch (err) {
            console.error("Error saving consultation:", err)
            setSnackbar({
                open: true,
                message: isNewConsultation ? "상담 등록 중 오류가 발생했습니다." : "상담 수정 중 오류가 발생했습니다.",
                severity: "error"
            })
        }
    }

    const handlePageChange = (newPage: number) => {
        // Store the currently editing consultation ID and form data before changing the page
        const editingId = currentlyEditingConsultationId
        const currentFormData = { ...editFormData }
        
        // Update the current page
        setCurrentPage(newPage)
        
        // Fetch the consultation history for the new page
        const fetchNewPageHistory = async () => {
            try {
                setLoading(true)
                console.log(`Fetching page ${newPage} for customer ${customerId}`)
                
                if (!customerId) {
                    console.error("Customer ID is missing")
                    return
                }
                
                const response = await consultationApi.getConsultationHistoryByConsultationId(
                    parseInt(consultationId, 10), 
                    newPage, 
                    pageSize
                )
                
                console.log("Response received:", response)
                
                if (response.data?.data) {
                    setConsultationHistory(response.data.data)
                    console.log("Consultation history updated")
                } else {
                    console.error("No data in response")
                }
            } catch (err) {
                console.error("Error fetching consultation history:", err)
            } finally {
                setLoading(false)
            }
        }
        
        // Fetch the new page history
        fetchNewPageHistory()
        
        // If we're editing a consultation, we need to fetch it again to ensure it's still available
        if (editingId) {
            // Fetch the consultation and preserve the user's edits
            consultationApi.getConsultationById(editingId)
                .then(response => {
                    if (response.data?.data) {
                        // Update the selected consultation
                        setSelectedConsultation(response.data.data)
                        
                        // Always restore the user's edits
                        setEditFormData(currentFormData)
                        
                        // Update the original data to match the fetched consultation
                        setOriginalConsultationData({
                            consultationId: response.data.data.consultationId,
                            date: response.data.data.date,
                            consultationStatus: response.data.data.consultationStatus,
                            purpose: response.data.data.purpose,
                            memo: response.data.data.memo,
                        })
                    }
                })
                .catch(err => {
                    console.error("Error fetching consultation by ID:", err)
                })
        }
    }

    const handleStatusChange = async (consultationId: number, newStatus: ConsultationStatus) => {
        try {
            await consultationApi.updateConsultationStatus(consultationId, newStatus)
            
            // Update the selected consultation if it's the one being edited
            if (selectedConsultation && selectedConsultation.consultationId === consultationId) {
                setSelectedConsultation({
                    ...selectedConsultation,
                    consultationStatus: newStatus
                })
                
                // Also update the editFormData state to reflect the new status
                setEditFormData(prev => ({
                    ...prev,
                    consultationStatus: newStatus
                }))
            }
            
            // Update the consultation in the history list
            if (consultationHistory) {
                const updatedConsultations = consultationHistory.consultations.content.map(consultation => {
                    if (consultation.consultationId === consultationId) {
                        return {
                            ...consultation,
                            consultationStatus: newStatus
                        }
                    }
                    return consultation
                })
                
                setConsultationHistory({
                    ...consultationHistory,
                    consultations: {
                        ...consultationHistory.consultations,
                        content: updatedConsultations
                    }
                })
                
                // If the consultation being edited is in the history list, update the editFormData
                if (currentlyEditingConsultationId === consultationId) {
                    setEditFormData(prev => ({
                        ...prev,
                        consultationStatus: newStatus
                    }))
                }
            }
            
            setSnackbar({
                open: true,
                message: "상담 상태가 변경되었습니다.",
                severity: "success"
            })
        } catch (err) {
            console.error("Error updating consultation status:", err)
            setSnackbar({
                open: true,
                message: "상담 상태 변경 중 오류가 발생했습니다.",
                severity: "error"
            })
        }
    }

    const handleEditClick = (consultation: ConsultationResponse) => {
        if (editFormData.purpose || editFormData.memo) {
            setConsultationToEdit(consultation)
            setConfirmDialogOpen(true)
        } else {
            handleStartEdit(consultation)
        }
    }

    const handleStartEdit = (consultation: ConsultationResponse) => {
        setSelectedConsultation(consultation)
        setIsNewConsultation(false)
        
        // Store the original consultation data
        const consultationData = {
            consultationId: consultation.consultationId,
            date: consultation.date,
            consultationStatus: consultation.consultationStatus,
            purpose: consultation.purpose,
            memo: consultation.memo,
        }
        
        setOriginalConsultationData(consultationData)
        setEditFormData(consultationData)
        setViewMode('history')
        setCurrentlyEditingConsultationId(consultation.consultationId)
    }

    const handleConfirmDialogClose = (confirmed: boolean) => {
        setConfirmDialogOpen(false)
        if (confirmed && consultationToEdit) {
            handleStartEdit(consultationToEdit)
        }
        setConsultationToEdit(null)
    }

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error || !consultationHistory) {
        return (
            <Container>
                <Box sx={{ mt: 5, textAlign: "center" }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        {error || "상담 내역을 찾을 수 없습니다."}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate("/consultation")} sx={{ mt: 2 }}>
                        상담 목록으로 돌아가기
                    </Button>
                </Box>
            </Container>
        )
    }

    return (
        <Box sx={{ flexGrow: 1, minHeight: "100vh", py: 3 }}>
            <Container maxWidth="xl">
                {/* 헤더 & 고객 정보 카드 */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                        <IconButton onClick={() => navigate("/consultation")} sx={{ mr: 2 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold", flexGrow: 1 }}>
                            고객 상담 관리
                        </Typography>
                    </Box>

                    <Paper elevation={0} sx={{ p: 3, borderRadius: 2, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" component="h2" sx={{ flexGrow: 1, color: '#00171f', fontWeight: 'bold' }}>
                                        고객 정보
                                    </Typography>
                                    <IconButton
                                        component={RouterLink}
                                        to={`/customer-management/${consultationHistory?.customer.id}`}
                                        color="primary"
                                        size="small"
                                    >
                                        <Person />
                                    </IconButton>
                                </Box>
                                <Paper sx={{ p: 2, bgcolor: '#f9fafb' }}>
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} md={6}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#007ea7', fontWeight: 'medium' }}>
                                                        이름
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ color: '#007ea7', mt: 0.5, fontWeight: 'bold' }}>
                                                        {consultationHistory?.customer.name}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 'medium' }}>
                                                        이메일
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ color: '#111827', mt: 0.5 }}>
                                                        {consultationHistory?.customer.email}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 'medium' }}>
                                                        전화번호
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ color: '#111827', mt: 0.5 }}>
                                                        {consultationHistory?.customer.phone}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 'medium' }}>
                                                        직업
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ color: '#111827', mt: 0.5 }}>
                                                        {consultationHistory?.customer.job || "-"}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={12} md={6} sx={{ 
                                            borderLeft: { md: '1px solid #e5e7eb' },
                                            pl: { md: 3 }
                                        }}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 'medium' }}>
                                                        관심매물
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ color: '#111827', mt: 0.5 }}>
                                                        {consultationHistory?.customer.interestProperty || "-"}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 'medium' }}>
                                                        관심지역
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ color: '#111827', mt: 0.5 }}>
                                                        {consultationHistory?.customer.interestLocation || "-"}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 'medium' }}>
                                                        자산상태
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ color: '#111827', mt: 0.5 }}>
                                                        {consultationHistory?.customer.assetStatus || "-"}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Paper>
                </Box>

                <Grid container spacing={3}>
                    {/* 좌측: 상담 히스토리 리스트 또는 상세 정보 */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: '600px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
                            {viewMode === 'history' ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold", color: '#111827' }}>
                                        상담 히스토리
                                    </Typography>

                                    <Box sx={{ 
                                        flexGrow: 1, 
                                        overflow: 'auto',
                                        minHeight: '400px',
                                        maxHeight: 'calc(100vh - 300px)',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        {consultationHistory.consultations.content.length > 0 ? (
                                            consultationHistory.consultations.content.map((consultation) => (
                                                <Box
                                                    key={consultation.consultationId}
                                                    id={`consultation-${consultation.consultationId}`}
                                                    onClick={() => handleConsultationSelect(consultation)}
                                                    sx={{
                                                        p: 2,
                                                        mb: 1,
                                                        border: '1px solid',
                                                        borderColor: currentlyEditingConsultationId === consultation.consultationId ? 'primary.main' : '#e5e7eb',
                                                        borderRadius: 1,
                                                        cursor: 'pointer',
                                                        bgcolor: currentlyEditingConsultationId === consultation.consultationId ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                                                        '&:hover': {
                                                            bgcolor: currentlyEditingConsultationId === consultation.consultationId ? 'rgba(25, 118, 210, 0.12)' : '#f9fafb'
                                                        },
                                                        minHeight: '80px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between'
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            {consultation.date}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <Chip
                                                                label={statusConfig[consultation.consultationStatus]?.label}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: statusConfig[consultation.consultationStatus]?.color,
                                                                    color: statusConfig[consultation.consultationStatus]?.textColor,
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    
                                                                    // Close any other open menu
                                                                    if (openStatusMenuId !== null) {
                                                                        const existingMenu = document.getElementById(`status-menu-${openStatusMenuId}`);
                                                                        if (existingMenu) {
                                                                            document.body.removeChild(existingMenu);
                                                                        }
                                                                    }
                                                                    
                                                                    // Set this menu as the open one
                                                                    setOpenStatusMenuId(consultation.consultationId);
                                                                    
                                                                    // Create a container for the menu that will be positioned relative to the viewport
                                                                    const menuContainer = document.createElement('div');
                                                                    menuContainer.id = `status-menu-${consultation.consultationId}`;
                                                                    menuContainer.style.position = 'fixed';
                                                                    menuContainer.style.zIndex = '1000';
                                                                    
                                                                    // Get the position of the chip relative to the viewport
                                                                    const chipRect = e.currentTarget.getBoundingClientRect();
                                                                    
                                                                    // Position the menu below the chip
                                                                    menuContainer.style.top = `${chipRect.bottom}px`;
                                                                    menuContainer.style.left = `${chipRect.left}px`;
                                                                    
                                                                    // Create the menu content
                                                                    const menu = document.createElement('div');
                                                                    menu.style.backgroundColor = 'white';
                                                                    menu.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                                    menu.style.borderRadius = '4px';
                                                                    menu.style.padding = '4px';
                                                                    
                                                                    Object.values(ConsultationStatus).forEach((status) => {
                                                                        if (status !== consultation.consultationStatus) {
                                                                            const option = document.createElement('div');
                                                                            option.style.padding = '8px 16px';
                                                                            option.style.cursor = 'pointer';
                                                                            option.style.color = statusConfig[status]?.textColor;
                                                                            option.style.backgroundColor = statusConfig[status]?.color;
                                                                            option.style.borderRadius = '4px';
                                                                            option.style.marginBottom = '4px';
                                                                            option.textContent = statusConfig[status]?.label;
                                                                            option.onclick = (e) => {
                                                                                e.stopPropagation();
                                                                                handleStatusChange(consultation.consultationId, status);
                                                                                document.body.removeChild(menuContainer);
                                                                                setOpenStatusMenuId(null);
                                                                            };
                                                                            menu.appendChild(option);
                                                                        }
                                                                    });
                                                                    
                                                                    menuContainer.appendChild(menu);
                                                                    document.body.appendChild(menuContainer);
                                                                    
                                                                    const closeMenu = (e: MouseEvent) => {
                                                                        if (!menuContainer.contains(e.target as Node)) {
                                                                            document.body.removeChild(menuContainer);
                                                                            document.removeEventListener('click', closeMenu);
                                                                            setOpenStatusMenuId(null);
                                                                        }
                                                                    };
                                                                    
                                                                    setTimeout(() => {
                                                                        document.addEventListener('click', closeMenu);
                                                                    }, 0);
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography 
                                                            variant="subtitle1" 
                                                            sx={{ 
                                                                fontWeight: "medium",
                                                                minHeight: '24px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                flex: 1,
                                                                mr: 1,
                                                                color: '#111827'
                                                            }} 
                                                            noWrap
                                                        >
                                                            {consultation.purpose || ""}
                                                        </Typography>
                                                        <Button
                                                            size="small"
                                                            startIcon={<Edit />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditClick(consultation);
                                                            }}
                                                            sx={{ 
                                                                color: '#007ea7',
                                                                '&:hover': {
                                                                    backgroundColor: 'rgba(0, 126, 167, 0.08)',
                                                                    color: '#003459'
                                                                }
                                                            }}
                                                        >
                                                            수정
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            ))
                                        ) : (
                                            <Box sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'center', 
                                                alignItems: 'center', 
                                                height: '100%',
                                                color: 'text.secondary'
                                            }}>
                                                <Typography variant="body2">상담 내역이 없습니다.</Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    {/* 페이지네이션 컨트롤 */}
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1, pt: 2, borderTop: '1px solid', borderColor: '#e5e7eb' }}>
                                        <Button
                                            size="small"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 0}
                                            startIcon={<ChevronLeft />}
                                            sx={{ color: '#007ea7' }}
                                        >
                                            이전
                                        </Button>
                                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                            {currentPage + 1} / {consultationHistory.consultations.totalPages}
                                        </Typography>
                                        <Button
                                            size="small"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage >= consultationHistory.consultations.totalPages - 1}
                                            endIcon={<ChevronRight />}
                                            sx={{ color: '#007ea7' }}
                                        >
                                            다음
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Typography variant="h6" sx={{ fontWeight: "bold", mr: 2, color: '#111827' }}>
                                                상담 상세 정보
                                            </Typography>
                                            {selectedConsultation && (
                                                <Chip
                                                    label={statusConfig[selectedConsultation.consultationStatus]?.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: statusConfig[selectedConsultation.consultationStatus]?.color,
                                                        color: statusConfig[selectedConsultation.consultationStatus]?.textColor,
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        
                                                        // Close any other open menu
                                                        if (openStatusMenuId !== null) {
                                                            const existingMenu = document.getElementById(`status-menu-${openStatusMenuId}`);
                                                            if (existingMenu) {
                                                                document.body.removeChild(existingMenu);
                                                            }
                                                        }
                                                        
                                                        // Set this menu as the open one
                                                        setOpenStatusMenuId(selectedConsultation.consultationId);
                                                        
                                                        // Create a container for the menu that will be positioned relative to the viewport
                                                        const menuContainer = document.createElement('div');
                                                        menuContainer.id = `status-menu-${selectedConsultation.consultationId}`;
                                                        menuContainer.style.position = 'fixed';
                                                        menuContainer.style.zIndex = '1000';
                                                        
                                                        // Get the position of the chip relative to the viewport
                                                        const chipRect = e.currentTarget.getBoundingClientRect();
                                                        
                                                        // Position the menu below the chip
                                                        menuContainer.style.top = `${chipRect.bottom}px`;
                                                        menuContainer.style.left = `${chipRect.left}px`;
                                                        
                                                        // Create the menu content
                                                        const menu = document.createElement('div');
                                                        menu.style.backgroundColor = 'white';
                                                        menu.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                        menu.style.borderRadius = '4px';
                                                        menu.style.padding = '4px';
                                                        
                                                        Object.values(ConsultationStatus).forEach((status) => {
                                                            if (status !== selectedConsultation.consultationStatus) {
                                                                const option = document.createElement('div');
                                                                option.style.padding = '8px 16px';
                                                                option.style.cursor = 'pointer';
                                                                option.style.color = statusConfig[status]?.textColor;
                                                                option.style.backgroundColor = statusConfig[status]?.color;
                                                                option.style.borderRadius = '4px';
                                                                option.style.marginBottom = '4px';
                                                                option.textContent = statusConfig[status]?.label;
                                                                option.onclick = (e) => {
                                                                    e.stopPropagation();
                                                                    handleStatusChange(selectedConsultation.consultationId, status);
                                                                    document.body.removeChild(menuContainer);
                                                                    setOpenStatusMenuId(null);
                                                                };
                                                                menu.appendChild(option);
                                                            }
                                                        });
                                                        
                                                        menuContainer.appendChild(menu);
                                                        document.body.appendChild(menuContainer);
                                                        
                                                        const closeMenu = (e: MouseEvent) => {
                                                            if (!menuContainer.contains(e.target as Node)) {
                                                                document.body.removeChild(menuContainer);
                                                                document.removeEventListener('click', closeMenu);
                                                                setOpenStatusMenuId(null);
                                                            }
                                                        };
                                                        
                                                        setTimeout(() => {
                                                            document.addEventListener('click', closeMenu);
                                                        }, 0);
                                                    }}
                                                />
                                            )}
                                        </Box>
                                        <Box>
                                            <Button
                                                variant="contained"
                                                startIcon={<Edit />}
                                                onClick={() => handleEditClick(selectedConsultation!)}
                                                sx={{ 
                                                    mr: 1,
                                                    bgcolor: '#007ea7',
                                                    '&:hover': {
                                                        bgcolor: '#003459'
                                                    }
                                                }}
                                            >
                                                수정
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                startIcon={<ArrowBack />}
                                                onClick={handleBackToHistory}
                                                sx={{ 
                                                    borderColor: '#007ea7',
                                                    color: '#007ea7',
                                                    '&:hover': {
                                                        borderColor: '#003459',
                                                        color: '#003459',
                                                        bgcolor: '#f8f9fa'
                                                    }
                                                }}
                                            >
                                                히스토리로 돌아가기
                                            </Button>
                                        </Box>
                                    </Box>
                                    
                                    {selectedConsultation && (
                                        <Box sx={{ 
                                            flexGrow: 1, 
                                            overflow: 'auto',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            <Grid container spacing={2} sx={{ height: '100%' }}>
                                                <Grid item xs={12}>
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12} sm={6}>
                                                            <Typography variant="subtitle1" gutterBottom sx={{ color: '#374151', fontWeight: 'medium' }}>
                                                                상담 일시
                                                            </Typography>
                                                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9fafb' }}>
                                                                <Typography variant="body1" sx={{ color: '#111827' }}>
                                                                    {selectedConsultation.date}
                                                                </Typography>
                                                            </Paper>
                                                        </Grid>
                                                        <Grid item xs={12} sm={6}>
                                                            <Typography variant="subtitle1" gutterBottom sx={{ color: '#374151', fontWeight: 'medium' }}>
                                                                상담 목적
                                                            </Typography>
                                                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9fafb' }}>
                                                                <Typography variant="body1" sx={{ color: '#111827' }}>
                                                                    {selectedConsultation.purpose || "없음"}
                                                                </Typography>
                                                            </Paper>
                                                        </Grid>
                                                    </Grid>
                                                </Grid>
                                                <Grid item xs={12} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', mt: 0 }}>
                                                    <Typography variant="subtitle1" gutterBottom sx={{ color: '#374151', fontWeight: 'medium' }}>
                                                        메모
                                                    </Typography>
                                                    <Paper variant="outlined" sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: '400px', bgcolor: '#f9fafb' }}>
                                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', flexGrow: 1, color: '#111827' }}>
                                                            {selectedConsultation.memo || "메모 없음"}
                                                        </Typography>
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* 우측: 상담 상세 정보 & 수정 폼 */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', minHeight: '600px', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: "bold", color: '#111827' }}>
                                    {isNewConsultation ? "새 상담 등록" : "상담 수정"}
                                </Typography>
                                <Box>
                                    <Button
                                        variant="contained"
                                        startIcon={<Save />}
                                        onClick={handleSave}
                                        sx={{ 
                                            mr: 1,
                                            bgcolor: '#007ea7',
                                            '&:hover': {
                                                bgcolor: '#003459'
                                            }
                                        }}
                                        disabled={isLoadingConsultation}
                                    >
                                        저장
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={handleNewConsultation}
                                        sx={{ 
                                            borderColor: '#007ea7',
                                            color: '#007ea7',
                                            '&:hover': {
                                                borderColor: '#003459',
                                                color: '#003459',
                                                bgcolor: '#f8f9fa'
                                            }
                                        }}
                                        disabled={isLoadingConsultation}
                                    >
                                        새 상담
                                    </Button>
                                </Box>
                            </Box>

                            {isLoadingConsultation ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Grid container spacing={2} sx={{ height: '100%' }}>
                                        <Grid item xs={12}>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="subtitle1" gutterBottom sx={{ color: '#374151', fontWeight: 'medium' }}>
                                                        상담 일시
                                                    </Typography>
                                                    <TextField
                                                        fullWidth
                                                        name="date"
                                                        type="datetime-local"
                                                        value={editFormData.date || ""}
                                                        onChange={handleEditChange}
                                                        InputLabelProps={{ shrink: true }}
                                                        disabled={!isNewConsultation}
                                                        variant="outlined"
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                '& fieldset': {
                                                                    borderColor: '#d1d5db',
                                                                },
                                                                '&:hover fieldset': {
                                                                    borderColor: '#9ca3af',
                                                                },
                                                                '&.Mui-focused fieldset': {
                                                                    borderColor: '#007ea7',
                                                                },
                                                            },
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Typography variant="subtitle1" gutterBottom sx={{ color: '#374151', fontWeight: 'medium' }}>
                                                        상담 목적
                                                    </Typography>
                                                    <TextField
                                                        fullWidth
                                                        name="purpose"
                                                        value={editFormData.purpose || ""}
                                                        onChange={handleEditChange}
                                                        required
                                                        error={!editFormData.purpose}
                                                        helperText={!editFormData.purpose ? "상담 목적을 입력해주세요" : ""}
                                                        variant="outlined"
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                '& fieldset': {
                                                                    borderColor: '#d1d5db',
                                                                },
                                                                '&:hover fieldset': {
                                                                    borderColor: '#9ca3af',
                                                                },
                                                                '&.Mui-focused fieldset': {
                                                                    borderColor: '#007ea7',
                                                                },
                                                            },
                                                        }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={12} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', mt: 0 }}>
                                            <Typography variant="subtitle1" gutterBottom sx={{ color: '#374151', fontWeight: 'medium' }}>
                                                메모
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                name="memo"
                                                value={editFormData.memo || ""}
                                                onChange={handleEditChange}
                                                multiline
                                                rows={20}
                                                variant="outlined"
                                                placeholder="상담 내용을 입력하세요..."
                                                sx={{
                                                    '& .MuiInputBase-root': {
                                                        height: '100%',
                                                        minHeight: '400px',
                                                    },
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: '#d1d5db',
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: '#9ca3af',
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: '#007ea7',
                                                        },
                                                    },
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            {/* 알림 스낵바 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert 
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
                    severity={snackbar.severity}
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* 확인 대화상자 */}
            <Dialog
                open={confirmDialogOpen}
                onClose={() => handleConfirmDialogClose(false)}
            >
                <DialogTitle>작성 중인 내용이 있습니다</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        작성 중인 내용이 있습니다. 계속하면 작성 중인 내용이 사라집니다. 계속하시겠습니까?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleConfirmDialogClose(false)}>취소</Button>
                    <Button onClick={() => handleConfirmDialogClose(true)} color="primary" autoFocus>
                        계속
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 새 상담 확인 대화상자 */}
            <Dialog
                open={confirmNewConsultationDialogOpen}
                onClose={() => handleConfirmNewConsultationDialogClose(false)}
            >
                <DialogTitle>작성 중인 내용이 있습니다</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        작성 중인 내용이 있습니다. 계속하면 작성 중인 내용이 사라집니다. 계속하시겠습니까?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleConfirmNewConsultationDialogClose(false)}>취소</Button>
                    <Button onClick={() => handleConfirmNewConsultationDialogClose(true)} color="primary" autoFocus>
                        계속
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}

export default ConsultationDetail
