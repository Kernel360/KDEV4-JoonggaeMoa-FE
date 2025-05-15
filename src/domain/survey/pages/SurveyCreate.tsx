import {Add, ArrowBack, Delete, DragIndicator} from "@mui/icons-material"
import {
    Alert,
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
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Radio,
    Select,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material"
import {useState} from "react"
import {useNavigate} from "react-router-dom"

import {surveyApi} from "@/domain/survey/services/surveyApi"
import type {QuestionCreateRequest, SurveyCreateRequest} from "@/domain/survey/types/survey"

const SurveyCreate = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [validationErrors, setValidationErrors] = useState<{
        title?: string;
        questions?: { [key: number]: string };
        options?: { [key: string]: string[] };
    }>({})
    const [isSubmitted, setIsSubmitted] = useState(false)

    // 설문 기본 정보
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")

    // 질문 목록
    const [questions, setQuestions] = useState<QuestionCreateRequest[]>([
        {
            content: "",
            type: "RADIO",
            isRequired: false,
            options: ["", ""],
        },
    ])

    // 질문 추가
    const handleAddQuestion = () => {
        setQuestions([
            ...questions,
            {
                content: "",
                type: "RADIO",
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

    // 실시간 유효성 검사 함수
    const validateField = (field: string, value: any, index?: number) => {
        const newErrors = {...validationErrors}

        if (field === 'title') {
            if (!value.trim()) {
                newErrors.title = "설문 제목을 입력해주세요."
            } else {
                delete newErrors.title
            }
        } else if (field === 'question' && typeof index === 'number') {
            if (!newErrors.questions) {
                newErrors.questions = {}
            }

            if (!value.trim()) {
                newErrors.questions[index] = "질문 내용을 입력해주세요."
            } else {
                delete newErrors.questions[index]
                if (Object.keys(newErrors.questions).length === 0) {
                    delete newErrors.questions
                }
            }
        } else if (field === 'option' && typeof index === 'number') {
            const questionIndex = Math.floor(index / 100)
            const optionIndex = index % 100

            if (!newErrors.options) {
                newErrors.options = {}
            }

            if (!newErrors.options[`${questionIndex}`]) {
                newErrors.options[`${questionIndex}`] = []
            }

            // 빈 옵션 검사
            const emptyOptionIndex = newErrors.options[`${questionIndex}`].indexOf(`옵션 ${optionIndex + 1}`)
            if (!value.trim()) {
                if (emptyOptionIndex === -1) {
                    newErrors.options[`${questionIndex}`].push(`옵션 ${optionIndex + 1}`)
                }
            } else {
                if (emptyOptionIndex !== -1) {
                    newErrors.options[`${questionIndex}`].splice(emptyOptionIndex, 1)
                }
            }

            // 중복 옵션 검사
            const duplicateIndex = newErrors.options[`${questionIndex}`].indexOf("중복된 선택지가 있습니다")
            if (hasDuplicateOptions(questions[questionIndex].options)) {
                if (duplicateIndex === -1) {
                    newErrors.options[`${questionIndex}`].push("중복된 선택지가 있습니다")
                }
            } else {
                if (duplicateIndex !== -1) {
                    newErrors.options[`${questionIndex}`].splice(duplicateIndex, 1)
                }
            }

            // 옵션 에러가 없으면 해당 질문의 옵션 에러 객체 삭제
            if (newErrors.options[`${questionIndex}`].length === 0) {
                delete newErrors.options[`${questionIndex}`]
            }

            // 모든 옵션 에러가 없으면 options 객체 삭제
            if (Object.keys(newErrors.options).length === 0) {
                delete newErrors.options
            }
        }

        setValidationErrors(newErrors)
    }

    // 제목 변경 핸들러
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value
        setTitle(newTitle)
        validateField('title', newTitle)
    }

    // 질문 내용 변경 핸들러
    const handleQuestionChange = (index: number, field: string, value: any) => {
        const newQuestions = [...questions]

        if (field === 'content') {
            newQuestions[index] = {
                ...newQuestions[index],
                content: value
            }
            validateField('question', value, index)
        } else if (field === 'type') {
            newQuestions[index] = {
                ...newQuestions[index],
                type: value
            }
        } else if (field === 'isRequired') {
            newQuestions[index] = {
                ...newQuestions[index],
                isRequired: value
            }
        }

        setQuestions(newQuestions)
    }

    // 옵션 변경 핸들러
    const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
        const newQuestions = [...questions]
        newQuestions[questionIndex].options[optionIndex] = value
        setQuestions(newQuestions)

        // 옵션 유효성 검사 (questionIndex * 100 + optionIndex를 인덱스로 사용)
        validateField('option', value, questionIndex * 100 + optionIndex)
    }

    // 선택지 추가 핸들러
    const handleAddOption = (questionIndex: number) => {
        const question = questions[questionIndex];
        if (question.type === 'RADIO' || question.type === 'CHECKBOX') {
            // 선택지 개수가 5개 이상이면 추가하지 않음
            if (question.options.length >= 5) {
                setError("선택지는 최대 5개까지만 추가할 수 있습니다.");
                return;
            }

            const updatedQuestions = [...questions];
            updatedQuestions[questionIndex].options.push("");
            setQuestions(updatedQuestions);
        }
    };

    // 옵션 삭제
    const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
        const question = questions[questionIndex];
        // 선택지가 1개 이하면 삭제하지 않음
        if (question.options.length <= 1) {
            setError("선택지는 최소 1개는 유지해야 합니다.");
            return;
        }

        const newQuestions = [...questions];
        newQuestions[questionIndex].options.splice(optionIndex, 1);
        setQuestions(newQuestions);
    };

    // 중복 옵션 검사 함수
    const hasDuplicateOptions = (options: string[]): boolean => {
        const nonEmptyOptions = options.filter((opt) => opt.trim() !== "")
        const uniqueOptions = new Set(nonEmptyOptions)
        return uniqueOptions.size !== nonEmptyOptions.length
    }

    // 옵션 에러 확인 함수
    const hasOptionError = (questionIndex: number, optionIndex: number): boolean => {
        const question = questions[questionIndex];
        const option = question.options[optionIndex];

        // 폼이 제출되었거나 사용자가 상호작용한 경우에만 에러를 표시
        if (!isSubmitted && !option) {
            return false;
        }

        // 빈 선택지 검사
        if (!option.trim()) {
            return true;
        }

        // 중복 선택지 검사
        const nonEmptyOptions = question.options.filter(opt => opt.trim() !== "");
        const uniqueOptions = new Set(nonEmptyOptions);
        return uniqueOptions.size !== nonEmptyOptions.length && option.trim() !== "";
    };

    // 옵션 에러 메시지 함수
    const getOptionErrorMessage = (questionIndex: number, optionIndex: number): string => {
        const question = questions[questionIndex];
        const option = question.options[optionIndex];

        // 폼이 제출되었거나 사용자가 상호작용한 경우에만 에러 메시지를 표시
        if (!isSubmitted && !option) {
            return "";
        }

        // 빈 선택지 검사
        if (!option.trim()) {
            return "선택지를 입력해주세요";
        }

        // 중복 선택지 검사
        const nonEmptyOptions = question.options.filter(opt => opt.trim() !== "");
        const uniqueOptions = new Set(nonEmptyOptions);
        if (uniqueOptions.size !== nonEmptyOptions.length && option.trim() !== "") {
            return "중복된 선택지입니다";
        }

        return "";
    };

    // 유효성 검사 함수
    const validateForm = () => {
        const errors: {
            title?: string;
            questions?: { [key: number]: string };
            options?: { [key: string]: string[] };
        } = {}
        let hasErrors = false

        // 제목 검사
        if (!title.trim()) {
            errors.title = "설문 제목을 입력해주세요."
            hasErrors = true
        }

        // 질문 내용 검사
        const questionErrors: { [key: number]: string } = {}
        questions.forEach((question, index) => {
            if (!question.content.trim()) {
                questionErrors[index] = "질문 내용을 입력해주세요."
                hasErrors = true
            }
        })
        if (Object.keys(questionErrors).length > 0) {
            errors.questions = questionErrors
        }

        // 옵션 검사
        const optionErrors: { [key: string]: string[] } = {}
        questions.forEach((question, index) => {
            if (question.type === "RADIO" || question.type === "CHECKBOX") {
                const emptyOptions: string[] = []
                question.options.forEach((option, optionIndex) => {
                    if (!option.trim()) {
                        emptyOptions.push(`옵션 ${optionIndex + 1}`)
                    }
                })
                if (emptyOptions.length > 0) {
                    optionErrors[`${index}`] = emptyOptions
                    hasErrors = true
                }

                // 중복 옵션 검사
                if (hasDuplicateOptions(question.options)) {
                    if (!optionErrors[`${index}`]) {
                        optionErrors[`${index}`] = []
                    }
                    optionErrors[`${index}`].push("중복된 선택지가 있습니다")
                    hasErrors = true
                }
            }
        })
        if (Object.keys(optionErrors).length > 0) {
            errors.options = optionErrors
        }

        setValidationErrors(errors)
        return !hasErrors
    }

    // 설문 생성 제출
    const handleSubmit = async () => {
        setIsSubmitted(true);  // 폼 제출 상태를 true로 설정

        // 유효성 검사
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true)
            setError(null)

            const surveyData: SurveyCreateRequest = {
                title,
                description,
                questionList: questions,
            }

            const response = await surveyApi.createSurvey(surveyData)

            if (response.data.success) {
                setSuccess(true)
                navigate("/survey")
            } else {
                setError(response.data.error?.message || "설문 생성에 실패했습니다.")
            }
        } catch (err: Error | unknown) {
            console.error("Error creating survey:", err)
            setError(
                (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
                "설문 생성에 실패했습니다."
            )
        } finally {
            setLoading(false)
        }
    }

    // 객관식 질문 렌더링
    const renderOptions = (question: QuestionCreateRequest, questionIndex: number) => {
        if (question.type !== 'RADIO' && question.type !== 'CHECKBOX') return null;

        return (
            <Box sx={{mt: 2, pl: 2}}>
                <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
                    선택지 ({question.options.length}/5)
                </Typography>
                {question.options.map((option, optionIndex) => (
                    <Box key={optionIndex} sx={{display: 'flex', alignItems: 'center', mb: 1}}>
                        {question.type === 'RADIO' ? (
                            <Radio size="small" sx={{mr: 1}}/>
                        ) : (
                            <Checkbox size="small" sx={{mr: 1}}/>
                        )}
                        <TextField
                            fullWidth
                            size="small"
                            value={option}
                            onChange={(e) => handleOptionChange(questionIndex, optionIndex, e.target.value)}
                            error={hasOptionError(questionIndex, optionIndex) || !!validationErrors.options?.[`${questionIndex}`]?.includes(`선택지 ${optionIndex + 1}를 입력해주세요`)}
                            helperText={
                                hasOptionError(questionIndex, optionIndex)
                                    ? getOptionErrorMessage(questionIndex, optionIndex)
                                    : validationErrors.options?.[`${questionIndex}`]?.includes(`선택지 ${optionIndex + 1}를 입력해주세요`)
                                        ? `선택지 ${optionIndex + 1}를 입력해주세요`
                                        : ''
                            }
                            placeholder={`선택지 ${optionIndex + 1}`}
                        />
                        <IconButton
                            size="small"
                            onClick={() => handleRemoveOption(questionIndex, optionIndex)}
                            sx={{ml: 1}}
                            disabled={question.options.length <= 1}
                        >
                            <Delete fontSize="small"/>
                        </IconButton>
                    </Box>
                ))}
                {question.options.length < 5 && (
                    <Button
                        startIcon={<Add/>}
                        onClick={() => handleAddOption(questionIndex)}
                        sx={{mt: 1}}
                    >
                        선택지 추가
                    </Button>
                )}
                {question.options.length >= 5 && (
                    <Typography variant="body2" color="error" sx={{mt: 1}}>
                        선택지는 최대 5개까지만 추가할 수 있습니다.
                    </Typography>
                )}
                {question.options.length <= 1 && (
                    <Typography variant="body2" color="error" sx={{mt: 1}}>
                        선택지는 최소 1개는 유지해야 합니다.
                    </Typography>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{flexGrow: 1, minHeight: "100vh"}}>
            <Container maxWidth="md" sx={{mt: 4, mb: 4, boxShadow: 3}}>
                <Paper elevation={0} sx={{p: 4}}>
                    <Box sx={{display: "flex", alignItems: "center", mb: 4}}>
                        <IconButton onClick={() => navigate("/survey")} sx={{mr: 1}}>
                            <ArrowBack/>
                        </IconButton>
                        <Typography variant="h6" sx={{fontWeight: "bold"}}>
                            새 설문 만들기
                        </Typography>
                    </Box>

                    {/* 설문 기본 정보 */}
                    <Grid container spacing={3} sx={{mb: 4}}>
                        <Grid size={12}>
                            <TextField
                                label="설문 제목"
                                fullWidth
                                value={title}
                                onChange={handleTitleChange}
                                error={!!validationErrors.title}
                                helperText={validationErrors.title}
                                required
                            />
                        </Grid>
                        <Grid size={12}>
                            <TextField
                                label="설문 설명"
                                fullWidth
                                multiline
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{mb: 4}}/>

                    {/* 질문 목록 */}
                    <Typography variant="h6" sx={{mb: 2}}>
                        질문 목록
                    </Typography>

                    {questions.map((question, index) => (
                        <Card key={index}
                              sx={{mb: 3, border: validationErrors.questions?.[index] ? "1px solid #f44336" : "none"}}>
                            <CardContent>
                                <Box sx={{display: "flex", alignItems: "center", mb: 2}}>
                                    <DragIndicator sx={{mr: 1, color: "#888"}}/>
                                    <Typography variant="subtitle1" sx={{flexGrow: 1}}>
                                        질문 {index + 1}
                                    </Typography>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleRemoveQuestion(index)}
                                        disabled={questions.length === 1}
                                    >
                                        <Delete/>
                                    </IconButton>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid size={12}>
                                        <TextField
                                            label="질문 내용"
                                            fullWidth
                                            value={question.content}
                                            onChange={(e) => handleQuestionChange(index, "content", e.target.value)}
                                            error={!!validationErrors.questions?.[index]}
                                            helperText={validationErrors.questions?.[index]}
                                            required
                                        />
                                    </Grid>
                                    <Grid
                                        size={{
                                            xs: 12,
                                            sm: 6
                                        }}>
                                        <FormControl fullWidth>
                                            <InputLabel>질문 유형</InputLabel>
                                            <Select
                                                value={question.type}
                                                label="질문 유형"
                                                onChange={(e) => handleQuestionChange(index, "type", e.target.value)}
                                            >
                                                <MenuItem value="RADIO">객관식 (단일 선택)</MenuItem>
                                                <MenuItem value="CHECKBOX">객관식 (다중 선택)</MenuItem>
                                                <MenuItem value="TEXT">주관식</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid
                                        size={{
                                            xs: 12,
                                            sm: 6
                                        }}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={question.isRequired}
                                                    onChange={(e) => handleQuestionChange(index, "isRequired", e.target.checked)}
                                                />
                                            }
                                            label="필수 응답"
                                        />
                                    </Grid>
                                </Grid>

                                {/* 옵션 목록 (객관식인 경우) */}
                                {renderOptions(question, index)}
                            </CardContent>
                        </Card>
                    ))}

                    <Button variant="outlined" startIcon={<Add/>} onClick={handleAddQuestion} sx={{mb: 4}}>
                        질문 추가
                    </Button>

                    <Divider sx={{my: 3}}/>

                    <Box sx={{display: "flex", justifyContent: "center", mt: 2}}>
                        <Button
                            variant="outlined"
                            sx={{
                                mr: 1, borderColor: "#007ea7", color: "#007ea7",
                                '&:hover': {
                                    borderColor: "#003459",
                                    color: "#003459",
                                    bgcolor: 'rgba(0, 126, 167, 0.08)'
                                }
                            }}
                            onClick={() => navigate("/survey")}
                            disabled={loading}
                        >
                            취소
                        </Button>
                        <Button
                            variant="contained"
                            sx={{bgcolor: "#007ea7", "&:hover": {bgcolor: "#003459"}}}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24}/> : "설문 만들기"}
                        </Button>
                    </Box>
                </Paper>
            </Container>
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{width: "100%"}}>
                    {error}
                </Alert>
            </Snackbar>
            <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{width: "100%"}}>
                    설문이 성공적으로 생성되었습니다. 설문 목록 페이지로 이동합니다.
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default SurveyCreate


