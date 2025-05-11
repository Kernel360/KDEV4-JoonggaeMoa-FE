import React, {useCallback, useEffect, useRef, useState} from "react"
import {
    Box,
    Chip,
    CircularProgress,
    Container,
    Grid,
    IconButton,
    InputAdornment,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material"
import {ArrowBack, Search} from "@mui/icons-material"
import {useNavigate} from "react-router-dom"
import type {MessageResponse} from "@/domain/message/services/messageApi"
import {messageApi} from "@/domain/message/services/messageApi"
import {MessageStatus} from "@/domain/message/types/message"

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
    const [selectedMessage, setSelectedMessage] = useState<MessageResponse | null>(null)

    const fetchMessages = useCallback(
        async (reset = false) => {
            try {
                if (reset) {
                    setLoading(true)
                    setLastMessageId(undefined)
                    setPage(0) // Reset page when refreshing
                } else {
                    setLoadingMore(true)
                }

                const response = await messageApi.getMessages({
                    page: reset ? 0 : page + 1, // Increment page number for next fetch
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
                    setPage(reset ? 0 : page + 1) // Update page number after successful fetch
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
                {rootMargin: "100px"},
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
        [MessageStatus.SENT]: {color: "#e8f5e9", textColor: "#2e7d32", label: "전송 완료"},
        [MessageStatus.FAILED]: {color: "#ffebee", textColor: "#c62828", label: "전송 실패"},
        [MessageStatus.PENDING]: {color: "#fff8e1", textColor: "#f57c00", label: "전송 대기"},
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

    // Handle message row click to show details
    const handleMessageClick = (message: MessageResponse) => {
        if (selectedMessage && selectedMessage.id === message.id) {
            setSelectedMessage(null)
        } else {
            setSelectedMessage(message)
        }
    }

    return (
        <Box sx={{flexGrow: 1, minHeight: "100vh"}}>
            <Container maxWidth="lg" sx={{mt: 4, mb: 4, mx: "auto", px: {xs: 2, sm: 3, md: 4}}}>
                <Box sx={{display: "flex", alignItems: "center", mb: 3}}>
                    <IconButton onClick={() => navigate(-1)} sx={{mr: 1}}>
                        <ArrowBack/>
                    </IconButton>
                    <Typography variant="h6" sx={{fontWeight: "bold"}}>
                        전체 문자 조회
                    </Typography>
                </Box>
                <Paper elevation={0} sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 2,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
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
                                    <Search/>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Paper>

                {loading ? (
                    <Box sx={{display: "flex", justifyContent: "center", my: 5}}>
                        <CircularProgress/>
                    </Box>
                ) : (
                    <TableContainer component={Paper} elevation={0} sx={{
                        borderRadius: 2,
                        overflow: "hidden",
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{
                                    backgroundColor: '#e9ecef',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <TableCell sx={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: '#003459'
                                    }}>고객명</TableCell>
                                    <TableCell sx={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: '#003459'
                                    }}>전화번호</TableCell>
                                    <TableCell sx={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: '#003459'
                                    }}>내용</TableCell>
                                    <TableCell sx={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: '#003459'
                                    }}>작성 시간</TableCell>
                                    <TableCell sx={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: '#003459'
                                    }}>예약 시간</TableCell>
                                    <TableCell sx={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: '#003459'
                                    }}>상태</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredMessages.length > 0 ? (
                                    filteredMessages.map((message, index) => (
                                        <React.Fragment key={message.id}>
                                            <TableRow
                                                hover
                                                onClick={() => handleMessageClick(message)}
                                                sx={{cursor: "pointer"}}
                                                ref={!searchTerm && index === filteredMessages.length - 1 ? lastMessageElementRef : null}
                                            >
                                                <TableCell>{message.customerName}</TableCell>
                                                <TableCell>{message.customerPhone || "-"}</TableCell>
                                                <TableCell
                                                    sx={{
                                                        maxWidth: "300px",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap"
                                                    }}
                                                >
                                                    {message.content}
                                                </TableCell>
                                                <TableCell>{formatDate(message.createdAt)}</TableCell>
                                                <TableCell>{formatSendAt(message.sendAt)}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={statusConfig[message.sendStatus]?.label || "알 수 없음"}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: message.sendStatus === MessageStatus.SENT ? 'rgba(0, 126, 167, 0.1)' :
                                                                message.sendStatus === MessageStatus.FAILED ? 'rgba(198, 40, 40, 0.1)' :
                                                                    'rgba(245, 124, 0, 0.1)',
                                                            color: message.sendStatus === MessageStatus.SENT ? '#007ea7' :
                                                                message.sendStatus === MessageStatus.FAILED ? '#c62828' :
                                                                    '#f57c00',
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                            {selectedMessage && selectedMessage.id === message.id && (
                                                <TableRow>
                                                    <TableCell colSpan={6} sx={{p: 0}}>
                                                        <Paper elevation={0}
                                                               sx={{p: 3, bgcolor: 'rgba(0, 126, 167, 0.05)'}}>
                                                            <Box sx={{mx: 3}}>
                                                                <Grid container spacing={2}>
                                                                    <Grid size={12}>
                                                                        <Box sx={{
                                                                            display: 'flex',
                                                                            justifyContent: 'space-between',
                                                                            alignItems: 'center',
                                                                            mb: 1
                                                                        }}>
                                                                            <Typography variant="subtitle1"
                                                                                        sx={{fontWeight: 'bold'}}>
                                                                                메시지 상세 정보
                                                                            </Typography>
                                                                            <Chip
                                                                                label={statusConfig[message.sendStatus]?.label || "알 수 없음"}
                                                                                size="small"
                                                                                sx={{
                                                                                    bgcolor: message.sendStatus === MessageStatus.SENT ? 'rgba(0, 126, 167, 0.1)' :
                                                                                        message.sendStatus === MessageStatus.FAILED ? 'rgba(198, 40, 40, 0.1)' :
                                                                                            'rgba(245, 124, 0, 0.1)',
                                                                                    color: message.sendStatus === MessageStatus.SENT ? '#007ea7' :
                                                                                        message.sendStatus === MessageStatus.FAILED ? '#c62828' :
                                                                                            '#f57c00',
                                                                                }}
                                                                            />
                                                                        </Box>
                                                                    </Grid>
                                                                    <Grid
                                                                        size={{
                                                                            xs: 12,
                                                                            sm: 6
                                                                        }}>
                                                                        <Typography variant="body2"
                                                                                    color="text.secondary">
                                                                            작성 시간
                                                                        </Typography>
                                                                        <Typography variant="body1">
                                                                            {formatDate(message.createdAt)}
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid
                                                                        size={{
                                                                            xs: 12,
                                                                            sm: 6
                                                                        }}>
                                                                        <Typography variant="body2"
                                                                                    color="text.secondary">
                                                                            발송 시간
                                                                        </Typography>
                                                                        <Typography variant="body1">
                                                                            {formatSendAt(message.sendAt)}
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid
                                                                        size={{
                                                                            xs: 12,
                                                                            sm: 6
                                                                        }}>
                                                                        <Typography variant="body2"
                                                                                    color="text.secondary">
                                                                            고객명
                                                                        </Typography>
                                                                        <Typography variant="body1">
                                                                            {message.customerName}
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid
                                                                        size={{
                                                                            xs: 12,
                                                                            sm: 6
                                                                        }}>
                                                                        <Typography variant="body2"
                                                                                    color="text.secondary">
                                                                            전화번호
                                                                        </Typography>
                                                                        <Typography variant="body1">
                                                                            {message.customerPhone || "-"}
                                                                        </Typography>
                                                                    </Grid>
                                                                    <Grid size={12}>
                                                                        <Typography variant="body2"
                                                                                    color="text.secondary">
                                                                            메시지 내용
                                                                        </Typography>
                                                                        <Paper
                                                                            elevation={0}
                                                                            sx={{
                                                                                p: 2,
                                                                                mt: 1,
                                                                                bgcolor: "#ffffff",
                                                                                borderRadius: 1,
                                                                            }}
                                                                        >
                                                                            <Typography variant="body1"
                                                                                        sx={{whiteSpace: "pre-wrap"}}>
                                                                                {message.content}
                                                                            </Typography>
                                                                        </Paper>
                                                                    </Grid>
                                                                </Grid>
                                                            </Box>
                                                        </Paper>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{py: 3}}>
                                            <Typography variant="body1">
                                                {searchTerm ? "검색 결과가 없습니다." : "전송된 문자가 없습니다."}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {loadingMore && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{py: 2}}>
                                            <CircularProgress size={24}/>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>
        </Box>
    );
}

export default MessageHistory

