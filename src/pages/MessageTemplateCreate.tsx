"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    AppBar,
    Toolbar,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Snackbar,
    Alert,
    Divider,
    Card,
    CardContent,
    InputAdornment,
} from "@mui/material"
import { ArrowBack, Add, Search, Edit, Delete } from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { messageTemplateApi } from "../services/messageTemplateApi"
import { MessageCategory } from "../types/message"
import type { MessageTemplateResponse } from "../services/messageTemplateApi"

const MessageTemplateCreate = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    // 템플릿 목록 상태 변경
    const [templates, setTemplates] = useState<MessageTemplateResponse[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateResponse | null>(null)

    // 템플릿 편집 상태
    const [templateTitle, setTemplateTitle] = useState("")
    const [templateCategory, setTemplateCategory] = useState<MessageCategory>(MessageCategory.BIRTHDAY)
    const [templateContent, setTemplateContent] = useState("")
    const [previewContent, setPreviewContent] = useState("")

    // 카테고리 표시 이름 매핑
    const categoryDisplayNames: Record<string, string> = {
        [MessageCategory.BIRTHDAY]: "생일",
        [MessageCategory.EXPIRATION]: "계약 만료",
        [MessageCategory.WELCOME]: "신규 회원 가입",
    }

    useEffect(() => {
        // 페이지 로드 시 모든 카테고리의 템플릿 조회
        fetchAllTemplates()
    }, [])

    // 모든 카테고리의 템플릿 조회
    const fetchAllTemplates = async () => {
        try {
            setLoading(true)
            const templatesData: MessageTemplateResponse[] = []
            const agentId = 1 // 실제로는 로그인한 사용자의 ID를 사용

            for (const category of Object.values(MessageCategory)) {
                try {
                    const response = await messageTemplateApi.getMessageTemplate(agentId, category)
                    if (response.data.success && response.data.data) {
                        const template = response.data.data
                        // 템플릿 제목 추가 (백엔드에서 제공하지 않으므로 프론트에서 설정)
                        templatesData.push({
                            ...template,
                            title: categoryDisplayNames[template.category] || template.category,
                        })
                    }
                } catch (error) {
                    console.error(`Failed to fetch template for category ${category}:`, error)
                }
            }

            setTemplates(templatesData)

            // 첫 번째 템플릿이 있으면 선택
            if (templatesData.length > 0) {
                handleTemplateSelect(templatesData[0])
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
        setTemplateTitle(template.title || categoryDisplayNames[template.category] || template.category)
        setTemplateCategory(template.category as MessageCategory)
        setTemplateContent(template.content)
        updatePreview(template.content)
    }

    const handleAddTemplate = () => {
        setSelectedTemplate(null)
        setTemplateTitle("")
        setTemplateCategory(MessageCategory.WELCOME)
        setTemplateContent("")
        updatePreview("")
    }

    const updatePreview = (content: string) => {
        // 실제 미리보기에서는 #{이름} 등의 변수를 실제 값으로 대체
        let preview = content
        preview = preview.replace(/#{이름}/g, "홍길동")
        setPreviewContent(preview)
    }

    const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newContent = e.target.value
        setTemplateContent(newContent)
        updatePreview(newContent)
    }

    const handleSave = async () => {
        if (!templateContent.trim()) {
            setError("템플릿 내용을 입력해주세요.")
            return
        }

        try {
            setLoading(true)
            setError(null)

            const templateData = {
                category: templateCategory,
                content: templateContent,
            }

            const agentId = 1 // 실제로는 로그인한 사용자의 ID를 사용
            const response = await messageTemplateApi.updateMessageTemplate(templateData)

            if (response.data.success) {
                setSuccess(true)

                // 템플릿 목록 업데이트
                setTemplates(templates.map((t) => (t.category === templateCategory ? { ...t, content: templateContent } : t)))

                // 현재 선택된 템플릿 업데이트
                if (selectedTemplate) {
                    setSelectedTemplate({
                        ...selectedTemplate,
                        content: templateContent,
                        category: templateCategory,
                    })
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

    const handleDelete = async () => {
        if (!selectedTemplate) return

        if (!window.confirm("정말로 이 템플릿을 삭제하시겠습니까?")) return

        try {
            setLoading(true)
            setError(null)

            const agentId = 1 // 실제로는 로그인한 사용자의 ID를 사용
            const response = await messageTemplateApi.deleteMessageTemplate(selectedTemplate.category)

            if (response.data.success) {
                setSuccess(true)

                // 템플릿 목록에서 삭제
                const updatedTemplates = templates.filter((t) => t.category !== selectedTemplate.category)
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
        } catch (err: any) {
            console.error("Error deleting template:", err)
            setError(err.response?.data?.error?.message || "템플릿 삭제에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleReset = () => {
        if (selectedTemplate) {
            setTemplateTitle(selectedTemplate.title || "")
            setTemplateCategory(selectedTemplate.category as MessageCategory)
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
            template.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.content?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        문자 템플릿 관리
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                    <IconButton onClick={() => navigate("/message")} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        템플릿 관리
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{ p: 3 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                    템플릿 목록
                                </Typography>
                                <Button startIcon={<Add />} size="small" onClick={handleAddTemplate} sx={{ color: "#1976d2" }}>
                                    추가
                                </Button>
                            </Box>

                            <TextField
                                fullWidth
                                size="small"
                                placeholder="템플릿 검색"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ mb: 2 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search fontSize="small" />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Box sx={{ maxHeight: "500px", overflow: "auto" }}>
                                {filteredTemplates.map((template) => (
                                    <Card
                                        key={template.category}
                                        variant="outlined"
                                        sx={{
                                            mb: 1,
                                            cursor: "pointer",
                                            bgcolor: selectedTemplate?.category === template.category ? "#f0f7ff" : "white",
                                            border:
                                                selectedTemplate?.category === template.category ? "1px solid #1976d2" : "1px solid #e0e0e0",
                                        }}
                                        onClick={() => handleTemplateSelect(template)}
                                    >
                                        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                                                    {template.title || categoryDisplayNames[template.category] || template.category}
                                                </Typography>
                                                <Box>
                                                    <IconButton
                                                        size="small"
                                                        sx={{ p: 0.5 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleTemplateSelect(template)
                                                        }}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        sx={{ p: 0.5 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setSelectedTemplate(template)
                                                            handleDelete()
                                                        }}
                                                    >
                                                        <Delete fontSize="small" />
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
                                    <Box sx={{ p: 2, textAlign: "center", bgcolor: "#f9f9f9", borderRadius: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {searchTerm ? "검색 결과가 없습니다." : "등록된 템플릿이 없습니다."}
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Paper elevation={0} sx={{ p: 3 }}>
                            <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: "bold" }}>
                                {selectedTemplate ? "템플릿 수정" : "새 템플릿 작성"}
                            </Typography>

                            <TextField
                                fullWidth
                                label="템플릿 제목"
                                value={templateTitle}
                                onChange={(e) => setTemplateTitle(e.target.value)}
                                placeholder="템플릿 제목을 입력하세요"
                                sx={{ mb: 3 }}
                                InputProps={{
                                    readOnly: true, // 제목은 카테고리에 따라 자동으로 설정되므로 읽기 전용으로 설정
                                }}
                            />

                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel>카테고리</InputLabel>
                                <Select
                                    value={templateCategory}
                                    label="카테고리"
                                    onChange={(e) => setTemplateCategory(e.target.value as MessageCategory)}
                                    disabled={!!selectedTemplate} // 선택된 템플릿이 있으면 카테고리 변경 불가
                                >
                                    {Object.values(MessageCategory).map((category) => (
                                        <MenuItem key={category} value={category}>
                                            {categoryDisplayNames[category] || category}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                                템플릿 내용
                            </Typography>
                            <TextField
                                fullWidth
                                multiline
                                rows={8}
                                value={templateContent}
                                onChange={handleContentChange}
                                placeholder="템플릿 내용을 입력하세요. (고객명은 #{이름}으로 입력하세요.)"
                                sx={{ mb: 3 }}
                            />
                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <Typography variant="caption" color="textSecondary">
                                    {templateContent.length}/90자
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
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

                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleReset}
                                    sx={{ mr: 1, borderColor: "#ddd", color: "#333" }}
                                    disabled={loading}
                                >
                                    초기화
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleSave}
                                    sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#333" } }}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} /> : "저장하기"}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: "100%" }}>
                    템플릿이 성공적으로 저장되었습니다.
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

export default MessageTemplateCreate

