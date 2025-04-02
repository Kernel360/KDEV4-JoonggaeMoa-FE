"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
import { Search, ArrowBack, Schedule } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { messageApi } from "../services/messageApi"
import { MessageStatus, MessageCategory } from "../types/message"
import type { MessageResponse } from "../services/messageApi"

const MessageHistory = () => {
    const navigate = useNavigate()
    const [messages, setMessages] = useState<MessageResponse[]>(() => [])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [pageSize] = useState(10)
    const observer = useRef<IntersectionObserver>()

    const fetchMessages = useCallback(async (currentPage: number = 0) => {
        try {
            if (currentPage === 0) setLoading(true)
            else setLoadingMore(true)

            const response = await messageApi.getMessages({ page: currentPage, size: pageSize })

            if (response.data.success) {
                const responseData = response.data.data
                const newData = Array.isArray(responseData.content) ? responseData.content : []

                setMessages(prevMessages => (currentPage === 0 ? newData : [...prevMessages, ...newData]))
                setHasMore(!responseData.last)
                setPage(currentPage)
            } else {
                setError("메시지 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching messages:", err)
            setError("메시지 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [pageSize])

    useEffect(() => {
        fetchMessages(0)
    }, [fetchMessages])

    const lastMessageElementRef = useCallback(
        (node) => {
            if (loading || loadingMore || !hasMore) return
            if (observer.current) observer.current.disconnect()

            observer.current = new IntersectionObserver(entries => {
                if (entries[0].isIntersecting && hasMore) {
                    fetchMessages(page + 1)
                }
            }, { rootMargin: '100px' })

            if (node) observer.current.observe(node)
        },
        [loading, loadingMore, hasMore, page, fetchMessages]
    )

    const categoryDisplayNames: Record<string, string> = {
        [MessageCategory.BIRTHDAY]: "생일 축하",
        [MessageCategory.EXPIRATION]: "계약 만료",
        [MessageCategory.WELCOME]: "환영 메시지",
    }

    const statusConfig = {
        [MessageStatus.SENT]: { color: "#e8f5e9", textColor: "#2e7d32", label: "전송 완료" },
        [MessageStatus.FAILED]: { color: "#ffebee", textColor: "#c62828", label: "전송 실패" },
        [MessageStatus.PENDING]: { color: "#fff8e1", textColor: "#f57c00", label: "전송 대기" },
    }

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

    const filteredMessages = searchTerm
        ? (Array.isArray(messages) ? messages : []).filter(
            (message) =>
                message.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                message.content?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : Array.isArray(messages) ? messages : []

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        지난 문자 조회
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, mx: "auto", px: { xs: 2, sm: 3, md: 4 } }}>
                <Paper elevation={0} sx={{ mb: 3, p: 3, borderRadius: 2 }}>
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
                ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: "#f9f9f9" }}>
                                    <TableCell>발송 시간</TableCell>
                                    <TableCell>고객명</TableCell>
                                    <TableCell>전화번호</TableCell>
                                    <TableCell>내용</TableCell>
                                    <TableCell>상태</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredMessages.length > 0 ? (
                                    filteredMessages.map((message, index) => (
                                        <TableRow 
                                            key={message.id} 
                                            hover
                                            ref={!searchTerm && index === filteredMessages.length - 1 ? lastMessageElementRef : null}
                                        >
                                            <TableCell>{formatDate(message.createdAt)}</TableCell>
                                            <TableCell>{message.customerName}</TableCell>
                                            <TableCell>{message.customerPhone || "-"}</TableCell>
                                            <TableCell>{message.content}</TableCell>
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
                                        <TableCell colSpan={5} align="center">전송된 문자가 없습니다.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>
        </Box>
    )
}

export default MessageHistory
