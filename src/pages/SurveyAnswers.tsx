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
    TextField,
    InputAdornment,
    CircularProgress,
    Snackbar,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Card,
    CardContent,
    List,
    ListItem,
    ListItemText,
    Tabs,
    Tab,
} from "@mui/material"
import { ArrowBack, Search, ExpandMore, Person } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { surveyApi } from "../services/surveyApi"
import type { AnswerResponse, QuestionAnswerResponse } from "../types/survey"

// 탭 패널 컴포넌트
interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
            answer.customer.name.toLowerCase().includes(searchLower) ||
            answer.customer.email.toLowerCase().includes(searchLower) ||
            answer.customer.phone.toLowerCase().includes(searchLower) ||
            answer.survey.title.toLowerCase().includes(searchLower)
        )
    })

    // 설문별로 그룹화
    const groupedBySurvey = filteredAnswers.reduce(
        (acc, answer) => {
            const surveyId = answer.survey.id
            if (!acc[surveyId]) {
                acc[surveyId] = {
                    survey: answer.survey,
                    answers: [],
                }
            }
            acc[surveyId].answers.push(answer)
            return acc
        },
        {} as Record<number, { survey: AnswerResponse["survey"]; answers: AnswerResponse[] }>,
    )

    // 고객별로 그룹화
    const groupedByCustomer = filteredAnswers.reduce(
        (acc, answer) => {
            const customerId = answer.customer.id
            if (!acc[customerId]) {
                acc[customerId] = {
                    customer: answer.customer,
                    answers: [],
                }
            }
            acc[customerId].answers.push(answer)
            return acc
        },
        {} as Record<number, { customer: AnswerResponse["customer"]; answers: AnswerResponse[] }>,
    )

    // 고객 상세 페이지로 이동
    const handleViewCustomerDetail = (customerId: string) => {
        navigate(`/customer-management/${customerId}`)
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                    <IconButton onClick={() => navigate("/survey")} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        설문 응답 목록
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ mb: 3, p: 3, borderRadius: 2 }}>
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
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => fetchSurveyAnswers(0)}
                        >
                            다시 시도
                        </Button>
                    </Paper>
                ) : (
                    <Paper elevation={0} sx={{ borderRadius: 2 }}>
                        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="survey answers tabs">
                                <Tab label="전체 응답" />
                                <Tab label="설문별 보기" />
                            </Tabs>
                        </Box>

                        {/* 전체 응답 탭 */}
                        <TabPanel value={tabValue} index={0}>
                            {filteredAnswers.length > 0 ? (
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: "#f9f9f9" }}>
                                                <TableCell sx={{ fontWeight: 500 }}>고객명</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>연락처</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>이메일</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>설문 제목</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>응답 수</TableCell>
                                                <TableCell sx={{ fontWeight: 500 }}>등록 날짜</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredAnswers.map((answer, index) => (
                                                <TableRow
                                                    key={`${answer.customer.id}-${answer.survey.id}-${index}`}
                                                    hover
                                                    onClick={() => handleViewDetail(answer)}
                                                    sx={{ cursor: "pointer" }}
                                                >
                                                    <TableCell>{answer.customer.name}</TableCell>
                                                    <TableCell>{answer.customer.phone}</TableCell>
                                                    <TableCell>{answer.customer.email}</TableCell>
                                                    <TableCell>{answer.survey.title}</TableCell>
                                                    <TableCell>{answer.answer.length}</TableCell>
                                                    <TableCell>{answer.createdAt}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Box sx={{ p: 3, textAlign: "center" }}>
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
                                    <Accordion key={group.survey.id} sx={{ mb: 2 }}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Box
                                                sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}
                                            >
                                                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                                    {group.survey.title}
                                                </Typography>
                                                <Chip
                                                    label={`${group.answers.length}개의 응답`}
                                                    size="small"
                                                    sx={{ bgcolor: "#e3f2fd", color: "#1976d2" }}
                                                />
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <TableContainer>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow sx={{ bgcolor: "#f9f9f9" }}>
                                                            <TableCell sx={{ fontWeight: 500 }}>고객명</TableCell>
                                                            <TableCell sx={{ fontWeight: 500 }}>연락처</TableCell>
                                                            <TableCell sx={{ fontWeight: 500 }}>이메일</TableCell>
                                                            <TableCell sx={{ fontWeight: 500 }}>등록 날짜</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {group.answers.map((answer, index) => (
                                                            <TableRow
                                                                key={`${answer.customer.id}-${index}`}
                                                                hover
                                                                onClick={() => handleViewDetail(answer)}
                                                                sx={{ cursor: "pointer" }}
                                                            >
                                                                <TableCell>{answer.customer.name}</TableCell>
                                                                <TableCell>{answer.customer.phone}</TableCell>
                                                                <TableCell>{answer.customer.email}</TableCell>
                                                                <TableCell>{answer.createdAt}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </AccordionDetails>
                                    </Accordion>
                                ))
                            ) : (
                                <Box sx={{ p: 3, textAlign: "center" }}>
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
            <Dialog open={detailDialogOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth scroll="paper">
                {selectedAnswer && (
                    <>
                        <DialogTitle>
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                설문 응답 상세
                            </Typography>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={3}>
                                {/* 설문 정보 */}
                                <Grid item xs={12}>
                                    <Card variant="outlined" sx={{ mb: 3 }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                                                설문 정보
                                            </Typography>
                                            <Typography variant="h6" gutterBottom>
                                                {selectedAnswer.survey.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {selectedAnswer.survey.description || "설명 없음"}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* 고객 정보 */}
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ height: "100%" }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                                    고객 정보
                                                </Typography>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<Person />}
                                                    onClick={() => handleViewCustomerDetail(selectedAnswer.customer.id.toString())}
                                                >
                                                    고객 상세
                                                </Button>
                                            </Box>
                                            <List dense>
                                                <ListItem>
                                                    <ListItemText primary="이름" secondary={selectedAnswer.customer.name} />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText primary="이메일" secondary={selectedAnswer.customer.email} />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText primary="연락처" secondary={selectedAnswer.customer.phone} />
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* 응답 시간 정보 */}
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ height: "100%" }}>
                                        <CardContent>
                                            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
                                                응답 정보
                                            </Typography>
                                            <List dense>
                                                <ListItem>
                                                    <ListItemText primary="등록일" secondary={selectedAnswer.createdAt} />
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemText
                                                        primary="마케팅 동의"
                                                        secondary={selectedAnswer.customer.consent ? "동의함" : "동의하지 않음"}
                                                    />
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* 응답 내용 */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 2 }}>
                                        응답 내용
                                    </Typography>
                                    {selectedAnswer.answer.map((item: QuestionAnswerResponse, index: number) => (
                                        <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                                            <CardContent>
                                                <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                                                    {index + 1}. {selectedAnswer.survey.questionList.find(q => q.id === parseInt(item.question))?.content || item.question}
                                                </Typography>
                                                <Divider sx={{ my: 1 }} />
                                                {item.answer.length > 0 ? (
                                                    <Box sx={{ pl: 2 }}>
                                                        {item.answer.map((ans, i) => (
                                                            <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                                                                {item.answer.length > 1 ? `• ${ans}` : ans}
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
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

export default SurveyAnswers

