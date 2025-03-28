"use client"

import { useState, useEffect } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    IconButton,
    AppBar,
    Toolbar,
    Grid,
    FormControlLabel,
    Checkbox,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Divider,
    CircularProgress,
    Snackbar,
    Alert,
    Card,
    CardContent,
} from "@mui/material"
import { ArrowBack, Add, Delete, DragIndicator } from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { surveyApi } from "../services/surveyApi"
import type { SurveyUpdateRequest, QuestionUpdateRequest } from "../types/survey"
import { QuestionType as QuestionTypeEnum } from "../types/survey"

const SurveyEdit = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // 설문 기본 정보
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")

    // 질문 목록
    const [questions, setQuestions] = useState<QuestionUpdateRequest[]>([])

    useEffect(() => {
        if (id) {
            fetchSurveyDetails(Number.parseInt(id))
        }
    }, [id])

    const fetchSurveyDetails = async (surveyId: number) => {
        try {
            setInitialLoading(true)
            const response = await surveyApi.getSurveyById(surveyId)

            if (response.data.success && response.data.data) {
                const survey = response.data.data
                setTitle(survey.title)
                setDescription(survey.description || "")

                // 질문 목록 설정
                const questionList: QuestionUpdateRequest[] = survey.questionList.map((q) => ({
                    id: q.id,
                    content: q.content,
                    type: q.type,
                    isRequired: q.isRequired,
                    options: [...q.options],
                }))

                setQuestions(questionList)
            } else {
                setError("설문 정보를 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching survey details:", err)
            setError("설문 정보를 불러오는데 실패했습니다.")
        } finally {
            setInitialLoading(false)
        }
    }

    // 질문 추가
    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                content: "",
                type: QuestionTypeEnum.RADIO,
                isRequired: false,
                options: ["", ""],
            },
        ])
    }

    // 질문 삭제
    const handleRemoveQuestion = (index: number) => {
        const newQuestions = [...questions]
        newQuestions.splice(index, 1)
        setQuestions(newQuestions)
    }

    // 질문 내용 변경
    const handleQuestionChange = (index: number, field: keyof QuestionUpdateRequest, value: any) => {
        const newQuestions = [...questions]
        newQuestions[index] = {
            ...newQuestions[index],
            [field]: value,
        }

        // 질문 타입이 변경되면 옵션 초기화
        if (field === "type") {
            if (value === QuestionTypeEnum.TEXT) {
                newQuestions[index].options = []
            } else if (newQuestions[index].options.length === 0) {
                newQuestions[index].options = ["", ""]
            }
        }

        setQuestions(newQuestions)
    }

    // 옵션 추가
    const handleAddOption = (questionIndex: number) => {
        const newQuestions = [...questions]
        newQuestions[questionIndex].options.push("")
        setQuestions(newQuestions)
    }

    // 옵션 삭제
    const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
        const newQuestions = [...questions]
        newQuestions[questionIndex].options.splice(optionIndex, 1)
        setQuestions(newQuestions)
    }

    // 옵션 내용 변경
    const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
        const newQuestions = [...questions]
        newQuestions[questionIndex].options[optionIndex] = value
        setQuestions(newQuestions)
    }

    // 설문 수정 제출
    const handleSubmit = async () => {
        if (!id) return

        // 유효성 검사
        if (!title.trim()) {
            setError("설문 제목을 입력해주세요.")
            return
        }

        // 모든 질문에 내용이 있는지 확인
        const invalidQuestion = questions.find((q) => !q.content.trim())
        if (invalidQuestion) {
            setError("모든 질문에 내용을 입력해주세요.")
            return
        }

        // 라디오/체크박스 타입의 질문에 옵션이 있는지 확인
        const invalidOptions = questions.find(
            (q) =>
                (q.type === QuestionTypeEnum.RADIO || q.type === QuestionTypeEnum.CHECKBOX) &&
                (q.options.length === 0 || q.options.some((opt) => !opt.content.trim())),
        )
        if (invalidOptions) {
            setError("모든 선택 옵션에 내용을 입력해주세요.")
            return
        }

        try {
            setLoading(true)
            setError(null)

            const surveyData: SurveyUpdateRequest = {
                title,
                description,
                questionList: questions,
            }

            const response = await surveyApi.updateSurvey(Number.parseInt(id), surveyData)

            if (response.data.success) {
                setSuccess(true)
                setTimeout(() => {
                    navigate(`/survey/${id}`)
                }, 1500)
            } else {
                setError(response.data.error?.message || "설문 수정에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error updating survey:", err)
            setError(err.response?.data?.error?.message || "설문 수정에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    if (initialLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        설문 수정
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={0} sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                        <IconButton onClick={() => navigate(`/survey/${id}`)} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            설문 수정하기
                        </Typography>
                    </Box>

                    {/* 설문 기본 정보 */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12}>
                            <TextField
                                required
                                fullWidth
                                label="설문 제목"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="설문 제목을 입력하세요"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="설문 설명"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="설문에 대한 설명을 입력하세요"
                                multiline
                                rows={2}
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    {/* 질문 목록 */}
                    <Typography variant="h6" sx={{ mb: 3 }}>
                        질문 목록
                    </Typography>

                    {questions.map((question, questionIndex) => (
                        <Card key={questionIndex} sx={{ mb: 3, border: "1px solid #eee" }}>
                            <CardContent>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <DragIndicator sx={{ color: "#aaa", mr: 1 }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                        질문 {questionIndex + 1}
                                    </Typography>
                                    <Box sx={{ flexGrow: 1 }} />
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemoveQuestion(questionIndex)}
                                        disabled={questions.length === 1}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            required
                                            fullWidth
                                            label="질문 내용"
                                            value={question.content}
                                            onChange={(e) => handleQuestionChange(questionIndex, "content", e.target.value)}
                                            placeholder="질문 내용을 입력하세요"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>질문 유형</InputLabel>
                                            <Select
                                                value={question.type}
                                                label="질문 유형"
                                                onChange={(e) => handleQuestionChange(questionIndex, "type", e.target.value)}
                                            >
                                                <MenuItem value={QuestionTypeEnum.RADIO}>객관식 (단일 선택)</MenuItem>
                                                <MenuItem value={QuestionTypeEnum.CHECKBOX}>객관식 (다중 선택)</MenuItem>
                                                <MenuItem value={QuestionTypeEnum.TEXT}>주관식</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={question.isRequired}
                                                    onChange={(e) => handleQuestionChange(questionIndex, "isRequired", e.target.checked)}
                                                />
                                            }
                                            label="필수 질문"
                                        />
                                    </Grid>
                                </Grid>

                                {/* 객관식 옵션 (라디오/체크박스) */}
                                {(question.type === QuestionTypeEnum.RADIO || question.type === QuestionTypeEnum.CHECKBOX) && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                                            선택 옵션
                                        </Typography>

                                        {question.options.map((option, optionIndex) => (
                                            <Box key={optionIndex} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                                {question.type === QuestionTypeEnum.RADIO ? (
                                                    <Checkbox checked disabled />
                                                ) : (
                                                    <Checkbox disabled />
                                                )}
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    value={option}
                                                    onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                                                    placeholder={`옵션 ${optionIndex + 1}`}
                                                    sx={{ mr: 1 }}
                                                />
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleRemoveOption(questionIndex, optionIndex)}
                                                    disabled={question.options.length <= 2}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}

                                        <Button startIcon={<Add />} onClick={() => handleAddOption(questionIndex)} sx={{ mt: 1 }}>
                                            옵션 추가
                                        </Button>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    ))}

                    <Button variant="outlined" startIcon={<Add />} onClick={handleAddQuestion} sx={{ mb: 4 }}>
                        질문 추가
                    </Button>

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                        <Button
                            variant="outlined"
                            sx={{ mr: 1, borderColor: "#ddd", color: "#333" }}
                            onClick={() => navigate(`/survey/${id}`)}
                            disabled={loading}
                        >
                            취소
                        </Button>
                        <Button
                            variant="contained"
                            sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#333" } }}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : "설문 수정하기"}
                        </Button>
                    </Box>
                </Paper>
            </Container>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: "100%" }}>
                    설문이 성공적으로 수정되었습니다.
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

export default SurveyEdit

