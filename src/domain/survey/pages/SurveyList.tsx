import React, {useEffect, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Pagination,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import {Add, ArrowBack, Assessment, ContentCopy} from "@mui/icons-material";
import {useNavigate} from 'react-router-dom';
import {useAuth} from '@/global/auth/context/AuthContext';
import api from '@/global/api/services/api';
import {SurveyResponse} from '@/domain/survey/types/survey';
import {format} from 'date-fns';
import {ko} from 'date-fns/locale';

const SurveyList: React.FC = () => {
    const navigate = useNavigate();
    const {isAuthenticated} = useAuth();
    const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [surveyToDelete, setSurveyToDelete] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [copyUrlSuccess, setCopyUrlSuccess] = useState(false);
    const [newSurvey, setNewSurvey] = useState({
        title: '',
        description: '',
    });

    const fetchSurveys = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/surveys?page=${page}&size=10&sort=createdAt,desc`);
            if (response.data.success) {
                setSurveys(response.data.data.content);
                setTotalPages(response.data.data.totalPages);
            }
        } catch (err) {
            setError('설문 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSurveys();
    }, [page]);

    const handleDeleteClick = (event: React.MouseEvent, surveyId: string) => {
        event.stopPropagation();
        setSurveyToDelete(surveyId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (surveyToDelete === null) return;

        try {
            setDeleteLoading(true);
            const response = await api.delete(`/api/surveys/${surveyToDelete}`);

            if (response.data.success) {
                setSuccessMessage("설문이 성공적으로 삭제되었습니다.");
                fetchSurveys();
            } else {
                setError("설문 삭제에 실패했습니다.");
            }
        } catch (err) {
            console.error("Error deleting survey:", err);
            setError("설문 삭제에 실패했습니다.");
        } finally {
            setDeleteLoading(false);
            setDeleteDialogOpen(false);
            setSurveyToDelete(null);
        }
    };

    const handleCopyUrl = (event: React.MouseEvent, surveyId: string) => {
        event.stopPropagation();
        const surveyUrl = `${window.location.origin}/surveys/submit/${surveyId}`;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard
                .writeText(surveyUrl)
                .then(() => {
                    setCopyUrlSuccess(true);
                    setTimeout(() => setCopyUrlSuccess(false), 3000);
                })
                .catch((err) => {
                    console.error("URL 복사 실패:", err);
                    setError("URL을 클립보드에 복사하는데 실패했습니다.");
                });

            return;
        }

        copy(surveyUrl);
    };

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
            setCopyUrlSuccess(true);
        } catch (error) {
            console.error(error);
        } finally {
            textArea.remove();
        }
    };

    const handleCreateSurvey = async () => {
        try {
            const response = await api.post('/api/surveys', newSurvey);
            if (response.data.success) {
                setDeleteDialogOpen(false);
                setNewSurvey({title: '', description: ''});
                fetchSurveys();
            }
        } catch (err) {
            setError('설문 생성에 실패했습니다.');
        }
    };

    const handleViewSurvey = (surveyId: string) => {
        navigate(`/survey/${surveyId}`);
    };

    const handleViewAnswers = () => {
        navigate("/survey/answers");
    };

    const filteredSurveys = Array.isArray(surveys)
        ? surveys.filter((survey) => survey.title.toLowerCase().includes(searchTerm.toLowerCase()))
        : [];

    return (
        <Box sx={{flexGrow: 1, minHeight: "100vh"}}>
            <Container
                maxWidth="lg"
                sx={{
                    mt: 4,
                    mb: 4,
                    mx: "auto",
                    px: {xs: 2, sm: 3, md: 4},
                }}
            >
                <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3}}>
                    <Box sx={{display: "flex", alignItems: "center"}}>
                        <IconButton onClick={() => navigate("/dashboard")} sx={{mr: 1}}>
                            <ArrowBack/>
                        </IconButton>
                        <Typography variant="h6" sx={{fontWeight: "bold"}}>
                            설문 관리
                        </Typography>
                    </Box>
                    <Box>
                        <Button
                            variant="outlined"
                            startIcon={<Assessment/>}
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
                        {isAuthenticated && (
                            <Button
                                variant="contained"
                                startIcon={<Add/>}
                                sx={{
                                    bgcolor: "#007ea7",
                                    "&:hover": {bgcolor: "#003459"},
                                }}
                                onClick={() => navigate("/survey/create")}
                            >
                                새 설문 만들기
                            </Button>
                        )}
                    </Box>
                </Box>

                {loading ? (
                    <Box sx={{display: "flex", justifyContent: "center", my: 5}}>
                        <CircularProgress/>
                    </Box>
                ) : error ? (
                    <Paper elevation={0} sx={{p: 3, textAlign: "center"}}>
                        <Typography color="error">{error}</Typography>
                        <Button
                            variant="contained"
                            sx={{mt: 2}}
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.preventDefault();
                                fetchSurveys();
                            }}
                        >
                            다시 시도
                        </Button>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} elevation={0} sx={{
                        borderRadius: 2,
                        overflow: "hidden",
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
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
                                            sx={{cursor: "pointer"}}
                                        >
                                            <TableCell sx={{
                                                maxWidth: 200,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {survey.title}
                                            </TableCell>
                                            <TableCell sx={{
                                                maxWidth: 300,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {survey.description}
                                            </TableCell>
                                            <TableCell>{survey.count}</TableCell>
                                            <TableCell>{format(new Date(survey.createdAt), 'yyyy-MM-dd HH:mm', {locale: ko})}</TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleCopyUrl(e, survey.id)}
                                                    sx={{mr: 1}}
                                                    title="고객용 URL 복사"
                                                >
                                                    <ContentCopy fontSize="small"/>
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{py: 3}}>
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

                <Box sx={{mt: 3, display: 'flex', justifyContent: 'center'}}>
                    <Pagination
                        count={totalPages}
                        page={page + 1}
                        onChange={(_, value) => setPage(value - 1)}
                        sx={{
                            '& .Mui-selected': {
                                backgroundColor: '#003459 !important',
                                color: 'white'
                            }
                        }}
                    />
                </Box>
            </Container>

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
                        {deleteLoading ? <CircularProgress size={24}/> : "삭제"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage(null)}>
                <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{width: "100%"}}>
                    {successMessage}
                </Alert>
            </Snackbar>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{width: "100%"}}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar open={!!copyUrlSuccess} autoHideDuration={3000} onClose={() => setCopyUrlSuccess(false)}>
                <Alert onClose={() => setCopyUrlSuccess(false)} severity="success" sx={{width: "100%"}}>
                    설문 URL이 클립보드에 복사되었습니다.
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SurveyList;

