import type React from "react"
import {useEffect, useRef, useState} from "react"
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    Paper,
    Snackbar,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography,
} from "@mui/material"
import {ArrowBack, ExpandMore, Person, Search} from "@mui/icons-material"
import {useNavigate} from "react-router-dom"
import {surveyApi} from "@/domain/survey/services/surveyApi"
import type {AnswerResponse} from "@/domain/survey/types/survey"

// 탭 패널 컴포넌트
interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

function TabPanel(props: TabPanelProps) {
    const {children, value, index, ...other} = props

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{p: 3}}>{children}</Box>}
        </div>
    )
}

const SurveyAnswers = () => {
    const navigate = useNavigate()
    const [answers, setAnswers] = useState<AnswerResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedAnswer, setSelectedAnswer] = useState<AnswerResponse | null>(null)
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)
    const [tabValue, setTabValue] = useState(0)

    // Add new state variables for pagination
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadingRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        fetchSurveyAnswers()
    }, [])

    // Add intersection observer effect
    useEffect(() => {
        if (loading) return

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    setPage(prev => {
                        const nextPage = prev + 1
                        fetchSurveyAnswers(nextPage)
                        return nextPage
                    })
                }
            },
            {threshold: 1.0}
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

    // Modify fetchSurveyAnswers to handle pagination
    const fetchSurveyAnswers = async (pageNum: number = 0) => {
        try {
            if (pageNum === 0) {
                setLoading(true)
            } else {
                setIsLoadingMore(true)
            }

            const response = await surveyApi.getAllSurveyAnswers(pageNum)
            if (response.data.success && response.data.data) {
                const newAnswers = response.data.data.content || []
                if (pageNum === 0) {
                    setAnswers(newAnswers)
                } else {
                    setAnswers(prev => [...prev, ...newAnswers])
                }
                setHasMore(!response.data.data.last)
            } else {
                setError("설문 응답 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching survey answers:", err)
            setError("설문 응답 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
            setIsLoadingMore(false)
        }
    }

    const handleViewDetail = (answer: AnswerResponse) => {
        setSelectedAnswer(answer)
        setDetailDialogOpen(true)
    }

    const handleCloseDetail = () => {
        setDetailDialogOpen(false)
    }

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue)
    }

    // 검색어로 필터링
    const filteredAnswers = answers.filter((answer) => {
        const searchLower = searchTerm.toLowerCase()
        return (
            answer.customerName.toLowerCase().includes(searchLower) ||
            answer.customerEmail.toLowerCase().includes(searchLower) ||
            answer.customerPhone.toLowerCase().includes(searchLower) ||
            answer.surveyTitle.toLowerCase().includes(searchLower)
        )
    })

    // 설문별로 그룹화
    const groupedBySurvey = filteredAnswers.reduce(
        (acc, answer) => {
            const surveyId = answer.customerId
            if (!acc[surveyId]) {
                acc[surveyId] = {
                    survey: {
                        id: answer.customerId,
                        title: answer.surveyTitle,
                        description: answer.surveyDescription
                    },
                    answers: [],
                }
            }
            acc[surveyId].answers.push(answer)
            return acc
        },
        {} as Record<number, { survey: { id: number; title: string; description: string }; answers: AnswerResponse[] }>,
    )

    // 고객별로 그룹화
    const groupedByCustomer = filteredAnswers.reduce(
        (acc, answer) => {
            const customerId = answer.customerId
            if (!acc[customerId]) {
                acc[customerId] = {
                    customer: {
                        id: answer.customerId,
                        name: answer.customerName,
                        email: answer.customerEmail,
                        phone: answer.customerPhone,
                        consent: answer.customerConsent
                    },
                    answers: [],
                }
            }
            acc[customerId].answers.push(answer)
            return acc
        },
        {} as Record<number, {
            customer: { id: number; name: string; email: string; phone: string; consent: boolean };
            answers: AnswerResponse[]
        }>,
    )

    // 고객 상세 페이지로 이동
    const handleViewCustomerDetail = (customerId: string) => {
        navigate(`/customer-management/${customerId}`)
    }

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
        <Box sx={{flexGrow: 1, minHeight: "100vh", py: 3}}>
            <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
                <Box sx={{display: "flex", alignItems: "center", mb: 4}}>
                    <IconButton onClick={() => navigate("/survey")} sx={{mr: 1}}>
                        <ArrowBack/>
                    </IconButton>
                    <Typography variant="h6" sx={{fontWeight: "bold"}}>
                        설문 응답 목록
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 2,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                    <TextField
                        placeholder="고객명, 이메일, 전화번호 또는 설문 제목으로 검색"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search/>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Paper>

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
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => fetchSurveyAnswers(0)}
                        >
                            다시 시도
                        </Button>
                    </Paper>
                ) : (
                    <Paper elevation={0} sx={{borderRadius: 2}}>
                        <Box sx={{borderBottom: 1, borderColor: "divider"}}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="survey answers tabs">
                                <Tab label="전체 응답"/>
                                <Tab label="설문별 보기"/>
                            </Tabs>
                        </Box>

                        {/* 전체 응답 탭 */}
                        <TabPanel value={tabValue} index={0}>
                            {filteredAnswers.length > 0 ? (
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
                                                }}>고객명</TableCell>
                                                <TableCell sx={{
                                                    padding: '12px 16px',
                                                    textAlign: 'left',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: '#003459'
                                                }}>이메일</TableCell>
                                                <TableCell sx={{
                                                    padding: '12px 16px',
                                                    textAlign: 'left',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: '#003459'
                                                }}>전화번호</TableCell>
                                                <TableCell sx={{
                                                    padding: '12px 16px',
                                                    textAlign: 'left',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: '#003459'
                                                }}>설문 제목</TableCell>
                                                <TableCell sx={{
                                                    padding: '12px 16px',
                                                    textAlign: 'left',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: '#003459'
                                                }}>응답일</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredAnswers.map((answer, index) => (
                                                <TableRow
                                                    key={`${answer.customerId}-${index}`}
                                                    hover
                                                    onClick={() => handleViewDetail(answer)}
                                                    sx={{cursor: "pointer"}}
                                                >
                                                    <TableCell>{answer.customerName}</TableCell>
                                                    <TableCell>{answer.customerEmail}</TableCell>
                                                    <TableCell>{answer.customerPhone}</TableCell>
                                                    <TableCell>{answer.surveyTitle}</TableCell>
                                                    <TableCell>{formatDate(answer.createdAt)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box sx={{p: 3, textAlign: "center"}}>
                                    <Typography variant="body1">
                                        {searchTerm ? "검색 결과가 없습니다." : "등록된 설문 응답이 없습니다."}
                                    </Typography>
                                </Box>
                            )}
                        </TabPanel>

                        {/* 설문별 보기 탭 */}
                        <TabPanel value={tabValue} index={1}>
                            {Object.keys(groupedBySurvey).length > 0 ? (
                                Object.values(groupedBySurvey).map((group) => (
                                    <Accordion key={group.survey.id} sx={{mb: 2}}>
                                        <AccordionSummary expandIcon={<ExpandMore/>}>
                                            <Box
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    width: "100%",
                                                    justifyContent: "space-between"
                                                }}
                                            >
                                                <Typography variant="subtitle1" sx={{fontWeight: "bold"}}>
                                                    {group.survey.title}
                                                </Typography>
                                                <Chip
                                                    label={`${group.answers.length}개의 응답`}
                                                    size="small"
                                                    sx={{bgcolor: "#e3f2fd", color: "#1976d2"}}
                                                />
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <TableContainer component={Paper} elevation={0} sx={{
                                                borderRadius: 2,
                                                overflow: "hidden",
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                            }}>
                                                <Table size="small">
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
                                                            }}>고객명</TableCell>
                                                            <TableCell sx={{
                                                                padding: '12px 16px',
                                                                textAlign: 'left',
                                                                fontSize: '0.875rem',
                                                                fontWeight: 500,
                                                                color: '#003459'
                                                            }}>이메일</TableCell>
                                                            <TableCell sx={{
                                                                padding: '12px 16px',
                                                                textAlign: 'left',
                                                                fontSize: '0.875rem',
                                                                fontWeight: 500,
                                                                color: '#003459'
                                                            }}>전화번호</TableCell>
                                                            <TableCell sx={{
                                                                padding: '12px 16px',
                                                                textAlign: 'left',
                                                                fontSize: '0.875rem',
                                                                fontWeight: 500,
                                                                color: '#003459'
                                                            }}>응답일</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {group.answers.map((answer, index) => (
                                                            <TableRow
                                                                key={`${answer.customerId}-${index}`}
                                                                hover
                                                                onClick={() => handleViewDetail(answer)}
                                                                sx={{cursor: "pointer"}}
                                                            >
                                                                <TableCell>{answer.customerName}</TableCell>
                                                                <TableCell>{answer.customerEmail}</TableCell>
                                                                <TableCell>{answer.customerPhone}</TableCell>
                                                                <TableCell>{answer.surveyTitle}</TableCell>
                                                                <TableCell>{formatDate(answer.createdAt)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </AccordionDetails>
                                    </Accordion>
                                ))
                            ) : (
                                <Box sx={{p: 3, textAlign: "center"}}>
                                    <Typography variant="body1">
                                        {searchTerm ? "검색 결과가 없습니다." : "등록된 설문 응답이 없습니다."}
                                    </Typography>
                                </Box>
                            )}
                        </TabPanel>
                    </Paper>
                )}
            </Container>
            {/* 상세 보기 다이얼로그 */}
            <Dialog
                open={detailDialogOpen}
                onClose={handleCloseDetail}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }
                }}
            >
                {selectedAnswer && (
                    <>
                        <DialogTitle>
                            <Typography variant="h6" sx={{fontWeight: "bold"}}>
                                설문 응답 상세
                            </Typography>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={3}>
                                {/* 설문 정보 */}
                                <Grid size={12}>
                                    <Card variant="outlined" sx={{mb: 3}}>
                                        <CardContent>
                                            <Typography variant="subtitle1" sx={{fontWeight: "bold", mb: 1}}>
                                                설문 정보
                                            </Typography>
                                            <Typography variant="h6" gutterBottom>
                                                {selectedAnswer.surveyTitle}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {selectedAnswer.surveyDescription || "설명 없음"}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* 고객 정보 */}
                                <Grid
                                    size={{
                                        xs: 12,
                                        md: 6
                                    }}>
                                    <Card variant="outlined" sx={{
                                        height: "100%",
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                    }}>
                                        <CardContent>
                                            <Box sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                mb: 2
                                            }}>
                                                <Typography variant="subtitle1" sx={{fontWeight: "bold"}}>
                                                    고객 정보
                                                </Typography>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<Person/>}
                                                    onClick={() => handleViewCustomerDetail(selectedAnswer.customerId.toString())}
                                                >
                                                    고객 상세
                                                </Button>
                                            </Box>
                                            <List dense>
                                                <ListItem>
                                                    <ListItemText primary="이름" secondary={selectedAnswer.customerName}/>
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText primary="이메일"
                                                                  secondary={selectedAnswer.customerEmail}/>
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText primary="연락처"
                                                                  secondary={selectedAnswer.customerPhone}/>
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* 응답 시간 정보 */}
                                <Grid
                                    size={{
                                        xs: 12,
                                        md: 6
                                    }}>
                                    <Card variant="outlined" sx={{
                                        height: "100%",
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                    }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" sx={{fontWeight: "bold", mb: 2}}>
                                                응답 정보
                                            </Typography>
                                            <List dense>
                                                <ListItem>
                                                    <ListItemText primary="등록일"
                                                                  secondary={formatDate(selectedAnswer.createdAt)}/>
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText
                                                        primary="마케팅 동의"
                                                        secondary={selectedAnswer.customerConsent ? "동의함" : "동의하지 않음"}
                                                    />
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* 응답 내용 */}
                                <Grid size={12}>
                                    <Typography variant="subtitle1" sx={{fontWeight: "bold", mb: 2}}>
                                        응답 내용
                                    </Typography>
                                    {selectedAnswer.questionAnswers.map((item, index) => (
                                        <Card key={index} variant="outlined" sx={{
                                            mb: 2,
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                        }}>
                                            <CardContent>
                                                <Typography variant="subtitle2" sx={{fontWeight: "bold", mb: 1}}>
                                                    {index + 1}. {item.question}
                                                </Typography>
                                                <Divider sx={{my: 1}}/>
                                                {item.answers.length > 0 ? (
                                                    <Box sx={{pl: 2}}>
                                                        {item.answers.map((ans, i) => (
                                                            <Typography key={i} variant="body2" sx={{mb: 0.5}}>
                                                                {item.answers.length > 1 ? `• ${ans}` : ans}
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary" sx={{pl: 2}}>
                                                        응답 없음
                                                    </Typography>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDetail}>닫기</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{width: "100%"}}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default SurveyAnswers

