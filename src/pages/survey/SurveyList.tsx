"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    AppBar,
    Toolbar,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    CircularProgress,
    Snackbar,
    Alert,
    TextField,
    InputAdornment,
} from "@mui/material"
import { Add, Edit, Delete, ArrowBack, Search } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { getAllSurveys, deleteSurvey } from "../../services/surveyApi"
import type { SurveyResponse } from "../../types/survey"

const SurveyList = () => {
    const navigate = useNavigate()
    const [surveys, setSurveys] = useState<SurveyResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [surveyToDelete, setSurveyToDelete] = useState<number | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchSurveys()
    }, [])

    const fetchSurveys = async () => {
        try {
            setLoading(true)
            const response = await getAllSurveys()
            if (response.data.success && response.data.data) {
                setSurveys(response.data.data)
            } else {
                setError("설문 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching surveys:", err)
            setError("설문 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClick = (event: React.MouseEvent, surveyId: number) => {
        event.stopPropagation()
        setSurveyToDelete(surveyId)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (surveyToDelete === null) return

        try {
            setDeleteLoading(true)
            const response = await deleteSurvey(surveyToDelete)

            if (response.data.success) {
                setSuccessMessage("설문이 성공적으로 삭제되었습니다.")
                // 목록에서 삭제된 설문 제거
                setSurveys(surveys.filter((survey) => survey.id !== surveyToDelete))
            } else {
                setError("설문 삭제에 실패했습니다.")
            }
        } catch (err) {
            console.error("Error deleting survey:", err)
            setError("설문 삭제에 실패했습니다.")
        } finally {
            setDeleteLoading(false)
            setDeleteDialogOpen(false)
            setSurveyToDelete(null)
        }
    }

    const handleCreateSurvey = () => {
        navigate("/survey/create")
    }

    const handleViewSurvey = (surveyId: number) => {
        navigate(`/survey/${surveyId}`)
    }

    const handleEditSurvey = (event: React.MouseEvent, surveyId: number) => {
        event.stopPropagation()
        navigate(`/survey/edit/${surveyId}`)
    }

    // 검색어로 필터링
    const filteredSurveys = surveys.filter((survey) => survey.title.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        설문 관리
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton onClick={() => navigate("/dashboard")} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            설문 관리
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        sx={{
                            bgcolor: "#000",
                            "&:hover": { bgcolor: "#333" },
                        }}
                        onClick={handleCreateSurvey}
                    >
                        새 설문 만들기
                    </Button>
                </Box>

                <Paper elevation={0} sx={{ mb: 3, p: 2 }}>
                    <TextField
                        placeholder="설문 제목으로 검색"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Paper>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
                        <Typography color="error">{error}</Typography>
                        <Button variant="contained" sx={{ mt: 2 }} onClick={fetchSurveys}>
                            다시 시도
                        </Button>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: "#f9f9f9" }}>
                                    <TableCell>제목</TableCell>
                                    <TableCell>설명</TableCell>
                                    <TableCell>질문 수</TableCell>
                                    <TableCell align="right">작업</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredSurveys.length > 0 ? (
                                    filteredSurveys.map((survey) => (
                                        <TableRow
                                            key={survey.id}
                                            hover
                                            onClick={() => handleViewSurvey(survey.id)}
                                            sx={{ cursor: "pointer" }}
                                        >
                                            <TableCell>{survey.title}</TableCell>
                                            <TableCell>{survey.description}</TableCell>
                                            <TableCell>{survey.questionList.length}</TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={(e) => handleEditSurvey(e, survey.id)} sx={{ mr: 1 }}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={(e) => handleDeleteClick(e, survey.id)}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1">
                                                {searchTerm ? "검색 결과가 없습니다." : "등록된 설문이 없습니다."}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>

            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>설문 삭제</DialogTitle>
                <DialogContent>
                    <DialogContentText>이 설문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
                        취소
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" disabled={deleteLoading}>
                        {deleteLoading ? <CircularProgress size={24} /> : "삭제"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 성공 메시지 스낵바 */}
            <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage(null)}>
                <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: "100%" }}>
                    {successMessage}
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

export default SurveyList

