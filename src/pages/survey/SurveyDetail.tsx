"use client"

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
    CircularProgress,
    Divider,
    List,
    Radio,
    Checkbox,
    FormControlLabel,
    RadioGroup,
    FormGroup,
    TextField,
    Chip,
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
import { getSurveyById, deleteSurvey } from "../../services/surveyApi"
import type { SurveyResponse } from "../../types/survey"

// Define QuestionType enum
enum QuestionType {
    TEXT = "TEXT",
    RADIO = "RADIO",
    CHECKBOX = "CHECKBOX",
}

const SurveyDetail = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [survey, setSurvey] = useState<SurveyResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // 삭제 관련 상태
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)
    const [deleteSuccess, setDeleteSuccess] = useState(false)

    useEffect(() => {
        if (id) {
            fetchSurveyDetails(Number.parseInt(id))
        }
    }, [id])

    const fetchSurveyDetails = async (surveyId: number) => {
        try {
            setLoading(true)
            const response = await getSurveyById(surveyId)

            if (response.data.success && response.data.data) {
                setSurvey(response.data.data)
            } else {
                setError("설문 정보를 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching survey details:", err)
            setError("설문 정보를 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 삭제 다이얼로그 열기
    const handleDeleteClick = () => {
        setDeleteDialogOpen(true)
    }

    // 삭제 다이얼로그 닫기
    const handleDeleteClose = () => {
        setDeleteDialogOpen(false)
    }

    // 설문 삭제 처리
    const handleDeleteConfirm = async () => {
        if (!id) return

        try {
            setDeleteLoading(true)
            setDeleteError(null)

            const response = await deleteSurvey(Number.parseInt(id))

            if (response.data.success) {
                setDeleteSuccess(true)
                handleDeleteClose()

                // 삭제 성공 후 목록 페이지로 이동
                setTimeout(() => {
                    navigate("/survey")
                }, 1500)
            } else {
                setDeleteError(response.data.error?.message || "설문 삭제에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error deleting survey:", err)
            setDeleteError(err.response?.data?.error?.message || "설문 삭제에 실패했습니다.")
        } finally {
            setDeleteLoading(false)
        }
    }

    // 질문 타입에 따른 UI 렌더링
    const renderQuestionOptions = (question: SurveyResponse["questionList"][0]) => {
        switch (question.type) {
            case QuestionType.RADIO:
                return (
                    <RadioGroup>
                        {question.options.map((option, index) => (
                            <FormControlLabel key={index} value={option} control={<Radio disabled />} label={option} />
                        ))}
                    </RadioGroup>
                )
            case QuestionType.CHECKBOX:
                return (
                    <FormGroup>
                        {question.options.map((option, index) => (
                            <FormControlLabel key={index} control={<Checkbox disabled />} label={option} />
                        ))}
                    </FormGroup>
                )
            case QuestionType.TEXT:
                return <TextField fullWidth variant="outlined" placeholder="텍스트 응답" disabled sx={{ mt: 1 }} />
            default:
                return null
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <CircularProgress />
            </Box>
        )
    }

    if (error || !survey) {
        return (
            <Container>
                <Box sx={{ mt: 5, textAlign: "center" }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        {error || "설문을 찾을 수 없습니다."}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate("/survey")} sx={{ mt: 2 }}>
                        설문 목록으로 돌아가기
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
                        설문 상세 조회
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={0} sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                        <IconButton onClick={() => navigate("/survey")} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            설문 상세 정보
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Button startIcon={<Edit />} sx={{ mr: 1, color: "#555" }} onClick={() => navigate(`/survey/edit/${id}`)}>
                            수정
                        </Button>
                        <Button startIcon={<Delete />} color="error" onClick={handleDeleteClick}>
                            삭제
                        </Button>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary">
                                설문 제목
                            </Typography>
                            <Typography variant="h5" sx={{ mt: 1, mb: 2, fontWeight: "bold" }}>
                                {survey.title}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="textSecondary">
                                설문 설명
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1, mb: 3 }}>
                                {survey.description || "설명이 없습니다."}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" sx={{ mb: 3 }}>
                        질문 목록
                    </Typography>

                    <List>
                        {survey.questionList.map((question, index) => (
                            <Paper
                                key={question.id}
                                elevation={0}
                                sx={{
                                    p: 3,
                                    mb: 3,
                                    bgcolor: "#f9f9f9",
                                    borderRadius: 2,
                                }}
                            >
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                        {index + 1}. {question.content}
                                    </Typography>
                                    {question.isRequired && (
                                        <Chip
                                            label="필수"
                                            size="small"
                                            color="primary"
                                            sx={{ ml: 2, bgcolor: "#e3f2fd", color: "#1976d2" }}
                                        />
                                    )}
                                </Box>
                                <Box sx={{ ml: 2 }}>{renderQuestionOptions(question)}</Box>
                            </Paper>
                        ))}
                    </List>
                </Paper>
            </Container>

            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
                <DialogTitle>설문 삭제</DialogTitle>
                <DialogContent>
                    <DialogContentText>{survey.title} 설문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteClose} disabled={deleteLoading}>
                        취소
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" disabled={deleteLoading}>
                        {deleteLoading ? <CircularProgress size={24} /> : "삭제"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 성공 메시지 스낵바 */}
            <Snackbar open={deleteSuccess} autoHideDuration={6000} onClose={() => setDeleteSuccess(false)}>
                <Alert onClose={() => setDeleteSuccess(false)} severity="success" sx={{ width: "100%" }}>
                    설문이 성공적으로 삭제되었습니다. 설문 목록 페이지로 이동합니다.
                </Alert>
            </Snackbar>

            {/* 에러 메시지 스낵바 */}
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

export default SurveyDetail

