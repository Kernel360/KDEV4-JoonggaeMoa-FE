"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Button,
    AppBar,
    Toolbar,
    IconButton,
    Chip,
    Divider,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert,
    MenuItem,
    Menu,
} from "@mui/material"
import { ArrowBack, Edit, Delete } from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { consultationApi } from "../services/consultationApi"
import { ConsultationStatus, ConsultationType } from "../types/consultation"

// 상담 상태별 칩 색상 및 텍스트 - 새로운 상태 값에 맞게 업데이트
const statusConfig = {
    [ConsultationStatus.WAITING]: { color: "#e3f2fd", textColor: "#1976d2", label: "예약 대기" },
    [ConsultationStatus.CONFIRMED]: { color: "#fff8e1", textColor: "#f57c00", label: "예약 확정" },
    [ConsultationStatus.COMPLETED]: { color: "#e8f5e9", textColor: "#2e7d32", label: "진행 완료" },
    [ConsultationStatus.CANCELED]: { color: "#ffebee", textColor: "#c62828", label: "예약 취소" },
}

// 상담 유형별 텍스트
const typeConfig = {
    [ConsultationType.VISIT]: "방문 상담",
    [ConsultationType.CALL]: "전화 상담",
    [ConsultationType.VIDEO]: "화상 상담",
}

// ConsultationResponse 타입 정의
interface ConsultationResponse {
    consultationId: number
    customerId: number
    customerName: string
    customerPhone: string
    consultationType: ConsultationType
    date: string
    memo: string
    consultationStatus: ConsultationStatus
    interestProperty: string
    assetStatus: string
    result: string
    nextAction: string
}

const ConsultationDetail = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [consultation, setConsultation] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // 상담 삭제 관련 상태  = useState(false)

    // 상담 삭제 관련 상태
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteSuccess, setDeleteSuccess] = useState(false)

    // 상태 변경 관련 상태
    const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null)
    const [statusLoading, setStatusLoading] = useState(false)
    const [statusSuccess, setStatusSuccess] = useState(false)

    useEffect(() => {
        if (id) {
            fetchConsultationDetails(Number.parseInt(id))
        }
    }, [id])

    // fetchConsultationDetails 함수를 수정하여 서버 응답 데이터를 적절히 변환합니다
    const fetchConsultationDetails = async (consultationId: number) => {
        try {
            setLoading(true)
            const response = await consultationApi.getConsultationById(consultationId)

            console.log("API 응답 데이터:", response.data)

            if (response.data.success && response.data.data) {
                const item = response.data.data as ConsultationResponse
                console.log("상담 상세 데이터:", item)

                // 백엔드 응답 구조에 맞게 데이터 매핑
                const formattedConsultation = {
                    id: item.consultationId,
                    customer: {
                        id: item.customerId,
                        name: item.customerName,
                        phone: item.customerPhone,
                        email: "",
                    },
                    consultationType: item.consultationType || ConsultationType.VISIT,
                    scheduledAt: item.date,
                    memo: item.memo || "",
                    status: item.consultationStatus as ConsultationStatus,
                    propertyInterest: item.interestProperty || "",
                    budget: item.assetStatus || "",
                    result: item.result || "",
                    nextAction: item.nextAction || "",
                    createdAt: item.date,
                    updatedAt: item.date,
                }

                console.log("변환된 상담 데이터:", formattedConsultation)
                setConsultation(formattedConsultation)
            } else {
                console.error("API 응답 오류:", response.data.error)
                setError("상담 정보를 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("상담 상세 정보 조회 오류:", err)
            setError("상담 정보를 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 상담 삭제 다이얼로그 열기
    const handleDeleteDialogOpen = () => {
        setDeleteDialogOpen(true)
    }

    // 상담 삭제 다이얼로그 닫기
    const handleDeleteDialogClose = () => {
        setDeleteDialogOpen(false)
    }

    // 상담 삭제 처리
    const handleDeleteConfirm = async () => {
        if (!id) return

        try {
            setDeleteLoading(true)

            const response = await consultationApi.deleteConsultation(Number.parseInt(id))

            if (response.data.success) {
                setDeleteSuccess(true)

                // 삭제 성공 후 목록 페이지로 이동
                setTimeout(() => {
                    navigate("/consultation")
                }, 1500)
            } else {
                setError(response.data.error?.message || "상담 삭제에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error deleting consultation:", err)
            setError(err.response?.data?.error?.message || "상담 삭제에 실패했습니다.")
        } finally {
            setDeleteLoading(false)
            handleDeleteDialogClose()
        }
    }

    // 상태 변경 메뉴 열기
    const handleStatusMenuOpen = (event: React.MouseEvent<HTMLDivElement>) => {
        event.stopPropagation()
        setStatusAnchorEl(event.currentTarget)
    }

    // 상태 변경 메뉴 닫기
    const handleStatusMenuClose = () => {
        setStatusAnchorEl(null)
    }

    // 상담 상태 변경 처리
    const handleStatusChange = async (newStatus: ConsultationStatus) => {
        if (!id) return

        try {
            setStatusLoading(true)

            const response = await consultationApi.updateConsultationStatus(Number.parseInt(id), newStatus)

            if (response.data.success) {
                setStatusSuccess(true)
                handleStatusMenuClose()

                // 상담 정보 다시 불러오기
                fetchConsultationDetails(Number.parseInt(id))
            } else {
                setError(response.data.error?.message || "상담 상태 변경에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error updating consultation status:", err)
            setError(err.response?.data?.error?.message || "상담 상태 변경에 실패했습니다.")
        } finally {
            setStatusLoading(false)
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error || !consultation) {
        return (
            <Container maxWidth="md">
                <Box sx={{ mt: 5, textAlign: "center" }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        {error || "상담 정보를 찾을 수 없습니다."}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate("/consultation")} sx={{ mt: 2 }}>
                        상담 목록으로 돌아가기
                    </Button>
                </Box>
            </Container>
        )
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        상담 상세 정보
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={0} sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                        <IconButton onClick={() => navigate("/consultation")} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            상담 정보
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button
                            startIcon={<Edit />}
                            sx={{ mr: 1, color: "#555" }}
                            onClick={() => navigate(`/consultation/edit/${id}`)}
                        >
                            수정
                        </Button>
                        <Button startIcon={<Delete />} color="error" onClick={handleDeleteDialogOpen}>
                            삭제
                        </Button>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary">
                                상태
                            </Typography>
                            <Box sx={{ mt: 1, mb: 2 }}>
                                <Chip
                                    label={statusConfig[consultation.status].label}
                                    sx={{
                                        bgcolor: statusConfig[consultation.status].color,
                                        color: statusConfig[consultation.status].textColor,
                                        fontWeight: "bold",
                                        cursor: "pointer",
                                    }}
                                    onClick={(e) => handleStatusMenuOpen(e)}
                                />
                                {/* 상태 변경 메뉴 */}
                                <Menu
                                    anchorEl={statusAnchorEl}
                                    open={Boolean(statusAnchorEl)}
                                    onClose={handleStatusMenuClose}
                                    anchorOrigin={{
                                        vertical: "bottom",
                                        horizontal: "right",
                                    }}
                                    transformOrigin={{
                                        vertical: "top",
                                        horizontal: "right",
                                    }}
                                >
                                    <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: "bold" }}>
                                        상담 상태 변경
                                    </Typography>
                                    <Divider />
                                    {Object.values(ConsultationStatus).map((status) => (
                                        <MenuItem key={status} onClick={() => handleStatusChange(status)} disabled={statusLoading}>
                                            <Chip
                                                label={statusConfig[status]?.label}
                                                size="small"
                                                sx={{
                                                    bgcolor: statusConfig[status]?.color,
                                                    color: statusConfig[status]?.textColor,
                                                    width: "100%",
                                                    justifyContent: "center",
                                                }}
                                            />
                                        </MenuItem>
                                    ))}
                                </Menu>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                고객명
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2, fontWeight: "medium" }}>
                                {consultation.customer.name}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                연락처
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {consultation.customer.phone}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                이메일
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {consultation.customer.email || "-"}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                상담 유형
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {typeConfig[consultation.consultationType]}
                            </Typography>
                        </Grid>

                        {/* Grid item xs={12} sm={6}의 상담 일시 부분을 다음과 같이 수정합니다 */}
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                상담 일시
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {consultation.scheduledAt
                                    ? (() => {
                                        try {
                                            return new Date(consultation.scheduledAt).toLocaleString("ko-KR", {
                                                year: "numeric",
                                                month: "2-digit",
                                                day: "2-digit",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })
                                        } catch (e) {
                                            console.error("날짜 변환 오류:", e)
                                            return consultation.scheduledAt
                                        }
                                    })()
                                    : "날짜 정보 없음"}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                관심 매물
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {consultation.propertyInterest || "-"}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                예산
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {consultation.budget || "-"}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" color="textSecondary">
                                메모
                            </Typography>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    mt: 1,
                                    mb: 3,
                                    bgcolor: "#f9f9f9",
                                    minHeight: "80px",
                                    borderRadius: 1,
                                }}
                            >
                                <Typography variant="body2">{consultation.memo || "메모가 없습니다."}</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>

            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
                <DialogTitle>상담 삭제</DialogTitle>
                <DialogContent>
                    <DialogContentText>이 상담 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteDialogClose} disabled={deleteLoading}>
                        취소
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" disabled={deleteLoading}>
                        {deleteLoading ? <CircularProgress size={24} /> : "삭제"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 상태 변경 성공 메시지 */}
            <Snackbar open={statusSuccess} autoHideDuration={6000} onClose={() => setStatusSuccess(false)}>
                <Alert onClose={() => setStatusSuccess(false)} severity="success" sx={{ width: "100%" }}>
                    상담 상태가 성공적으로 변경되었습니다.
                </Alert>
            </Snackbar>

            {/* 삭제 성공 메시지 스낵바 */}
            <Snackbar open={deleteSuccess} autoHideDuration={6000} onClose={() => setDeleteSuccess(false)}>
                <Alert onClose={() => setDeleteSuccess(false)} severity="success" sx={{ width: "100%" }}>
                    상담이 성공적으로 삭제되었습니다. 상담 목록 페이지로 이동합니다.
                </Alert>
            </Snackbar>

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
        </Box>
    )
}

export default ConsultationDetail

