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
import { ArrowBack, Edit, Delete } from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { getCustomerById, deleteCustomer, type CustomerResponse } from "../../services/customerApi"

const CustomerDetail = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [customer, setCustomer] = useState<CustomerResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteSuccess, setDeleteSuccess] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    useEffect(() => {
        if (id) {
            fetchCustomerDetails(Number.parseInt(id))
        }
    }, [id])

    const fetchCustomerDetails = async (customerId: number) => {
        try {
            setLoading(true)
            const response = await getCustomerById(customerId)

            if (response.data.success && response.data.data) {
                setCustomer(response.data.data)
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

            const response = await deleteCustomer(Number.parseInt(id))

            if (response.data.success) {
                setDeleteSuccess(true)
                handleDeleteClose()

                // Redirect after successful deletion
                setTimeout(() => {
                    navigate("/customer-management")
                }, 1500)
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
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        고객 관리
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={0} sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                        <IconButton onClick={() => navigate("/customer-management")} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            고객 상세 정보
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button
                            startIcon={<Edit />}
                            sx={{ mr: 1, color: "#555" }}
                            onClick={() => navigate(`/customer-management/edit/${id}`)}
                        >
                            수정
                        </Button>
                        <Button startIcon={<Delete />} color="error" onClick={handleDeleteClick}>
                            삭제
                        </Button>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                이름
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {customer.name}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                상태
                            </Typography>
                            <Box sx={{ mt: 1, mb: 2 }}>
                                <Chip
                                    label={customer.isVip ? "VIP" : "일반"}
                                    color={customer.isVip ? "success" : "default"}
                                    size="small"
                                    sx={{
                                        bgcolor: customer.isVip ? "#e8f5e9" : "#f5f5f5",
                                        color: customer.isVip ? "#2e7d32" : "#757575",
                                        border: "none",
                                    }}
                                />
                            </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                연락처
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {customer.phone}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                이메일
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {customer.email || "-"}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                생년월일
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {customer.birthday || "-"}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                직업
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {customer.job || "-"}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                마케팅 동의
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {customer.consent ? "동의함" : "동의하지 않음"}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                등록일
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {new Date(customer.createdAt).toLocaleDateString()}
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
                                    bgcolor: "#f9f9f9",
                                    minHeight: "100px",
                                    borderRadius: 1,
                                }}
                            >
                                <Typography variant="body2">{customer.memo || "메모가 없습니다."}</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={handleDeleteClose}>
                <DialogTitle>고객 삭제</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {customer.name} 고객의 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteClose} disabled={deleteLoading}>
                        취소
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        disabled={deleteLoading}
                        startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
                    >
                        {deleteLoading ? "삭제 중..." : "삭제"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Success Snackbar */}
            <Snackbar open={deleteSuccess} autoHideDuration={6000} onClose={() => setDeleteSuccess(false)}>
                <Alert onClose={() => setDeleteSuccess(false)} severity="success" sx={{ width: "100%" }}>
                    고객이 성공적으로 삭제되었습니다. 고객 목록 페이지로 이동합니다.
                </Alert>
            </Snackbar>

            {/* Error Snackbar */}
            <Snackbar open={!!deleteError} autoHideDuration={6000} onClose={() => setDeleteError(null)}>
                <Alert onClose={() => setDeleteError(null)} severity="error" sx={{ width: "100%" }}>
                    {deleteError}
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

export default CustomerDetail

