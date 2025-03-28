"use client"

import { useState, useEffect } from "react"
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
    AppBar,
    Toolbar,
    TextField,
    InputAdornment,
    Chip,
    CircularProgress,
} from "@mui/material"
import { Search, Add, ArrowBack } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { messageApi } from "../services/messageApi"
import { MessageStatus, MessageCategory } from "../types/message"
import type { MessageResponse } from "../services/messageApi"

const MessageList = () => {
    const navigate = useNavigate()
    const [messages, setMessages] = useState<MessageResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    // 카테고리 표시 이름 매핑
    const categoryDisplayNames: Record<string, string> = {
        [MessageCategory.BIRTHDAY]: "생일 축하",
        [MessageCategory.EXPIRATION]: "계약 만료",
        [MessageCategory.WELCOME]: "환영 메시지",
    }

    // 상태별 칩 색상 및 텍스트
    const statusConfig = {
        [MessageStatus.SENT]: { color: "#e8f5e9", textColor: "#2e7d32", label: "전송 완료" },
        [MessageStatus.FAILED]: { color: "#ffebee", textColor: "#c62828", label: "전송 실패" },
        [MessageStatus.PENDING]: { color: "#fff8e1", textColor: "#f57c00", label: "전송 대기" },
    }

    useEffect(() => {
        fetchMessages()
    }, [])

    const fetchMessages = async () => {
        try {
            setLoading(true)
            const response = await messageApi.getMessages()
            if (response.data.success) {
                setMessages(response.data.data)
            } else {
                setError("메시지 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching messages:", err)
            setError("메시지 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 날짜 형식화 함수
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
            })
        } catch (e) {
            return dateString
        }
    }

    // 검색어로 필터링
    const filteredMessages = messages.filter(
        (message) =>
            message.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            message.content?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        문자 관리
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton onClick={() => navigate("/dashboard")} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            문자 관리
                        </Typography>
                    </Box>
                    <Box>
                        <Button
                            variant="outlined"
                            sx={{ mr: 2, borderColor: "#ddd", color: "#333" }}
                            onClick={() => navigate("/message/templates")}
                        >
                            템플릿 관리
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            sx={{
                                bgcolor: "#000",
                                "&:hover": { bgcolor: "#333" },
                            }}
                            onClick={() => navigate("/message/create")}
                        >
                            문자 작성
                        </Button>
                    </Box>
                </Box>

                <Paper elevation={0} sx={{ mb: 3, p: 2 }}>
                    <TextField
                        placeholder="고객명 또는 내용으로 검색"
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
                        <Button variant="contained" sx={{ mt: 2 }} onClick={fetchMessages}>
                            다시 시도
                        </Button>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: "#f9f9f9" }}>
                                    <TableCell>날짜</TableCell>
                                    <TableCell>고객명</TableCell>
                                    <TableCell>전화번호</TableCell>
                                    <TableCell>내용</TableCell>
                                    <TableCell>상태</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredMessages.length > 0 ? (
                                    filteredMessages.map((message) => (
                                        <TableRow key={message.id} hover>
                                            <TableCell>{formatDate(message.createdAt)}</TableCell>
                                            <TableCell>{message.customerName}</TableCell>
                                            <TableCell>{message.customerPhone || "-"}</TableCell>
                                            <TableCell
                                                sx={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                            >
                                                {message.content}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={statusConfig[message.sendStatus]?.label || "알 수 없음"}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: statusConfig[message.sendStatus]?.color || "#f5f5f5",
                                                        color: statusConfig[message.sendStatus]?.textColor || "#757575",
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1">
                                                {searchTerm ? "검색 결과가 없습니다." : "등록된 문자가 없습니다."}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>

            <Box sx={{ bgcolor: "#fff", p: 2, textAlign: "center", mt: 4 }}>
                <Typography variant="caption" color="textSecondary">
                    © 2024 Customer Management System. All rights reserved.
                </Typography>
            </Box>
        </Box>
    )
}

export default MessageList

