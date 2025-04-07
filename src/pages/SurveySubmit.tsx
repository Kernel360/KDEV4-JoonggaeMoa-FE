"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
    Snackbar,
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
    const [validationAlert, setValidationAlert] = useState<boolean>(false)
    const [missingRequiredQuestions, setMissingRequiredQuestions] = useState<string[]>([])

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

    // 전화번호 포맷팅 함수
    const formatPhoneNumber = (phone: string) => {
        // 이미 하이픈이 포함된 형식이면 그대로 반환
        if (phone.includes('-')) {
            return phone;
        }
        // 숫자만 있는 경우 하이픈 추가
        return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    };

    // 실시간 유효성 검사 함수
    const validateField = (field: string, value: any, questionId?: number) => {
        const newErrors = { ...formErrors }
        
        if (field === 'name') {
            if (!value.trim()) {
                newErrors.name = "이름을 입력해주세요."
            } else {
                delete newErrors.name
            }
        } else if (field === 'email') {
            if (!value.trim()) {
                newErrors.email = "이메일을 입력해주세요."
            } else if (!/\S+@\S+\.\S+/.test(value)) {
                newErrors.email = "올바른 이메일 형식이 아닙니다."
            } else {
                delete newErrors.email
            }
        } else if (field === 'phone') {
            if (!value.trim()) {
                newErrors.phone = "전화번호를 입력해주세요."
            } else if (!/^\d{3}-\d{4}-\d{4}$/.test(value)) {
                newErrors.phone = "올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)"
            } else {
                delete newErrors.phone
            }
        } else if (field === 'consent') {
            if (!value) {
                newErrors.consent = "개인정보 수집 및 이용에 동의해주세요."
            } else {
                delete newErrors.consent
            }
        } else if (field === 'question' && typeof questionId === 'number') {
            if (!newErrors.questions) {
                newErrors.questions = {}
            }
            
            const question = survey?.questionList.find(q => q.id === questionId)
            if (question?.isRequired) {
                // 빈 배열이거나 모든 요소가 빈 문자열인 경우
                if (!value || 
                    (Array.isArray(value) && 
                     (value.length === 0 || value.every(item => !item.trim())))) {
                    newErrors.questions[questionId] = "필수 응답 항목입니다."
                    
                    // 필수 질문 누락 목록 업데이트
                    const missingQuestions = [...missingRequiredQuestions];
                    if (!missingQuestions.includes(question.content)) {
                        missingQuestions.push(question.content);
                        setMissingRequiredQuestions(missingQuestions);
                        setValidationAlert(true);
                    }
                } else {
                    delete newErrors.questions[questionId];
                    
                    // 필수 질문 누락 목록에서 제거
                    const missingQuestions = missingRequiredQuestions.filter(q => q !== question.content);
                    setMissingRequiredQuestions(missingQuestions);
                    if (missingQuestions.length === 0) {
                        setValidationAlert(false);
                    }
                }
            }
            
            // 모든 질문 에러가 없으면 questions 객체 삭제
            if (Object.keys(newErrors.questions).length === 0) {
                delete newErrors.questions
            }
        }
        
        setFormErrors(newErrors)
    }

    // 이름 변경 핸들러
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value
        setName(newName)
        validateField('name', newName)
    }

    // 이메일 변경 핸들러
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value
        setEmail(newEmail)
        validateField('email', newEmail)
    }

    // 전화번호 입력 핸들러
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // 숫자만 추출
        const numbersOnly = value.replace(/[^\d]/g, '');
        let formattedNumber = numbersOnly;
        
        // 자동 하이픈 추가
        if (numbersOnly.length > 0) {
            if (numbersOnly.length <= 3) {
                formattedNumber = numbersOnly;
            } else if (numbersOnly.length <= 7) {
                formattedNumber = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
            } else {
                formattedNumber = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7, 11)}`;
            }
        }
        
        setPhone(formattedNumber);
        validateField('phone', formattedNumber);
    };

    // 동의 체크박스 핸들러
    const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newConsent = e.target.checked
        setConsent(newConsent)
        validateField('consent', newConsent)
    }

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
                validateField('question', [value], questionId)
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
                validateField('question', answersCopy[questionId], questionId)
            } else if (question.type === QuestionType.TEXT) {
                // 텍스트: 입력값 저장
                answersCopy[questionId] = [value]
                validateField('question', [value], questionId)
            }

            return answersCopy
        })
    }

    // 설문 데이터 로드
    useEffect(() => {
        // fetchSurvey 함수 내에서 API 호출 부분 변경
        const fetchSurvey = async () => {
            if (!surveyId) return

            try {
                setLoading(true)
                const response = await getSurveyForCustomer(surveyId)
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
        } else if (!/^\d{3}-\d{4}-\d{4}$/.test(phone)) {
            errors.phone = "올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)"
        }

        if (!consent) {
            errors.consent = "개인정보 수집 및 이용에 동의해주세요."
        }

        // 필수 질문 응답 검사
        const questionErrors: { [key: number]: string } = {}
        const missingQuestions: string[] = []
        
        survey?.questionList.forEach((question) => {
            if (question.isRequired) {
                const hasAnswer = answers[question.id] && 
                                 answers[question.id].length > 0 && 
                                 answers[question.id].some(answer => answer.trim() !== "");
                
                if (!hasAnswer) {
                    questionErrors[question.id] = "필수 응답 항목입니다."
                    missingQuestions.push(question.content)
                }
            }
        })

        if (Object.keys(questionErrors).length > 0) {
            errors.questions = questionErrors
            setMissingRequiredQuestions(missingQuestions)
            setValidationAlert(true)
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

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
            const response = await submitSurveyAnswerForCustomer(surveyId!, answerRequest)

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
            >
                <FormControl required={question.isRequired} error={!!questionError} component="fieldset" fullWidth>
                    <FormLabel component="legend" sx={{ mb: 1, fontWeight: "bold" }}>
                        {question.content}
                        {question.isRequired && (
                            <Typography component="span" color="error" sx={{ ml: 1, fontSize: "0.8rem" }}>
                                (필수)
                            </Typography>
                        )}
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
                                onChange={handleNameChange}
                                fullWidth
                                required
                                error={!!formErrors.name}
                                helperText={formErrors.name}
                            />

                            <TextField
                                label="이메일"
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                fullWidth
                                required
                                error={!!formErrors.email}
                                helperText={formErrors.email}
                            />

                            <TextField
                                label="전화번호"
                                value={phone}
                                onChange={handlePhoneChange}
                                fullWidth
                                required
                                error={!!formErrors.phone}
                                helperText={formErrors.phone}
                                inputProps={{ maxLength: 13 }}
                            />

                            <FormControl required error={!!formErrors.consent}>
                                <FormControlLabel
                                    control={<Checkbox checked={consent} onChange={handleConsentChange} />}
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

