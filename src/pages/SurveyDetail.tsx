import React, {useEffect, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControlLabel,
    FormGroup,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Radio,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material"
import {ArrowBack, ContentCopy, Delete, Edit} from "@mui/icons-material"
import {useNavigate, useParams} from "react-router-dom"
import {useAuth} from '../context/AuthContext'
import api from '../services/api'
import {SurveyDetailResponse} from '../types/survey'

const SurveyDetail: React.FC = () => {
    const navigate = useNavigate()
    const {id} = useParams<{ id: string }>()
    const {isAuthenticated} = useAuth()
    const [survey, setSurvey] = useState<SurveyDetailResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [editMode, setEditMode] = useState(false)
    const [editedSurvey, setEditedSurvey] = useState({
        title: '',
        description: '',
    })

    // Add copyUrlSuccess state
    const [copyUrlSuccess, setCopyUrlSuccess] = useState(false)

    const fetchSurvey = async () => {
        try {
            setLoading(true)
            const response = await api.get(`/api/surveys/${id}`)
            if (response.data.success) {
                setSurvey(response.data.data)
                setEditedSurvey({
                    title: response.data.data.title,
                    description: response.data.data.description,
                })
            }
        } catch (err) {
            setError('설문 정보를 불러오는데 실패했습니다.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSurvey()
    }, [id])

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        try {
            setDeleteLoading(true)
            const response = await api.delete(`/api/surveys/${id}`)

            if (response.data.success) {
                setSuccessMessage('설문이 성공적으로 삭제되었습니다.')
                navigate('/survey')
            } else {
                setError('설문 삭제에 실패했습니다.')
            }
        } catch (err) {
            setError('설문 삭제에 실패했습니다.')
        } finally {
            setDeleteLoading(false)
            setDeleteDialogOpen(false)
        }
    }

    const handleSaveClick = async () => {
        try {
            const response = await api.put(`/api/surveys/${id}`, editedSurvey)
            if (response.data.success) {
                setSurvey(response.data.data)
                setEditMode(false)
                setSuccessMessage('설문이 성공적으로 수정되었습니다.')
            }
        } catch (err) {
            setError('설문 수정에 실패했습니다.')
        }
    }

    const handleCancelClick = () => {
        setEditMode(false)
        setEditedSurvey({
            title: survey?.title || '',
            description: survey?.description || '',
        })
    }

    // http, https 구분
    const handleCopyUrl = () => {
        if (!id) return

        const surveyUrl = `${window.location.origin}/surveys/submit/${id}`

        if (navigator.clipboard && window.isSecureContext) {
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

    const copy = (textToCopy: string) => {
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

    // 질문 타입에 따른 UI 렌더링
    const renderQuestionOptions = (question: SurveyDetailResponse["questions"][0]) => {
        switch (question.type) {
            case "SINGLE_CHOICE":
                return (
                    <FormGroup>
                        {question.options.map((option, optionIndex) => (
                            <FormControlLabel
                                key={optionIndex}
                                control={<Radio disabled/>}
                                label={option}
                            />
                        ))}
                    </FormGroup>
                );
            case "MULTIPLE_CHOICE":
                return (
                    <FormGroup>
                        {question.options.map((option, optionIndex) => (
                            <FormControlLabel
                                key={optionIndex}
                                control={<Checkbox disabled/>}
                                label={option}
                            />
                        ))}
                    </FormGroup>
                );
            case "TEXT":
                return <TextField fullWidth disabled/>;
            default:
                return null;
        }
    };

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

    if (loading) {
        return (
            <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
                <CircularProgress/>
            </Box>
        )
    }

    if (error || !survey) {
        return (
            <Container>
                <Box sx={{mt: 5, textAlign: "center"}}>
                    <Typography variant="h6" color="error" gutterBottom>
                        {error || "설문을 찾을 수 없습니다."}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate("/survey")} sx={{mt: 2}}>
                        설문 목록으로 돌아가기
                    </Button>
                </Box>
            </Container>
        )
    }

    return (
        <Box sx={{flexGrow: 1, minHeight: "100vh"}}>
            <Container maxWidth="md" sx={{mt: 4, mb: 4, boxShadow: 3}}>
                <Paper elevation={0} sx={{p: 4}}>
                    <Box sx={{display: "flex", alignItems: "center", mb: 4}}>
                        <IconButton onClick={() => navigate("/survey")} sx={{mr: 1}}>
                            <ArrowBack/>
                        </IconButton>
                        <Typography variant="h6" sx={{fontWeight: "bold"}}>
                            설문 상세 정보
                        </Typography>
                        <Box sx={{flexGrow: 1}}/>
                        {isAuthenticated && (
                            <Box sx={{display: 'flex', gap: 2}}>
                                {!editMode ? (
                                    <>
                                        <Button
                                            variant="outlined"
                                            startIcon={<Edit/>}
                                            onClick={() => navigate(`/survey/edit/${id}`)}
                                            sx={{
                                                borderColor: '#007ea7',
                                                color: '#007ea7',
                                                '&:hover': {
                                                    borderColor: '#003459',
                                                    backgroundColor: 'rgba(0, 126, 167, 0.04)'
                                                }
                                            }}
                                        >
                                            수정
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            startIcon={<Delete/>}
                                            onClick={handleDeleteClick}
                                            sx={{
                                                borderColor: '#dc3545',
                                                color: '#dc3545',
                                                '&:hover': {
                                                    borderColor: '#dc3545',
                                                    backgroundColor: 'rgba(220, 53, 69, 0.04)'
                                                }
                                            }}
                                        >
                                            삭제
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outlined"
                                            onClick={handleCancelClick}
                                            sx={{
                                                borderColor: '#6c757d',
                                                color: '#6c757d',
                                                '&:hover': {
                                                    borderColor: '#495057',
                                                    backgroundColor: 'rgba(108, 117, 125, 0.04)'
                                                }
                                            }}
                                        >
                                            취소
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleSaveClick}
                                            sx={{
                                                bgcolor: '#007ea7',
                                                '&:hover': {bgcolor: '#003459'}
                                            }}
                                        >
                                            저장
                                        </Button>
                                    </>
                                )}
                            </Box>
                        )}
                    </Box>

                    {/* Add a section to display and copy the survey URL after the survey title and description */}
                    <Grid container spacing={3}>
                        <Grid size={12}>
                            <Typography variant="subtitle2" color="textSecondary">
                                설문 제목
                            </Typography>
                            <Typography variant="h5" sx={{mt: 1, mb: 2, fontWeight: "bold", wordBreak: "break-word"}}>
                                {survey.title}
                            </Typography>
                        </Grid>
                        <Grid size={12}>
                            <Typography variant="subtitle2" color="textSecondary">
                                설문 설명
                            </Typography>
                            <Typography variant="body1"
                                        sx={{mt: 1, mb: 3, whiteSpace: "pre-wrap", wordBreak: "break-word"}}>
                                {survey.description || "설명이 없습니다."}
                            </Typography>
                        </Grid>
                        <Grid size={12}>
                            <Typography variant="subtitle2" color="textSecondary">
                                등록일
                            </Typography>
                            <Typography variant="body1" sx={{mt: 1, mb: 3}}>
                                {formatDate(survey.createdAt)}
                            </Typography>
                        </Grid>

                        {/* Add URL section */}
                        <Grid size={12}>
                            <Typography variant="subtitle2" color="textSecondary">
                                고객용 설문 URL
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mt: 1,
                                    mb: 3,
                                    p: 2,
                                    bgcolor: "#f0f7ff",
                                    borderRadius: 1,
                                    border: "1px solid #e0e0e0",
                                }}
                            >
                                <Typography
                                    variant="body2"
                                    sx={{
                                        flexGrow: 1,
                                        fontFamily: "monospace",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {`${window.location.origin}/surveys/submit/${id}`}
                                </Typography>
                                <Button
                                    startIcon={<ContentCopy/>}
                                    onClick={handleCopyUrl}
                                    size="small"
                                    variant="outlined"
                                    sx={{ml: 2}}
                                >
                                    URL 복사
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>

                    <Divider sx={{my: 3}}/>

                    <Typography variant="h6" sx={{mb: 3}}>
                        질문 목록
                    </Typography>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{backgroundColor: '#e9ecef'}}>
                                    <TableCell>질문</TableCell>
                                    <TableCell>유형</TableCell>
                                    <TableCell>필수 여부</TableCell>
                                    <TableCell>선택지</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {survey.questions.map((question, index) => (
                                    <TableRow key={index}>
                                        <TableCell sx={{
                                            maxWidth: 300,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {question.content}
                                        </TableCell>
                                        <TableCell>
                                            {question.type === 'RADIO' ? '객관식 (단일 선택)' :
                                                question.type === 'CHECKBOX' ? '객관식 (다중 선택)' :
                                                    '주관식'}
                                        </TableCell>
                                        <TableCell>
                                            {question.isRequired ? (
                                                <Chip label="필수" color="primary" size="small"/>
                                            ) : (
                                                <Chip label="선택" variant="outlined" size="small"/>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <List dense>
                                                {question.options.map((option, optionIndex) => (
                                                    <ListItem key={optionIndex} sx={{py: 0.5}}>
                                                        {question.type === 'RADIO' ? (
                                                            <Radio size="small" disabled/>
                                                        ) : (
                                                            <Checkbox size="small" disabled/>
                                                        )}
                                                        <ListItemText primary={option}/>
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Container>
            {/* 삭제 확인 다이얼로그 */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        bgcolor: '#ffffff'
                    }
                }}
            >
                <DialogTitle sx={{
                    borderBottom: '2px solid #dc3545',
                    color: '#dc3545',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    pb: 2
                }}>
                    설문 삭제
                </DialogTitle>
                <DialogContent sx={{mt: 2}}>
                    <Typography>
                        이 설문을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{p: 3, borderTop: '1px solid #e9ecef'}}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        variant="outlined"
                        sx={{
                            borderColor: '#6c757d',
                            color: '#6c757d',
                            '&:hover': {
                                borderColor: '#495057',
                                backgroundColor: 'rgba(108, 117, 125, 0.04)'
                            }
                        }}
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        variant="contained"
                        disabled={deleteLoading}
                        sx={{
                            bgcolor: '#dc3545',
                            '&:hover': {bgcolor: '#c82333'},
                            '&.Mui-disabled': {
                                bgcolor: '#e9ecef',
                                color: '#6c757d'
                            }
                        }}
                    >
                        {deleteLoading ? <CircularProgress size={24}/> : '삭제'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* 성공 메시지 스낵바 */}
            <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage(null)}>
                <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{width: "100%"}}>
                    {successMessage}
                </Alert>
            </Snackbar>
            {/* 에러 메시지 스낵바 */}
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{width: "100%"}}>
                    {error}
                </Alert>
            </Snackbar>
            {/* Add a new Snackbar for the copy URL success message */}
            <Snackbar open={copyUrlSuccess} autoHideDuration={3000} onClose={() => setCopyUrlSuccess(false)}>
                <Alert onClose={() => setCopyUrlSuccess(false)} severity="success" sx={{width: "100%"}}>
                    설문 URL이 클립보드에 복사되었습니다.
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default SurveyDetail


