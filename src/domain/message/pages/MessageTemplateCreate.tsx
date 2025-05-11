import type React from "react"
import {useEffect, useState} from "react"
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Divider,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material"
import {Add, ArrowBack, Delete, Search} from "@mui/icons-material"
import {useNavigate, useParams} from "react-router-dom"
import type {MessageTemplateRequest, MessageTemplateResponse} from "@/domain/message/services/messageTemplateApi"
import {messageTemplateApi} from "@/domain/message/services/messageTemplateApi"

const MessageTemplateCreate = () => {
    const navigate = useNavigate()
    const {id} = useParams<{ id: string }>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [byteCount, setByteCount] = useState(0)

    // 템플릿 목록 상태 변경
    const [templates, setTemplates] = useState<MessageTemplateResponse[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateResponse | null>(null)

    // 템플릿 편집 상태
    const [templateTitle, setTemplateTitle] = useState("")
    const [templateContent, setTemplateContent] = useState("")
    const [previewContent, setPreviewContent] = useState("")

    function getByteLength(str: string): number {
        // Count bytes properly for Korean characters (UTF-8)
        let byteLength = 0
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i)
            if (charCode <= 0x007f) {
                byteLength += 1
            } else if (charCode <= 0x07ff) {
                byteLength += 2
            } else {
                byteLength += 3
            }
        }
        return byteLength
    }

    useEffect(() => {
        // 페이지 로드 시 템플릿 목록 조회
        fetchTemplates()
    }, [])

    // 템플릿 목록 조회
    const fetchTemplates = async () => {
        try {
            setLoading(true)
            const response = await messageTemplateApi.getMessageTemplates()

            if (response.data.success) {
                setTemplates(response.data.data || [])

                // 첫 번째 템플릿이 있으면 선택
                if (response.data.data && response.data.data.length > 0) {
                    handleTemplateSelect(response.data.data[0])
                }
            } else {
                setError("템플릿 목록을 불러오는데 실패했습니다.")
            }
        } catch (error) {
            console.error("Failed to fetch templates:", error)
            setError("템플릿 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleTemplateSelect = (template: MessageTemplateResponse) => {
        setSelectedTemplate(template)
        setTemplateTitle(template.title)
        setTemplateContent(template.content)
        setByteCount(getByteLength(template.content))
        updatePreview(template.content)
    }

    const handleAddTemplate = () => {
        // Check if the maximum number of templates (10) has been reached
        if (templates.length >= 10) {
            setError("템플릿은 최대 10개까지만 생성할 수 있습니다.")
            return
        }

        // Create a temporary empty template with a temporary ID
        const tempId = Date.now() // Use timestamp as temporary ID
        const emptyTemplate: MessageTemplateResponse = {
            id: tempId,
            title: "새 템플릿",
            content: ""
        }

        // Add the empty template to the list
        setTemplates([...templates, emptyTemplate])

        // Select the new empty template
        setSelectedTemplate(emptyTemplate)
        setTemplateTitle("")
        setTemplateContent("")
        setByteCount(0)
        updatePreview("")
    }

    const updatePreview = (content: string) => {
        // 실제 미리보기에서는 ${이름} 등의 변수를 실제 값으로 대체
        let preview = content
        preview = preview.replace(/\${이름}/g, "홍길동")
        setPreviewContent(preview)
    }

    const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newContent = e.target.value
        const newByteCount = getByteLength(newContent)

        if (newByteCount <= 90) {
            setTemplateContent(newContent)
            setByteCount(newByteCount)
            updatePreview(newContent)
        }
    }

    const handleSave = async () => {
        if (!templateTitle.trim()) {
            setError("템플릿 제목을 입력해주세요.")
            return
        }

        if (!templateContent.trim()) {
            setError("템플릿 내용을 입력해주세요.")
            return
        }

        if (byteCount > 90) {
            setError("템플릿 내용은 최대 90바이트까지 입력 가능합니다.")
            return
        }

        // Check if the maximum number of templates (10) has been reached when creating a new template
        if (!selectedTemplate && templates.length >= 10) {
            setError("템플릿은 최대 10개까지만 생성할 수 있습니다.")
            return
        }

        try {
            setLoading(true)
            setError(null)

            const templateData: MessageTemplateRequest = {
                title: templateTitle,
                content: templateContent,
            }

            let response
            let savedTemplateId: number | null = null

            if (selectedTemplate) {
                // Check if this is a temporary template (created with handleAddTemplate)
                const isTemporaryTemplate = templates.some(t => t.id === selectedTemplate.id && t.title === "새 템플릿" && t.content === "")

                if (isTemporaryTemplate) {
                    // Create a new template instead of updating
                    response = await messageTemplateApi.createMessageTemplate(templateData)
                    // Get the ID of the newly created template from the response
                    if (response.data.success && response.data.data) {
                        savedTemplateId = response.data.data.id
                    }
                } else {
                    // 기존 템플릿 수정
                    response = await messageTemplateApi.updateMessageTemplate(selectedTemplate.id, templateData)
                    savedTemplateId = selectedTemplate.id
                }
            } else {
                // 새 템플릿 생성
                response = await messageTemplateApi.createMessageTemplate(templateData)
                // Get the ID of the newly created template from the response
                if (response.data.success && response.data.data) {
                    savedTemplateId = response.data.data.id
                }
            }

            if (response.data.success) {
                setSuccess(true)

                // Fetch templates and maintain focus on the saved template
                const templatesResponse = await messageTemplateApi.getMessageTemplates()
                if (templatesResponse.data.success) {
                    const updatedTemplates = templatesResponse.data.data || []
                    setTemplates(updatedTemplates)

                    // Find the saved template and select it
                    if (savedTemplateId) {
                        const savedTemplate = updatedTemplates.find(t => t.id === savedTemplateId)
                        if (savedTemplate) {
                            handleTemplateSelect(savedTemplate)
                        }
                    }
                }
            } else {
                setError(response.data.error?.message || "템플릿 저장에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error saving template:", err)
            setError(err.response?.data?.error?.message || "템플릿 저장에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (templateToDelete?: MessageTemplateResponse) => {
        // Use the passed template or the currently selected template
        const templateToRemove = templateToDelete || selectedTemplate

        if (!templateToRemove) return

        if (!window.confirm("정말로 이 템플릿을 삭제하시겠습니까?")) return

        try {
            setLoading(true)
            setError(null)

            // Check if this is a temporary template (created with handleAddTemplate)
            const isTemporaryTemplate = templates.some(t => t.id === templateToRemove.id && t.title === "새 템플릿" && t.content === "")

            if (isTemporaryTemplate) {
                // Just remove the temporary template from the list
                const updatedTemplates = templates.filter((t) => t.id !== templateToRemove.id)
                setTemplates(updatedTemplates)

                // Select another template or reset
                if (updatedTemplates.length > 0) {
                    handleTemplateSelect(updatedTemplates[0])
                } else {
                    setSelectedTemplate(null)
                    setTemplateTitle("")
                    setTemplateContent("")
                    updatePreview("")
                }

                setSuccess(true)
            } else {
                // Delete the template from the server
                const response = await messageTemplateApi.deleteMessageTemplate(templateToRemove.id)

                if (response.data.success) {
                    setSuccess(true)

                    // 템플릿 목록에서 삭제
                    const updatedTemplates = templates.filter((t) => t.id !== templateToRemove.id)
                    setTemplates(updatedTemplates)

                    // 다른 템플릿 선택 또는 초기화
                    if (updatedTemplates.length > 0) {
                        handleTemplateSelect(updatedTemplates[0])
                    } else {
                        handleAddTemplate()
                    }
                } else {
                    setError(response.data.error?.message || "템플릿 삭제에 실패했습니다.")
                }
            }
        } catch (err: any) {
            console.error("Error deleting template:", err)
            setError(err.response?.data?.error?.message || "템플릿 삭제에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        if (selectedTemplate) {
            setTemplateTitle(selectedTemplate.title)
            setTemplateContent(selectedTemplate.content)
            updatePreview(selectedTemplate.content)
        } else {
            setTemplateTitle("")
            setTemplateContent("")
            updatePreview("")
        }
    }

    // 검색어로 템플릿 필터링
    const filteredTemplates = templates.filter(
        (template) =>
            template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.content.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    return (
        <Box sx={{flexGrow: 1, minHeight: "100vh"}}>
            <Container maxWidth="lg" sx={{mt: 4, mb: 4}}>
                <Box sx={{display: "flex", alignItems: "center", mb: 4}}>
                    <IconButton onClick={() => navigate("/message")} sx={{mr: 1}}>
                        <ArrowBack/>
                    </IconButton>
                    <Typography variant="h6" sx={{fontWeight: "bold"}}>
                        템플릿 관리
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid
                        size={{
                            xs: 12,
                            md: 4
                        }}>
                        <Paper elevation={0} sx={{p: 3}}>
                            <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2}}>
                                <Typography variant="subtitle1" sx={{fontWeight: "bold"}}>
                                    템플릿 목록
                                </Typography>
                                <Box sx={{display: "flex", alignItems: "center"}}>
                                    <Typography variant="caption" color="textSecondary" sx={{mr: 1}}>
                                        {templates.length}/10
                                    </Typography>
                                    <Button startIcon={<Add/>} size="small" onClick={handleAddTemplate}
                                            sx={{color: "#1976d2"}}>
                                        추가
                                    </Button>
                                </Box>
                            </Box>

                            <TextField
                                fullWidth
                                size="small"
                                placeholder="템플릿 검색"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{mb: 2}}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small"/>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Box sx={{maxHeight: "600px", overflow: "auto"}}>
                                {filteredTemplates.map((template) => (
                                    <Card
                                        key={template.id}
                                        variant="outlined"
                                        sx={{
                                            mb: 1,
                                            cursor: "pointer",
                                            bgcolor: selectedTemplate?.id === template.id ? "#f0f7ff" : "white",
                                            border: selectedTemplate?.id === template.id ? "1px solid #1976d2" : "1px solid #e0e0e0",
                                        }}
                                        onClick={() => handleTemplateSelect(template)}
                                    >
                                        <CardContent sx={{p: 2, "&:last-child": {pb: 2}}}>
                                            <Box sx={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center"
                                            }}>
                                                <Typography variant="subtitle2" sx={{fontWeight: "bold"}}>
                                                    {template.title}
                                                </Typography>
                                                <Box>
                                                    <IconButton
                                                        size="small"
                                                        sx={{p: 0.5}}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            // Don't set the selected template here, just pass the template directly
                                                            handleDelete(template)
                                                        }}
                                                    >
                                                        <Delete fontSize="small"/>
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    mt: 0.5,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    display: "-webkit-box",
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: "vertical",
                                                }}
                                            >
                                                {template.content}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                ))}

                                {filteredTemplates.length === 0 && (
                                    <Box sx={{p: 2, textAlign: "center", bgcolor: "#f9f9f9", borderRadius: 1}}>
                                        <Typography variant="body2" color="text.secondary">
                                            {searchTerm ? "검색 결과가 없습니다." : "등록된 템플릿이 없습니다."}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid
                        size={{
                            xs: 12,
                            md: 8
                        }}>
                        <Paper elevation={0} sx={{p: 3}}>
                            <Typography variant="subtitle1" sx={{mb: 3, fontWeight: "bold"}}>
                                {selectedTemplate ? "템플릿 수정" : "새 템플릿 작성"}
                            </Typography>

                            <TextField
                                fullWidth
                                label="템플릿 제목"
                                value={templateTitle}
                                onChange={(e) => setTemplateTitle(e.target.value)}
                                placeholder="템플릿 제목을 입력하세요"
                                sx={{mb: 3}}
                            />

                            <Typography variant="subtitle2" color="textSecondary" sx={{mb: 1}}>
                                템플릿 내용
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={8}
                                value={templateContent}
                                onChange={handleContentChange}
                                placeholder="템플릿 내용을 입력하세요. (고객명은 ${이름}으로 입력하세요.)"
                                sx={{mb: 3}}
                                error={byteCount > 90}
                                helperText={byteCount > 90 ? "최대 90바이트까지 입력 가능합니다." : ""}
                            />
                            <Box sx={{display: "flex", justifyContent: "flex-end"}}>
                                <Typography variant="caption" color={byteCount > 90 ? "error" : "textSecondary"}>
                                    {byteCount}/90 바이트
                                </Typography>
                            </Box>

                            <Divider sx={{my: 3}}/>

                            <Typography variant="subtitle2" color="textSecondary" sx={{mb: 1}}>
                                미리보기
                            </Typography>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    bgcolor: "#f9f9f9",
                                    borderRadius: 1,
                                    minHeight: "100px",
                                    mb: 3,
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {previewContent || "미리보기 내용이 여기에 표시됩니다."}
                            </Paper>

                            <Box sx={{display: "flex", justifyContent: "flex-end"}}>
                                <Button
                                    variant="outlined"
                                    onClick={handleReset}
                                    sx={{mr: 1, borderColor: "#ddd", color: "#333"}}
                                    disabled={loading}
                                >
                                    초기화
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    sx={{bgcolor: "#000", "&:hover": {bgcolor: "#333"}}}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24}/> : "저장하기"}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{width: "100%"}}>
                    {error}
                </Alert>
            </Snackbar>
            <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{width: "100%"}}>
                    템플릿이 성공적으로 저장되었습니다.
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default MessageTemplateCreate

