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
    AppBar,
    Toolbar,
    TextField,
    InputAdornment,
    Chip,
    CircularProgress,
    IconButton,
} from "@mui/material"
import { Search, ArrowBack } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { messageApi } from "../services/messageApi"
import { MessageStatus } from "../types/message"
import type { MessageResponse } from "../services/messageApi"

const MessageHistory = () => {
    const navigate = useNavigate()
    const [messages, setMessages] = useState<MessageResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [lastMessageId, setLastMessageId] = useState<number | undefined>(undefined)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const observer = useRef<IntersectionObserver>()
    const [page, setPage] = useState(0)

    const fetchMessages = useCallback(
        async (reset = false) => {
            try {
                if (reset) {
                    setLoading(true)
                    setLastMessageId(undefined)
                } else {
                    setLoadingMore(true)
                }

                const response = await messageApi.getMessages({
                    page: reset ? 0 : page,
                    size: 10,
                })

                if (response.data.success && response.data.data) {
                    const newData = response.data.data.content || []

                    setMessages((prevMessages) => {
                        if (reset) return newData
                        return [...prevMessages, ...newData]
                    })

                    // Update pagination info
                    setHasMore(!response.data.data.last)
                    setPage(response.data.data.number)
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
        },
        [page],
    )

    useEffect(() => {
        fetchMessages(true)
    }, [])

    const lastMessageElementRef = useCallback(
        (node) => {
            if (loading || loadingMore || !hasMore) return
            if (observer.current) observer.current.disconnect()

            observer.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore) {
                        fetchMessages(false)
                    }
                },
                { rootMargin: "100px" },
            )

            if (node) observer.current.observe(node)
        },
        [loading, loadingMore, hasMore, fetchMessages],
    )

    const categoryDisplayNames: Record<string, string> = {
        // [MessageCategory.BIRTHDAY]: "생일 축하",  // MessageCategory is removed
        // [MessageCategory.EXPIRATION]: "계약 만료",
        // [MessageCategory.WELCOME]: "환영 메시지",
    }

    const statusConfig = {
        [MessageStatus.SENT]: { color: "#e8f5e9", textColor: "#2e7d32", label: "전송 완료" },
        [MessageStatus.FAILED]: { color: "#ffebee", textColor: "#c62828", label: "전송 실패" },
        [MessageStatus.PENDING]: { color: "#fff8e1", textColor: "#f57c00", label: "전송 대기" },
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    const formatSendAt = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    }

    const filteredMessages = searchTerm
        ? (Array.isArray(messages) ? messages : []).filter(
            (message) =>
                message.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                message.content?.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        : Array.isArray(messages)
            ? messages
            : []

    // Handle message row click to navigate to detail page
    const handleMessageClick = (messageId: number) => {
        // Remove navigation to detail page
        // navigate(`/message/${messageId}`)
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, mx: "auto", px: { xs: 2, sm: 3, md: 4 } }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        전체 문자 조회
                    </Typography>
                </Box>
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
                                    <TableCell>고객명</TableCell>
                                    <TableCell>연락처</TableCell>
                                    <TableCell>내용</TableCell>
                                    <TableCell>작성 시간</TableCell>
                                    <TableCell>발송 시간</TableCell>
                                    <TableCell>발송 상태</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredMessages.length > 0 ? (
                                    filteredMessages.map((message, index) => (
                                        <TableRow
                                            key={message.id}
                                            onClick={() => handleMessageClick(message.id)}
                                            ref={!searchTerm && index === filteredMessages.length - 1 ? lastMessageElementRef : null}
                                        >
                                            <TableCell>{message.customerName}</TableCell>
                                            <TableCell>{message.customerPhone || "-"}</TableCell>
                                            <TableCell>{message.content}</TableCell>
                                            <TableCell>20{message.createdAt}</TableCell>
                                            <TableCell>{formatSendAt(message.sendAt)}</TableCell>
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
                                        <TableCell colSpan={5} align="center">
                                            전송된 문자가 없습니다.
                                        </TableCell>
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

