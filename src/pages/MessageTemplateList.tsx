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
    ListItemButton,
    ListItemText,
    TextField,
    CircularProgress,
    Snackbar,
    Alert,
} from "@mui/material"
import { ArrowBack, Edit, Delete, Add } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { messageTemplateApi } from "../services/messageTemplateApi"
import type { MessageTemplateResponse, MessageTemplateRequest } from "../services/messageTemplateApi"

const MessageTemplateList = () => {
    const navigate = useNavigate()
    const [templates, setTemplates] = useState<MessageTemplateResponse[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplateResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // 편집 관련 상태
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState("")
    const [editContent, setEditContent] = useState("")
    const [saveLoading, setSaveLoading] = useState(false)

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        try {
            setLoading(true)
            const response = await messageTemplateApi.getMessageTemplates()

            if (response.data.success) {
                setTemplates(response.data.data || [])
                console.log("cccccccccccccc")

                // 첫 번째 템플릿 선택
                if (response.data.data && response.data.data.length > 0) {
                    setSelectedTemplate(response.data.data[0])
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
        setEditTitle(template.title)
        setEditContent(template.content)
        setIsEditing(false)
    }

    const handleAddNew = () => {
        setSelectedTemplate(null)
        setEditTitle("")
        setEditContent("")
        setIsEditing(true)
    }

    const handleEdit = () => {
        if (selectedTemplate) {
            setEditTitle(selectedTemplate.title)
            setEditContent(selectedTemplate.content)
            setIsEditing(true)
        }
    }

    const handleSave = async () => {
        if (!editTitle.trim() || !editContent.trim()) {
            setError("템플릿 제목과 내용을 모두 입력해주세요.")
            return
        }

        try {
            setSaveLoading(true)

            const templateData: MessageTemplateRequest = {
                title: editTitle,
                content: editContent,
            }

            let response

            if (selectedTemplate) {
                // 기존 템플릿 수정
                response = await messageTemplateApi.updateMessageTemplate(selectedTemplate.id, templateData)
            } else {
                // 새 템플릿 생성
                response = await messageTemplateApi.createMessageTemplate(templateData)
            }

            if (response.data.success) {
                setSuccess(selectedTemplate ? "템플릿이 성공적으로 수정되었습니다." : "템플릿이 성공적으로 생성되었습니다.")
                setIsEditing(false)
                fetchTemplates() // 템플릿 목록 새로고침
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

            const response = await messageTemplateApi.deleteMessageTemplate(selectedTemplate.id)

            if (response.data.success) {
                setSuccess("템플릿이 성공적으로 삭제되었습니다.")
                setSelectedTemplate(null)
                fetchTemplates() // 템플릿 목록 새로고침
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
            setEditTitle(selectedTemplate.title)
            setEditContent(selectedTemplate.content)
        } else {
            setEditTitle("")
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
                                        <ListItemButton
                                            key={template.id}
                                            onClick={() => handleTemplateSelect(template)}
                                            selected={selectedTemplate?.id === template.id}
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
                                            <ListItemText
                                                primary={template.title}
                                                secondary={
                                                    template.content.length > 30 ? `${template.content.substring(0, 30)}...` : template.content
                                                }
                                            />
                                        </ListItemButton>
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
                                    <TextField
                                        fullWidth
                                        label="템플릿 제목"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        placeholder="템플릿 제목을 입력하세요"
                                        sx={{ mb: 3 }}
                                    />

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
                                        제목
                                    </Typography>
                                    <Typography variant="body1" sx={{ mb: 3, p: 2, bgcolor: "#f9f9f9", borderRadius: 1 }}>
                                        {selectedTemplate.title}
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
                sss
            </Box>
        </Box>
    )
}

export default MessageTemplateList

