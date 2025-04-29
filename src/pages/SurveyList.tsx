"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
// Add ContentCopy icon import
import { Add, Edit, Delete, ArrowBack, Search, ContentCopy, Assessment } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { surveyApi } from "../services/surveyApi"
import type { SurveyResponse } from "../types/survey"

const SurveyList = () => {
    const navigate = useNavigate()
    const [surveys, setSurveys] = useState<SurveyResponse[]>([])  // Ensure it's initialized as an empty array
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [copyUrlSuccess, setCopyUrlSuccess] = useState(false)
    
    // Add these new states and refs
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadingRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        fetchSurveys()
    }, [])

    useEffect(() => {
        if (loading) return

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    setPage(prev => {
                        const nextPage = prev + 1
                        fetchSurveys(nextPage)
                        return nextPage
                    })
                }
            },
            { threshold: 1.0 }
        )

        observerRef.current = observer

        if (loadingRef.current) {
            observer.observe(loadingRef.current)
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [loading, hasMore, isLoadingMore])

    const fetchSurveys = async (pageNum: number = 0) => {
        try {
            if (pageNum === 0) {
                setLoading(true)
            } else {
                setIsLoadingMore(true)
            }
            
            const response = await surveyApi.getSurveys(Number(pageNum))  // Ensure pageNum is a number
            console.log('Survey response:', response)  // Add this for debugging
            
            if (response.data.success && response.data.data) {
                const newSurveys = response.data.data.content || []
                if (pageNum === 0) {
                    setSurveys(newSurveys)
                } else {
                    setSurveys(prev => [...prev, ...newSurveys])
                }
                setHasMore(!response.data.data.last)
                setError(null)  // Clear any existing error when successful
            } else {
                setError("설문 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching surveys:", err)
            setError("설문 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
            setIsLoadingMore(false)
        }
    }

    const handleDeleteClick = (event: React.MouseEvent, surveyId: string) => {
        event.stopPropagation()
        setSurveyToDelete(surveyId)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (surveyToDelete === null) return

        try {
            setDeleteLoading(true)
            const response = await surveyApi.deleteSurvey(surveyToDelete)

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

    // Add handleCopyUrl function after handleDeleteConfirm
    // URL 형식 수정 - 고객용 URL 경로 변경
    const handleCopyUrl = (event: React.MouseEvent, surveyId: string) => {
        event.stopPropagation()
        const surveyUrl = `${window.location.origin}/surveys/submit/${surveyId}`

        if(navigator.clipboard && window.isSecureContext){
            navigator.clipboard
            .writeText(surveyUrl)
            .then(() => {
                setCopyUrlSuccess(true)
                setTimeout(() => setCopyUrlSuccess(false), 3000)
            })
            .catch((err) => {
                console.error("URL 복사 실패:", err)
                setError("URL을 클립보드에 복사하는데 실패했습니다.")
            })

            return;
        }

        copy(surveyUrl)
    }

    const copy =  (textToCopy : string) => {
        const textArea = document.createElement("textarea");
               textArea.value = textToCopy;
                   
               // Move textarea out of the viewport so it's not visible
               textArea.style.position = "absolute";
               textArea.style.left = "-999999px";
                   
               document.body.prepend(textArea);
               textArea.select();
       
               try {
                   document.execCommand('copy');
                   setCopyUrlSuccess(true)
               } catch (error) {
                   console.error(error);
               } finally {
                   textArea.remove();
               }
       }

    const handleCreateSurvey = () => {
        navigate("/survey/create")
    }

    const handleViewSurvey = (surveyId: string) => {
        navigate(`/survey/${surveyId}`)
    }

    const handleEditSurvey = (event: React.MouseEvent, surveyId: string) => {
        event.stopPropagation()
        navigate(`/survey/edit/${surveyId}`)
    }

    const handleViewAnswers = () => {
        navigate("/survey/answers")
    }

    // 검색어로 필터링
    const filteredSurveys = Array.isArray(surveys) 
        ? surveys.filter((survey) => survey.title.toLowerCase().includes(searchTerm.toLowerCase()))
        : []

    // 날짜 포맷팅 함수
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "-"
        try {
            const date = new Date(dateString)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, "0")
            const day = String(date.getDate()).padStart(2, "0")
            const hours = String(date.getHours()).padStart(2, "0")
            const minutes = String(date.getMinutes()).padStart(2, "0")
            return `${year}-${month}-${day} ${hours}:${minutes}`
        } catch (error) {
            console.error("Error formatting date:", error)
            return dateString
        }
    }

    return (
        <Box sx={{ flexGrow: 1, minHeight: "100vh" }}>
            <Container
                maxWidth="lg"
                sx={{
                    mt: 4,
                    mb: 4,
                    mx: "auto",
                    px: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton onClick={() => navigate("/dashboard")} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            설문 관리
                        </Typography>
                    </Box>
                    <Box>
                        <Button
                            variant="outlined"
                            startIcon={<Assessment />}
                            sx={{ 
                                mr: 2, 
                                borderColor: "#007ea7", 
                                color: "#007ea7",
                                '&:hover': {
                                    borderColor: "#003459",
                                    color: "#003459",
                                    bgcolor: 'rgba(0, 126, 167, 0.08)'
                                }
                            }}
                            onClick={handleViewAnswers}
                        >
                            응답 확인
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            sx={{
                                bgcolor: "#007ea7",
                                "&:hover": { bgcolor: "#003459" },
                            }}
                            onClick={handleCreateSurvey}
                        >
                            새 설문 만들기
                        </Button>
                    </Box>
                </Box>

                <Paper elevation={0} sx={{ mb: 3, p: 3, borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
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
                        <Button 
                            variant="contained" 
                            sx={{ mt: 2 }} 
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.preventDefault();
                                fetchSurveys(0);
                            }}
                        >
                            다시 시도
                        </Button>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, overflow: "hidden", boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ 
                                    backgroundColor: '#e9ecef',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <TableCell sx={{ 
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: '#003459'
                                    }}>제목</TableCell>
                                    <TableCell sx={{ 
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: '#003459'
                                    }}>설명</TableCell>
                                    <TableCell sx={{ 
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: '#003459'
                                    }}>질문 수</TableCell>
                                    <TableCell sx={{ 
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: '#003459'
                                    }}>등록일</TableCell>
                                    <TableCell sx={{ 
                                        padding: '12px 16px',
                                        textAlign: 'right',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: '#003459'
                                    }}></TableCell>
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
                                            <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {survey.title}
                                            </TableCell>
                                            <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {survey.description}
                                            </TableCell>
                                            <TableCell>{survey.questionList.length}</TableCell>
                                            <TableCell>{formatDate(survey.createdAt)}</TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleCopyUrl(e, survey.id)}
                                                    sx={{ mr: 1 }}
                                                    title="고객용 URL 복사"
                                                >
                                                    <ContentCopy fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1">
                                                {searchTerm ? "검색 결과가 없습니다." : "등록된 설문이 없습니다."}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        {hasMore && (
                            <Box ref={loadingRef} sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                {isLoadingMore && <CircularProgress size={24} />}
                            </Box>
                        )}
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

            {/* Add a new Snackbar for the copy URL success message */}
            <Snackbar open={!!copyUrlSuccess} autoHideDuration={3000} onClose={() => setCopyUrlSuccess(false)}>
                <Alert onClose={() => setCopyUrlSuccess(false)} severity="success" sx={{ width: "100%" }}>
                    설문 URL이 클립보드에 복사되었습니다.
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default SurveyList

