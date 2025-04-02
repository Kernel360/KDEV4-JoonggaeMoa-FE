"use client"

import type React from "react"
import { SelectChangeEvent } from '@mui/material/Select'

import { useState, useEffect } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    FormControlLabel,
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
    Checkbox,
} from "@mui/material"
import { ArrowBack } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { messageApi } from "../services/messageApi"
import { messageTemplateApi } from "../services/messageTemplateApi"
import { customerApi } from "../services/customerApi"
import { MessageCategory } from "../types/message"
import type { CustomerResponse } from "../services/customerApi"
import type { MessageTemplateResponse } from "../services/messageTemplateApi"

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

const MessageCreate = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // 고객 관련 상태
    const [customers, setCustomers] = useState<CustomerResponse[]>([])
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>([])
    const [customerLoading, setCustomerLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    // 메시지 관련 상태
    const [content, setContent] = useState("")
    const [selectedCategory, setSelectedCategory] = useState<MessageCategory>(MessageCategory.WELCOME)
    const [templates, setTemplates] = useState<MessageTemplateResponse[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState("")

    // 전송 시간 관련 상태
    const [scheduledDate, setScheduledDate] = useState("")
    const [scheduledTime, setScheduledTime] = useState("")

    const [byteCount, setByteCount] = useState(0)

    // 카테고리 표시 이름 매핑
    const categoryDisplayNames: Record<string, string> = {
        [MessageCategory.BIRTHDAY]: "생일 축하",
        [MessageCategory.EXPIRATION]: "계약 만료",
        [MessageCategory.WELCOME]: "환영 메시지",
    }

    useEffect(() => {
        fetchCustomers()
        fetchTemplates()

        // 현재 날짜와 시간으로 초기화
        const now = new Date()
        setScheduledDate(now.toISOString().split("T")[0])
        setScheduledTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`)

        // Initialize byte count
        setByteCount(getByteLength(content))
    }, [])

    const fetchCustomers = async () => {
    try {
        setCustomerLoading(true)
        const response = await customerApi.getCustomers()
        if (response.data.success && response.data.data) {
            setCustomers(response.data.data.content)
        } else {
            setError("고객 목록을 불러오는데 실패했습니다.")
        }
    } catch (err) {
        console.error("Error fetching customers:", err)
        setError("고객 목록을 불러오는데 실패했습니다.")
    } finally {
        setCustomerLoading(false)
    }
}

    const fetchTemplates = async () => {
        try {
            const templatesData: MessageTemplateResponse[] = []

            for (const category of Object.values(MessageCategory)) {
                try {
                    const response = await messageTemplateApi.getMessageTemplate(category)
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
        }
    }

    const handleTemplateChange = async (e: SelectChangeEvent<string>) => {
        const category = e.target.value
        setSelectedTemplate(category)

        if (category) {
            try {
                const response = await messageTemplateApi.getMessageTemplate(category)
                if (response.data.success && response.data.data) {
                    const templateContent = response.data.data.content
                    setContent(templateContent)
                    setByteCount(getByteLength(templateContent))
                    setSelectedCategory(category as MessageCategory)
                }
            } catch (error) {
                console.error("Failed to fetch template content:", error)
            }
        }
    }

    const handleCustomerSelect = (customerId: number) => {
        setSelectedCustomers((prev) => {
            if (prev.includes(customerId)) {
                return prev.filter((id) => id !== customerId)
            } else {
                return [...prev, customerId]
            }
        })
    }

    const handleSelectAll = () => {
        if (selectedCustomers.length === filteredCustomers.length) {
            setSelectedCustomers([])
        } else {
            setSelectedCustomers(filteredCustomers.map((customer) => customer.id))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (selectedCustomers.length === 0) {
            setError("최소 한 명 이상의 고객을 선택해주세요.")
            return
        }

        if (!content.trim()) {
            setError("문자 내용을 입력해주세요.")
            return
        }

        if (byteCount > 90) {
            setError("문자 내용은 최대 90바이트까지 입력 가능합니다.")
            return
        }

        if (!scheduledDate || !scheduledTime) {
            setError("예약 전송 시간을 설정해주세요.")
            return
        }

        try {
            setLoading(true)
            setError(null)

            // 전송 시간 설정
            const sendAt = `${scheduledDate}T${scheduledTime}:00`

            const messageData = {
                content,
                sendAt,
                customerIdList: selectedCustomers,
                category: selectedCategory,
            }

            const response = await messageApi.createMessage(messageData)

            if (response.data.success) {
                setSuccess(true)
                setTimeout(() => {
                    navigate("/message")
                }, 1500)
            } else {
                setError(response.data.error?.message || "문자 전송에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error sending message:", err)
            setError(err.response?.data?.error?.message || "문자 전송에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 검색어로 고객 필터링
    const filteredCustomers = customers.filter(
        (customer) =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer.phone && customer.phone.includes(searchTerm)),
    )

    const [messageContent, setMessageContent] = useState("")
    const [byteLength, setByteLength] = useState(0)

    useEffect(() => {
        setByteLength(getByteLength(messageContent))
    }, [messageContent])

    const handleMessageContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessageContent(event.target.value)
    }

    return (
        <Box component="div" sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        문자 작성
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container
                maxWidth="lg"
                sx={{
                    mt: 4,
                    mb: 4,
                    mx: "auto",
                    px: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                    <IconButton onClick={() => navigate("/message")} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        문자 작성
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={5}>
                            <Paper elevation={0} sx={{ p: 4, borderRadius: 2, height: "100%" }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
                                    고객 선택
                                </Typography>

                                {/* 검색창 */}
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="고객명 또는 전화번호로 검색"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    sx={{ mb: 2 }}
                                />

                                {/* 고객 목록 */}
                                <Box sx={{ border: "1px solid #eee", borderRadius: 1, mb: 2 }}>
                                    <Box sx={{ maxHeight: "300px", overflow: "auto", p: 1 }}>
                                        {customerLoading ? (
                                            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                                                <CircularProgress size={24} />
                                            </Box>
                                        ) : filteredCustomers.length > 0 ? (
                                            filteredCustomers.map((customer) => (
                                                <Box
                                                    component="div"  // 이 부분 추가
                                                    key={customer.id}
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        p: 1,
                                                        borderBottom: "1px solid #f0f0f0",
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={selectedCustomers.includes(customer.id)}
                                                                onChange={() => handleCustomerSelect(customer.id)}
                                                                size="small"
                                                            />
                                                        }
                                                        label={
                                                            <Typography variant="body2">
                                                                {customer.name} ({customer.phone})
                                                            </Typography>
                                                        }
                                                    />
                                                </Box>
                                            ))
                                        ) : (
                                            <Box sx={{ p: 2, textAlign: "center" }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    검색 결과가 없습니다.
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

                                {/* 선택된 고객 수와 전체 선택 버튼 */}
                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {selectedCustomers.length}명 선택됨
                                    </Typography>
                                    <Button size="small" onClick={handleSelectAll} sx={{ color: "#1976d2" }}>
                                        {selectedCustomers.length === filteredCustomers.length ? "전체 해제" : "전체 선택"}
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={7}>
                            <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
                                    메시지 정보
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                            <InputLabel>템플릿 선택</InputLabel>
                                            <Select value={selectedTemplate} label="템플릿 선택" onChange={handleTemplateChange}>
                                                <MenuItem value="">직접 입력</MenuItem>
                                                {templates.map((template) => (
                                                    <MenuItem key={template.category} value={template.category}>
                                                        {categoryDisplayNames[template.category] || template.category}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                <TextField
                                    fullWidth
                                    multiline
                                    rows={6}
                                    label="문자 내용"
                                    value={content}
                                    onChange={(e) => {
                                        const newContent = e.target.value
                                        const newByteCount = getByteLength(newContent)

                                        if (newByteCount <= 90) {
                                            setContent(newContent)
                                            setByteCount(newByteCount)
                                        }
                                    }}
                                    placeholder="문자 내용을 입력하세요"
                                    sx={{ mb: 1 }}
                                    error={byteCount > 90}
                                    helperText={byteCount > 90 ? "최대 90바이트까지 입력 가능합니다." : ""}
                                />

                                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
                                    <Typography variant="caption" color={byteCount > 90 ? "error" : "text.secondary"}>
                                        {byteCount}/90 바이트
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                    발송 예약
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            label="날짜"
                                            value={scheduledDate}
                                            onChange={(e) => setScheduledDate(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="time"
                                            label="시간"
                                            value={scheduledTime}
                                            onChange={(e) => setScheduledTime(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                </Grid>

                                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate("/message")}
                                        sx={{ mr: 1, borderColor: "#ddd", color: "#333" }}
                                        disabled={loading}
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#333" } }}
                                        disabled={loading}
                                    >
                                        {loading ? <CircularProgress size={24} /> : "전송하기"}
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </form>
            </Container>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: "100%" }}>
                    문자가 성공적으로 전송되었습니다.
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

export default MessageCreate

