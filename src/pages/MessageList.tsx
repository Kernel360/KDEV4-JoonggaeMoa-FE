"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
    CircularProgress,
} from "@mui/material"
import { Search, Add, ArrowBack, History, Edit, Delete } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { messageApi } from "../services/messageApi"
import type { ReservedMessageResponse } from "../services/messageApi"

const MessageList = () => {
    const navigate = useNavigate()
    const [messages, setMessages] = useState<ReservedMessageResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [lastMessageId, setLastMessageId] = useState<number | undefined>(undefined)
    const [hasMore, setHasMore] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const observer = useRef<IntersectionObserver>()
    const [page, setPage] = useState(0)

    const fetchReservedMessages = useCallback(
        async (reset = false) => {
            try {
                if (reset) {
                    setLoading(true)
                    setLastMessageId(undefined)
                } else {
                    setLoadingMore(true)
                }

                const response = await messageApi.getReservedMessages({
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
                    console.error("API Error:", response.data)
                    setError("예약된 메시지 목록을 불러오는데 실패했습니다.")
                }
            } catch (err) {
                console.error("Error fetching reserved messages:", err)
                setError("예약된 메시지 목록을 불러오는데 실패했습니다.")
            } finally {
                setLoading(false)
                setLoadingMore(false)
            }
        },
        [page],
    )

    useEffect(() => {
        fetchReservedMessages(true)
    }, [])

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
    const filteredMessages = Array.isArray(messages)
        ? messages.filter(
            (message) =>
                message.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                message.content?.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        : []

    // lastMessageElementRef 수정 - 화면에 마지막 요소가 보일 때 다음 페이지 로드
    const lastMessageElementRef = useCallback(
        (node) => {
            if (loading || loadingMore) return
            if (observer.current) observer.current.disconnect()

            observer.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore) {
                        fetchReservedMessages(false)
                    }
                },
                {
                    rootMargin: "100px", // Load earlier before user reaches the bottom
                },
            )

            if (node) observer.current.observe(node)
        },
        [loading, loadingMore, hasMore, fetchReservedMessages],
    )

    // Handle message row click to navigate to detail page
    const handleMessageClick = (messageId: number) => {
        navigate(`/message/${messageId}`)
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        예약된 문자 관리
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
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton onClick={() => navigate("/dashboard")} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            예약된 문자 관리
                        </Typography>
                    </Box>
                    <Box>
                        <Button
                            variant="outlined"
                            sx={{ mr: 2, borderColor: "#ddd", color: "#333" }}
                            onClick={() => navigate("/message/history")}
                            startIcon={<History />}
                        >
                            지난 문자 조회
                        </Button>
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

                {loading && !loadingMore ? (
                    <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Paper elevation={0} sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
                        <Typography color="error">{error}</Typography>
                        <Button variant="contained" sx={{ mt: 2 }} onClick={() => fetchReservedMessages(true)}>
                            다시 시도
                        </Button>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: "#f9f9f9" }}>
                                    <TableCell sx={{ fontWeight: 500 }}>예약 시간</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>고객명</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>전화번호</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>내용</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredMessages.length > 0 ? (
                                    filteredMessages.map((message, index) => (
                                        <TableRow
                                            key={message.id || index}
                                            hover
                                            onClick={() => handleMessageClick(message.id)}
                                            sx={{ cursor: "pointer" }}
                                            ref={filteredMessages.length === index + 1 && !searchTerm ? lastMessageElementRef : null}
                                        >
                                            <TableCell>{formatDate(message.sendAt)}</TableCell>
                                            <TableCell>{message.customerName}</TableCell>
                                            <TableCell>{message.customerPhone || "-"}</TableCell>
                                            <TableCell
                                                sx={{ maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                                            >
                                                {message.content}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1">
                                                {searchTerm ? "검색 결과가 없습니다." : "예약된 문자가 없습니다."}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {loadingMore && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 2 }}>
                                            <CircularProgress size={24} />
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

