"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    Container,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
    TextField,
    Typography,
    Alert,
    Paper,
} from "@mui/material"
// 고객용 API 함수 import로 변경
import { getSurveyForCustomer, submitSurveyAnswerForCustomer } from "../services/surveyApi"
import { QuestionType, type QuestionResponse, type SurveyResponse } from "../types/survey"
import { CheckCircle } from "@mui/icons-material"

const SurveySubmit: React.FC = () => {
    const { surveyId } = useParams<{ surveyId: string }>()
    const navigate = useNavigate()

    const [loading, setLoading] = useState<boolean>(true)
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<boolean>(false)
    const [survey, setSurvey] = useState<SurveyResponse | null>(null)

    // 고객 정보
    const [name, setName] = useState<string>("")
    const [email, setEmail] = useState<string>("")
    const [phone, setPhone] = useState<string>("")
    const [consent, setConsent] = useState<boolean>(false)

    // 답변 관리
    const [answers, setAnswers] = useState<{ [key: number]: string[] }>({})

    // 유효성 검사 오류
    const [formErrors, setFormErrors] = useState<{
        name?: string
        email?: string
        phone?: string
        consent?: string
        questions?: { [key: number]: string }
    }>({})

    // 각 필드에 대한 ref 생성
    const nameRef = useRef<HTMLDivElement>(null)
    const emailRef = useRef<HTMLDivElement>(null)
    const phoneRef = useRef<HTMLDivElement>(null)
    const consentRef = useRef<HTMLDivElement>(null)
    const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // 설문 데이터 로드
    useEffect(() => {
        // fetchSurvey 함수 내에서 API 호출 부분 변경
        const fetchSurvey = async () => {
            if (!surveyId) return

            try {
                setLoading(true)
                const response = await getSurveyForCustomer(Number.parseInt(surveyId))
                if (response.data.success && response.data.data) {
                    setSurvey(response.data.data)

                    // 답변 상태 초기화
                    const initialAnswers: { [key: number]: string[] } = {}
                    response.data.data.questionList.forEach((question) => {
                        initialAnswers[question.id] = []
                    })
                    setAnswers(initialAnswers)
                } else {
                    setError("설문을 불러오는데 실패했습니다.")
                }
            } catch (err) {
                console.error("설문 로드 오류:", err)
                setError("설문을 불러오는데 오류가 발생했습니다.")
            } finally {
                setLoading(false)
            }
        }

        fetchSurvey()
    }, [surveyId])

    // 답변 상태 업데이트 핸들러
    const handleAnswerChange = (questionId: number, value: string, checked?: boolean) => {
        setAnswers((prev) => {
            const answersCopy = { ...prev }

            // 질문 찾기
            const question = survey?.questionList.find((q) => q.id === questionId)
            if (!question) return prev

            // 질문 타입에 따라 처리
            if (question.type === QuestionType.RADIO) {
                // 라디오 버튼: 하나의 값만 저장
                answersCopy[questionId] = [value]
            } else if (question.type === QuestionType.CHECKBOX) {
                // 체크박스: 여러 값 저장 가능
                if (checked) {
                    // 선택된 경우 추가
                    if (!answersCopy[questionId].includes(value)) {
                        answersCopy[questionId] = [...answersCopy[questionId], value]
                    }
                } else {
                    // 선택 해제된 경우 제거
                    answersCopy[questionId] = answersCopy[questionId].filter((item) => item !== value)
                }
            } else if (question.type === QuestionType.TEXT) {
                // 텍스트: 입력값 저장
                answersCopy[questionId] = [value]
            }

            return answersCopy
        })
    }

    // 폼 유효성 검사
    const validateForm = () => {
        const errors: {
            name?: string
            email?: string
            phone?: string
            consent?: string
            questions?: { [key: number]: string }
        } = {}

        // 고객 정보 검사
        if (!name.trim()) {
            errors.name = "이름을 입력해주세요."
        }

        if (!email.trim()) {
            errors.email = "이메일을 입력해주세요."
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.email = "올바른 이메일 형식이 아닙니다."
        }

        if (!phone.trim()) {
            errors.phone = "전화번호를 입력해주세요."
        }

        if (!consent) {
            errors.consent = "개인정보 수집 및 이용에 동의해주세요."
        }

        // 필수 질문 응답 검사
        const questionErrors: { [key: number]: string } = {}
        survey?.questionList.forEach((question) => {
            if (question.isRequired && (!answers[question.id] || answers[question.id].length === 0)) {
                questionErrors[question.id] = "필수 응답 항목입니다."
            }
        })

        if (Object.keys(questionErrors).length > 0) {
            errors.questions = questionErrors
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    // 첫 번째 오류 필드로 스크롤
    const scrollToFirstError = () => {
        // 개인 정보 필드 오류 확인
        if (formErrors.name && nameRef.current) {
            nameRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
            return
        }
        if (formErrors.email && emailRef.current) {
            emailRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
            return
        }
        if (formErrors.phone && phoneRef.current) {
            phoneRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
            return
        }
        if (formErrors.consent && consentRef.current) {
            consentRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
            return
        }

        // 질문 필드 오류 확인
        if (formErrors.questions) {
            // 첫 번째 오류가 있는 질문 ID 찾기
            const firstErrorQuestionId = Object.keys(formErrors.questions)[0]
            if (firstErrorQuestionId && questionRefs.current[firstErrorQuestionId]) {
                questionRefs.current[firstErrorQuestionId]?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
        }
    }

    // 오류가 발생했을 때 스크롤
    useEffect(() => {
        if (Object.keys(formErrors).length > 0) {
            scrollToFirstError()
        }
    }, [formErrors])

    // 설문 제출 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 폼 유효성 검사
        if (!validateForm()) {
            return
        }

        try {
            setSubmitting(true)

            // API 요청 형식에 맞게 데이터 가공
            const questions = survey!.questionList.map((q) => q.id)
            const formattedAnswers = survey!.questionList.map((q) => answers[q.id] || [])

            // 요청 데이터 준비
            const answerRequest = {
                name,
                email,
                phone,
                consent,
                questions,
                answers: formattedAnswers,
            }

            // 고객용 API 호출로 변경
            const response = await submitSurveyAnswerForCustomer(Number.parseInt(surveyId!), answerRequest)

            if (response.data.success) {
                setSuccess(true)
                // 폼 초기화
                setName("")
                setEmail("")
                setPhone("")
                setConsent(false)

                // 답변 초기화
                const initialAnswers: { [key: number]: string[] } = {}
                survey!.questionList.forEach((question) => {
                    initialAnswers[question.id] = []
                })
                setAnswers(initialAnswers)

                // 오류 초기화
                setFormErrors({})

                // 페이지 상단으로 스크롤
                window.scrollTo(0, 0)
            } else {
                setError("설문 제출에 실패했습니다.")
            }
        } catch (err) {
            console.error("설문 제출 오류:", err)
            setError("설문 제출 중 오류가 발생했습니다.")
        } finally {
            setSubmitting(false)
        }
    }

    // 질문 렌더링 함수
    const renderQuestion = (question: QuestionResponse) => {
        const questionError = formErrors.questions?.[question.id]

        return (
            <Box
                key={question.id}
                mb={3}
                sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 1 }}
                ref={(el: HTMLDivElement | null) => {
                    questionRefs.current[question.id] = el;
                }}
            >
                <FormControl required={question.isRequired} error={!!questionError} component="fieldset" fullWidth>
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: "bold" }}>
                        {question.content}
                        {question.isRequired && <span style={{ color: "red" }}> *</span>}
                    </FormLabel>

                    {renderQuestionOptions(question)}

                    {questionError && <FormHelperText error>{questionError}</FormHelperText>}
                </FormControl>
            </Box>
        )
    }

    // 질문 유형별 옵션 렌더링
    const renderQuestionOptions = (question: QuestionResponse) => {
        switch (question.type) {
            case QuestionType.RADIO:
                return (
                    <RadioGroup
                        value={answers[question.id]?.[0] || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    >
                        {question.options.map((option, idx) => (
                            <FormControlLabel key={idx} value={option} control={<Radio />} label={option} />
                        ))}
                    </RadioGroup>
                )

            case QuestionType.CHECKBOX:
                return (
                    <FormGroup>
                        {question.options.map((option, idx) => (
                            <FormControlLabel
                                key={idx}
                                control={
                                    <Checkbox
                                        checked={answers[question.id]?.includes(option) || false}
                                        onChange={(e) => handleAnswerChange(question.id, option, e.target.checked)}
                                    />
                                }
                                label={option}
                            />
                        ))}
                    </FormGroup>
                )

            case QuestionType.TEXT:
                return (
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="답변을 입력해주세요"
                        value={answers[question.id]?.[0] || ""}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        variant="outlined"
                        margin="normal"
                    />
                )

            default:
                return null
        }
    }

    // 성공 화면 렌더링
    const renderSuccessScreen = () => {
        return (
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 8,
                    textAlign: "center",
                }}
            >
                <CheckCircle sx={{ fontSize: 80, color: "success.main", mb: 3 }} />
                <Typography variant="h4" gutterBottom>
                    설문 제출이 완료되었습니다!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: "600px" }}>
                    소중한 의견을 보내주셔서 감사합니다. 제출하신 내용은 소중히 활용하겠습니다.
                </Typography>
                <Button variant="contained" color="primary" size="large" onClick={() => window.location.reload()}>
                    다른 응답 작성하기
                </Button>
            </Box>
        )
    }

    // 로딩 중
    if (loading) {
        return (
            <Container maxWidth="md" sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                <CircularProgress />
            </Container>
        )
    }

    // 오류 발생
    if (error && !survey) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Alert severity="error">{error}</Alert>
                <Button variant="outlined" color="primary" sx={{ mt: 2 }} onClick={() => navigate(-1)}>
                    이전으로 돌아가기
                </Button>
            </Container>
        )
    }

    // 성공 화면 표시
    if (success) {
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                {renderSuccessScreen()}
            </Container>
        )
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {survey && (
                <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {survey.title}
                    </Typography>
                    <Typography variant="body1" paragraph>
                        {survey.description}
                    </Typography>
                </Paper>
            )}

            <form onSubmit={handleSubmit}>
                <Card sx={{ mb: 4 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            개인 정보
                        </Typography>

                        <Divider sx={{ mb: 3 }} />

                        <Stack spacing={2}>
                            <TextField
                                label="이름"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                fullWidth
                                required
                                error={!!formErrors.name}
                                helperText={formErrors.name}
                                inputRef={nameRef}
                            />

                            <TextField
                                label="이메일"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                fullWidth
                                required
                                error={!!formErrors.email}
                                helperText={formErrors.email}
                                inputRef={emailRef}
                            />

                            <TextField
                                label="전화번호"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                fullWidth
                                required
                                error={!!formErrors.phone}
                                helperText={formErrors.phone}
                                inputRef={phoneRef}
                            />

                            <FormControl required error={!!formErrors.consent} ref={consentRef}>
                                <FormControlLabel
                                    control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />}
                                    label="개인정보 수집 및 이용에 동의합니다."
                                />
                                {formErrors.consent && <FormHelperText error>{formErrors.consent}</FormHelperText>}
                            </FormControl>
                        </Stack>
                    </CardContent>
                </Card>

                {survey && (
                    <Card sx={{ mb: 4 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                설문 항목
                            </Typography>

                            <Divider sx={{ mb: 3 }} />

                            {survey.questionList.map(renderQuestion)}
                        </CardContent>
                    </Card>
                )}

                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={submitting}
                        sx={{ minWidth: 120 }}
                    >
                        {submitting ? <CircularProgress size={24} /> : "제출하기"}
                    </Button>
                </Box>
            </form>
        </Container>
    )
}

export default SurveySubmit

