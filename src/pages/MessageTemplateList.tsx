"use client"

import { useState, useEffect } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Button,
    IconButton,
    AppBar,
    Toolbar,
    List,
    ListItem,
    ListItemText,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Snackbar,
    Alert,
} from "@mui/material"
import { ArrowBack, Edit, Delete, Add } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { messageTemplateApi } from "../services/messageTemplateApi"
import { MessageCategory } from "../types/message"
import type { MessageTemplateResponse } from "../services/messageTemplateApi"

const MessageTemplateList = () => {
    const navigate = useNavigate()
    const [templates, setTemplates] = useState<MessageTemplateResponse[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // 편집 관련 상태
    const [isEditing, setIsEditing] = useState(false)
    const [editCategory, setEditCategory] = useState<MessageCategory>(MessageCategory.WELCOME)
    const [editContent, setEditContent] = useState("")
    const [saveLoading, setSaveLoading] = useState(false)

    // 카테고리 표시 이름 매핑
    const categoryDisplayNames: Record<string, string> = {
        [MessageCategory.BIRTHDAY]: "생일 축하",
        [MessageCategory.EXPIRATION]: "계약 만료",
        [MessageCategory.WELCOME]: "환영 메시지",
    }

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        try {
            setLoading(true)
            const templatesData: MessageTemplateResponse[] = []

            for (const category of Object.values(MessageCategory)) {
                try {
                    const response = await messageTemplateApi.getMessageTemplate(1, category)
                    if (response.data.success && response.data.data) {
                        templatesData.push(response.data.data)
                    }
                } catch (error) {
                    console.error(`Failed to fetch template for category ${category}:`, error)
                }
            }

            setTemplates(templatesData)
        } catch (error) {
            console.error("Failed to fetch templates:", error)
            setError("템플릿 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleTemplateSelect = (template: MessageTemplateResponse) => {
        setSelectedTemplate(template)
        setEditCategory(template.category as MessageCategory)
        setEditContent(template.content)
        setIsEditing(false)
    }

    const handleAddNew = () => {
        setSelectedTemplate(null)
        setEditCategory(MessageCategory.WELCOME)
        setEditContent("")
        setIsEditing(true)
    }

    const handleEdit = () => {
        if (selectedTemplate) {
            setEditCategory(selectedTemplate.category as MessageCategory)
            setEditContent(selectedTemplate.content)
            setIsEditing(true)
        }
    }

    const handleSave = async () => {
        if (!editContent.trim()) {
            setError("템플릿 내용을 입력해주세요.")
            return
        }

        try {
            setSaveLoading(true)

            const templateData = {
                category: editCategory,
                content: editContent,
            }

            const response = await messageTemplateApi.updateMessageTemplate(templateData)

            if (response.data.success) {
                setSuccess("템플릿이 성공적으로 저장되었습니다.")
                setIsEditing(false)
                fetchTemplates()

                // 현재 편집 중인 템플릿을 선택된 템플릿으로 설정
                setSelectedTemplate({
                    category: editCategory,
                    content: editContent,
                })
            } else {
                setError(response.data.error?.message || "템플릿 저장에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error saving template:", err)
            setError(err.response?.data?.error?.message || "템플릿 저장에 실패했습니다.")
        } finally {
            setSaveLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedTemplate) return

        if (!window.confirm("정말로 이 템플릿을 삭제하시겠습니까?")) return

        try {
            setSaveLoading(true)

            const response = await messageTemplateApi.deleteMessageTemplate(selectedTemplate.category)

            if (response.data.success) {
                setSuccess("템플릿이 성공적으로 삭제되었습니다.")
                setSelectedTemplate(null)
                fetchTemplates()
            } else {
                setError(response.data.error?.message || "템플릿 삭제에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error deleting template:", err)
            setError(err.response?.data?.error?.message || "템플릿 삭제에 실패했습니다.")
        } finally {
            setSaveLoading(false)
        }
    }

    const handleCancel = () => {
        if (selectedTemplate) {
            setEditCategory(selectedTemplate.category as MessageCategory)
            setEditContent(selectedTemplate.content)
        } else {
            setEditCategory(MessageCategory.WELCOME)
            setEditContent("")
        }
        setIsEditing(false)
    }

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
                        문자 템플릿 관리
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={0} sx={{ p: 3 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                    템플릿 목록
                                </Typography>
                                <Button startIcon={<Add />} size="small" onClick={handleAddNew} sx={{ color: "#1976d2" }}>
                                    새 템플릿
                                </Button>
                            </Box>

                            {loading ? (
                                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                                    <CircularProgress />
                                </Box>
                            ) : templates.length > 0 ? (
                                <List sx={{ bgcolor: "#f9f9f9", borderRadius: 1 }}>
                                    {templates.map((template) => (
                                        <ListItem
                                            key={template.category}
                                            button
                                            selected={selectedTemplate?.category === template.category}
                                            onClick={() => handleTemplateSelect(template)}
                                            sx={{
                                                borderRadius: 1,
                                                mb: 0.5,
                                                "&.Mui-selected": {
                                                    bgcolor: "#e3f2fd",
                                                    "&:hover": {
                                                        bgcolor: "#e3f2fd",
                                                    },
                                                },
                                            }}
                                        >
                                            <ListItemText primary={categoryDisplayNames[template.category] || template.category} />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ p: 3, textAlign: "center", bgcolor: "#f9f9f9", borderRadius: 1 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        등록된 템플릿이 없습니다.
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Paper elevation={0} sx={{ p: 3 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                                    템플릿 상세
                                </Typography>
                                {selectedTemplate && !isEditing && (
                                    <Box>
                                        <Button startIcon={<Edit />} onClick={handleEdit} sx={{ mr: 1 }}>
                                            수정
                                        </Button>
                                        <Button startIcon={<Delete />} color="error" onClick={handleDelete}>
                                            삭제
                                        </Button>
                                    </Box>
                                )}
                            </Box>

                            {isEditing ? (
                                <Box>
                                    <FormControl fullWidth sx={{ mb: 3 }}>
                                        <InputLabel>카테고리</InputLabel>
                                        <Select
                                            value={editCategory}
                                            label="카테고리"
                                            onChange={(e) => setEditCategory(e.target.value as MessageCategory)}
                                        >
                                            {Object.values(MessageCategory).map((category) => (
                                                <MenuItem key={category} value={category}>
                                                    {categoryDisplayNames[category] || category}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={8}
                                        label="템플릿 내용"
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        placeholder="템플릿 내용을 입력하세요"
                                        sx={{ mb: 3 }}
                                    />

                                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                        <Button
                                            variant="outlined"
                                            onClick={handleCancel}
                                            sx={{ mr: 1, borderColor: "#ddd", color: "#333" }}
                                            disabled={saveLoading}
                                        >
                                            취소
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={handleSave}
                                            sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#333" } }}
                                            disabled={saveLoading}
                                        >
                                            {saveLoading ? <CircularProgress size={24} /> : "저장"}
                                        </Button>
                                    </Box>
                                </Box>
                            ) : selectedTemplate ? (
                                <Box>
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        카테고리
                                    </Typography>
                                    <Typography variant="body1" sx={{ mb: 3, p: 2, bgcolor: "#f9f9f9", borderRadius: 1 }}>
                                        {categoryDisplayNames[selectedTemplate.category] || selectedTemplate.category}
                                    </Typography>

                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        내용
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            p: 2,
                                            bgcolor: "#f9f9f9",
                                            borderRadius: 1,
                                            minHeight: "200px",
                                            whiteSpace: "pre-wrap",
                                        }}
                                    >
                                        {selectedTemplate.content}
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{ p: 5, textAlign: "center", bgcolor: "#f9f9f9", borderRadius: 1 }}>
                                    <Typography variant="body1" color="textSecondary">
                                        템플릿을 선택하거나 새 템플릿을 추가하세요.
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
                <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: "100%" }}>
                    {success}
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

export default MessageTemplateList

