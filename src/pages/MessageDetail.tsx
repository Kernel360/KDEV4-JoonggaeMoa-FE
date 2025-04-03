"use client"

import { useState, useEffect } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Chip,
    CircularProgress,
    IconButton,
    Divider,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Snackbar,
    Alert,
} from "@mui/material"
import { ArrowBack, Edit, Delete } from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { messageApi, type MessageUpdateRequest } from "../services/messageApi"
import { MessageStatus } from "../types/message"
import type { ReservedMessageResponse } from "../services/messageApi"

const MessageDetail = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [message, setMessage] = useState<ReservedMessageResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // 수정 관련 상태
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editContent, setEditContent] = useState("")
    const [editSendAtDate, setEditSendAtDate] = useState("")
    const [editSendAtTime, setEditSendAtTime] = useState("")
    const [isEditing, setIsEditing] = useState(false)

    // 삭제 관련 상태
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // 알림 상태
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error" | "info" | "warning",
    })

    useEffect(() => {
        if (id) {
            fetchMessageDetail(Number(id))
        }
    }, [id])

    const fetchMessageDetail = async (messageId: number) => {
        try {
            setLoading(true)
            const response = await messageApi.getReservedMessageById((messageId))

            if (response.data.success && response.data.data) {
                const messageData = response.data.data
                setMessage(messageData)
                setEditContent(messageData.content)

                let dateToUse: Date
                if (messageData.sendAt) {
                    dateToUse = new Date(messageData.sendAt)
                } else {
                    dateToUse = new Date()
                    dateToUse.setMinutes(dateToUse.getMinutes() + 10)
                }

                // 날짜와 시간을 input 요소에 맞는 형식으로 변환
                const year = dateToUse.getFullYear()
                const month = String(dateToUse.getMonth() + 1).padStart(2, "0")
                const day = String(dateToUse.getDate()).padStart(2, "0")
                const hours = String(dateToUse.getHours()).padStart(2, "0")
                const minutes = String(dateToUse.getMinutes()).padStart(2, "0")

                setEditSendAtDate(`${year}-${month}-${day}`)
                setEditSendAtTime(`${hours}:${minutes}`)
            } else {
                setError("메시지 정보를 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching message details:", err)
            setError("메시지 정보를 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleEditOpen = () => {
        setEditDialogOpen(true)
    }

    const handleEditClose = () => {
        setEditDialogOpen(false)
    }

    const handleEditSave = async () => {
        if (!id || !message || !editContent.trim() || !editSendAtDate || !editSendAtTime) return

        try {
            setIsEditing(true)

            // 날짜와 시간 문자열을 Date 객체로 변환
            const sendAtDateTime = new Date(`${editSendAtDate}T${editSendAtTime}:00`)

            // ISO 형식의 날짜 문자열로 변환
            const formattedSendAt = sendAtDateTime.toISOString()

            const updateData: MessageUpdateRequest = {
                content: editContent,
                sendAt: formattedSendAt,
            }

            const response = await messageApi.updateMessage(Number(id), updateData)

            if (response.data.success) {
                // 메시지 업데이트 후 상세 정보 다시 불러오기
                await fetchMessageDetail(Number(id))
                setSnackbar({
                    open: true,
                    message: "메시지가 성공적으로 수정되었습니다.",
                    severity: "success",
                })
                setEditDialogOpen(false)
            } else {
                setSnackbar({
                    open: true,
                    message: "메시지 수정에 실패했습니다.",
                    severity: "error",
                })
            }
        } catch (err) {
            console.error("Error updating message:", err)
            setSnackbar({
                open: true,
                message: "메시지 수정 중 오류가 발생했습니다.",
                severity: "error",
            })
        } finally {
            setIsEditing(false)
        }
    }

    const handleDeleteOpen = () => {
        setDeleteDialogOpen(true)
    }

    const handleDeleteClose = () => {
        setDeleteDialogOpen(false)
    }

    const handleDeleteConfirm = async () => {
        if (!id) return

        try {
            setIsDeleting(true)
            const response = await messageApi.deleteMessage(Number(id))

            if (response.data.success) {
                setSnackbar({
                    open: true,
                    message: "메시지가 성공적으로 삭제되었습니다.",
                    severity: "success",
                })
                // 삭제 후 메시지 목록 페이지로 이동
                setTimeout(() => {
                    navigate("/message")
                }, 1000)
            } else {
                setSnackbar({
                    open: true,
                    message: "메시지 삭제에 실패했습니다.",
                    severity: "error",
                })
                setDeleteDialogOpen(false)
            }
        } catch (err) {
            console.error("Error deleting message:", err)
            setSnackbar({
                open: true,
                message: "메시지 삭제 중 오류가 발생했습니다.",
                severity: "error",
            })
            setDeleteDialogOpen(false)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false })
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch (e) {
            return dateString
        }
    }

    const statusConfig = {
        [MessageStatus.SENT]: { color: "#e8f5e9", textColor: "#2e7d32", label: "전송 완료" },
        [MessageStatus.FAILED]: { color: "#ffebee", textColor: "#c62828", label: "전송 실패" },
        [MessageStatus.PENDING]: { color: "#fff8e1", textColor: "#f57c00", label: "전송 대기" },
    }

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error || !message) {
        return (
            <Container maxWidth="md" sx={{ mt: 5, textAlign: "center" }}>
                <Typography variant="h6" color="error" gutterBottom>
                    {error || "메시지를 찾을 수 없습니다."}
                </Typography>
                <Button variant="contained" onClick={() => navigate("/message")} sx={{ mt: 2 }}>
                    메시지 목록으로 돌아가기
                </Button>
            </Container>
        )
    }


    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                    <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: "bold", flexGrow: 1 }}>
                        메시지 상세 정보
                    </Typography>
                        <>
                            <IconButton color="primary" onClick={handleEditOpen} sx={{ mr: 1 }} aria-label="메시지 수정">
                                <Edit />
                            </IconButton>
                            <IconButton color="error" onClick={handleDeleteOpen} aria-label="메시지 삭제">
                                <Delete />
                            </IconButton>
                        </>
                </Box>

                <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
                    <Grid container spacing={3}>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                발송 시간
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {formatDate(message.sendAt)}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                예약 시간
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {message.sendAt ? formatDate(message.sendAt) : "-"}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                고객명
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {message.customerName}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">
                                전화번호
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
                                {message.customerPhone || "-"}
                            </Typography>
                        </Grid>

                        <Grid item xs={12}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="subtitle2" color="textSecondary">
                                메시지 내용
                            </Typography>
                            <Card variant="outlined" sx={{ mt: 1, mb: 2, bgcolor: "#f9f9f9" }}>
                                <CardContent>
                                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                                        {message.content}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>

            {/* 수정 다이얼로그 */}
            <Dialog open={editDialogOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
                <DialogTitle>메시지 수정</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>메시지 내용과 발송 예정 시간을 수정하세요.</DialogContentText>
                    <Box sx={{ display: "flex", gap: 2, mb: 3, mt: 2 }}>
                        <TextField
                            label="날짜"
                            type="date"
                            value={editSendAtDate}
                            onChange={(e) => setEditSendAtDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label="시간"
                            type="time"
                            value={editSendAtTime}
                            onChange={(e) => setEditSendAtTime(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Box>
                    <TextField
                        autoFocus
                        multiline
                        rows={6}
                        fullWidth
                        label="메시지 내용"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        variant="outlined"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditClose} color="inherit">
                        취소
                    </Button>
                    <Button
                        onClick={handleEditSave}
                        color="primary"
                        variant="contained"
                        disabled={isEditing || !editContent.trim() || !editSendAtDate || !editSendAtTime}
                    >
                        {isEditing ? "저장 중..." : "저장"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
                <DialogTitle>메시지 삭제</DialogTitle>
                <DialogContent>
                    <DialogContentText>이 메시지를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteClose} color="inherit">
                        취소
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isDeleting}>
                        {isDeleting ? "삭제 중..." : "삭제"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 알림 스낵바 */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default MessageDetail

