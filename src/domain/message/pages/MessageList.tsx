import {Add, ArrowBack, History, Search} from "@mui/icons-material"
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from "@mui/material"
import React, {useCallback, useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"

import type {ReservedMessageResponse} from "@/domain/message/services/messageApi"
import {messageApi} from "@/domain/message/services/messageApi"

const MessageList = () => {
    const navigate = useNavigate()
    const [messages, setMessages] = useState<ReservedMessageResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [searchType, setSearchType] = useState<"name" | "phone">("name")
    const [page, setPage] = useState(0)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [totalElements, setTotalElements] = useState(0)
    const [selectedMessage, setSelectedMessage] = useState<ReservedMessageResponse | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editContent, setEditContent] = useState("")
    const [editSendAtDate, setEditSendAtDate] = useState("")
    const [editSendAtTime, setEditSendAtTime] = useState("")
    const [isEditing, setIsEditing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [byteCount, setByteCount] = useState(0)
    const MAX_BYTES = 90

    const fetchReservedMessages = useCallback(
        async () => {
            try {
                setLoading(true)
                const response = await messageApi.getReservedMessages({
                    page,
                    size: rowsPerPage,
                    searchType,
                    keyword: searchTerm
                })

                if (response.data.success && response.data.data) {
                    setMessages(response.data.data.content || [])
                    setTotalElements(response.data.data.totalElements)
                } else {
                    console.error("API Error:", response.data)
                    setError("예약된 메시지 목록을 불러오는데 실패했습니다.")
                }
            } catch (err) {
                console.error("Error fetching reserved messages:", err)
                setError("예약된 메시지 목록을 불러오는데 실패했습니다.")
            } finally {
                setLoading(false)
            }
        },
        [page, rowsPerPage, searchType, searchTerm],
    )

    useEffect(() => {
        fetchReservedMessages()
    }, [page, rowsPerPage])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(0)
        fetchReservedMessages()
    }

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage)
    }

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10))
        setPage(0)
    }

    // 날짜 포맷팅 함수
    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return "-"
        try {
            const date = new Date(dateString)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, "0")
            const day = String(date.getDate()).padStart(2, "0")
            const hours = String(date.getHours()).padStart(2, "0")
            const minutes = String(date.getMinutes()).padStart(2, "0")
            return `${year}-${month}-${day} ${hours}:${minutes}`
        } catch (error) {
            console.error("Error formatting date:", error)
            return dateString
        }
    }

    // 발송 시간 형식화 함수
    const formatSendAt = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            })
        } catch (e) {
            return dateString
        }
    }

    // Handle message row click to show details
    const handleMessageClick = (message: ReservedMessageResponse) => {
        if (selectedMessage && selectedMessage.id === message.id) {
            setSelectedMessage(null)
        } else {
            setSelectedMessage(message)
            setEditContent(message.content)
            setByteCount(new TextEncoder().encode(message.content).length)

            // Set edit date and time
            if (message.sendAt) {
                const date = new Date(message.sendAt)
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, "0")
                const day = String(date.getDate()).padStart(2, "0")
                const hours = String(date.getHours()).padStart(2, "0")
                const minutes = String(date.getMinutes()).padStart(2, "0")

                setEditSendAtDate(`${year}-${month}-${day}`)
                setEditSendAtTime(`${hours}:${minutes}`)
            }
        }
    }

    const handleEditOpen = () => {
        setEditDialogOpen(true)
    }

    const handleEditClose = () => {
        setEditDialogOpen(false)
    }

    const handleEditSave = async () => {
        if (!selectedMessage) return

        try {
            setIsEditing(true)
            setErrorMessage(null)

            // Check if content exceeds byte limit
            const contentBytes = new TextEncoder().encode(editContent).length
            if (contentBytes > MAX_BYTES) {
                setErrorMessage(`메시지 내용이 ${MAX_BYTES}바이트를 초과할 수 없습니다. (현재: ${contentBytes}바이트)`)
                setIsEditing(false)
                return
            }

            const sendAt = new Date(`${editSendAtDate}T${editSendAtTime}`).toISOString()

            const response = await messageApi.updateMessage(selectedMessage.id, {
                content: editContent,
                sendAt,
            })

            if (response.data.success) {
                setSuccessMessage("메시지가 성공적으로 수정되었습니다.")
                setEditDialogOpen(false)
                fetchReservedMessages()
            } else {
                setErrorMessage(response.data.error?.message || "메시지 수정에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error updating message:", err)
            setErrorMessage(err.response?.data?.error?.message || "메시지 수정에 실패했습니다.")
        } finally {
            setIsEditing(false)
        }
    }

    const handleDeleteOpen = () => {
        setDeleteDialogOpen(true)
    }

    const handleDeleteClose = () => {
        setDeleteDialogOpen(false)
    }

    const handleDeleteConfirm = async () => {
        if (!selectedMessage) return

        try {
            setIsDeleting(true)
            const response = await messageApi.deleteMessage(selectedMessage.id)

            if (response.data.success) {
                setSuccessMessage("메시지가 성공적으로 삭제되었습니다.")
                setDeleteDialogOpen(false)
                setSelectedMessage(null)
                // 삭제 후 메시지 목록 다시 불러오기
                fetchReservedMessages()
            } else {
                setErrorMessage("메시지 삭제에 실패했습니다.")
            }
        } catch (err) {
            console.error("Error deleting message:", err)
            setErrorMessage("메시지 삭제 중 오류가 발생했습니다.")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Box sx={{flexGrow: 1, minHeight: "100vh"}}>
            <Container
                maxWidth="lg"
                sx={{
                    mt: 4,
                    mb: 4,
                    mx: "auto",
                    px: {xs: 2, sm: 3, md: 4},
                }}
            >
                <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3}}>
                    <Box sx={{display: "flex", alignItems: "center"}}>
                        <IconButton onClick={() => navigate("/dashboard")} sx={{mr: 1}}>
                            <ArrowBack/>
                        </IconButton>
                        <Typography variant="h6" sx={{fontWeight: "bold"}}>
                            문자 관리
                        </Typography>
                    </Box>
                    <Box>
                        <Button
                            variant="outlined"
                            sx={{
                                mr: 2,
                                borderColor: "#007ea7",
                                color: "#007ea7",
                                '&:hover': {
                                    borderColor: "#003459",
                                    color: "#003459",
                                    bgcolor: 'rgba(0, 126, 167, 0.08)'
                                }
                            }}
                            onClick={() => navigate("/message/history")}
                            startIcon={<History/>}
                        >
                            전체 문자 조회
                        </Button>
                        <Button
                            variant="outlined"
                            sx={{
                                mr: 2,
                                borderColor: "#007ea7",
                                color: "#007ea7",
                                '&:hover': {
                                    borderColor: "#003459",
                                    color: "#003459",
                                    bgcolor: 'rgba(0, 126, 167, 0.08)'
                                }
                            }}
                            onClick={() => navigate("/message/templates")}
                        >
                            템플릿 관리
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<Add/>}
                            sx={{
                                bgcolor: "#007ea7",
                                "&:hover": {bgcolor: "#003459"},
                            }}
                            onClick={() => navigate("/message/create")}
                        >
                            문자 작성
                        </Button>
                    </Box>
                </Box>

                <Paper elevation={0} sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 2,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                    <form onSubmit={handleSearch}>
                        <Box sx={{display: 'flex', gap: 2}}>
                            <TextField
                                select
                                value={searchType}
                                onChange={(e) => setSearchType(e.target.value as "name" | "phone")}
                                size="small"
                                sx={{width: 120}}
                            >
                                <MenuItem value="name">고객명</MenuItem>
                                <MenuItem value="phone">전화번호</MenuItem>
                            </TextField>
                            <TextField
                                placeholder="검색어를 입력하세요"
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
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{
                                    bgcolor: "#007ea7",
                                    "&:hover": {bgcolor: "#003459"},
                                }}
                            >
                                검색
                            </Button>
                        </Box>
                    </form>
                </Paper>

                {loading ? (
                    <Box sx={{display: "flex", justifyContent: "center", my: 5}}>
                        <CircularProgress/>
                    </Box>
                ) : error ? (
                    <Paper elevation={0} sx={{p: 3, textAlign: "center", borderRadius: 2}}>
                        <Typography color="error">{error}</Typography>
                        <Button variant="contained" sx={{mt: 2}} onClick={() => fetchReservedMessages()}>
                            다시 시도
                        </Button>
                    </Paper>
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
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {messages.length > 0 ? (
                                    messages.map((message, index) => (
                                        <React.Fragment key={message.id || index}>
                                            <TableRow
                                                hover
                                                onClick={() => handleMessageClick(message)}
                                                sx={{cursor: "pointer"}}
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
                                            </TableRow>
                                            {selectedMessage && selectedMessage.id === message.id && (
                                                <TableRow>
                                                    <TableCell colSpan={5} sx={{p: 0}}>
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
                                                                            <Box>
                                                                                <Button
                                                                                    variant="outlined"
                                                                                    size="small"
                                                                                    onClick={handleEditOpen}
                                                                                    sx={{mr: 1}}
                                                                                >
                                                                                    수정
                                                                                </Button>
                                                                                <Button
                                                                                    variant="outlined"
                                                                                    color="error"
                                                                                    size="small"
                                                                                    onClick={handleDeleteOpen}
                                                                                >
                                                                                    삭제
                                                                                </Button>
                                                                            </Box>
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
                                                                            예약 시간
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
                                        <TableCell colSpan={5} align="center" sx={{py: 3}}>
                                            <Typography variant="body1">
                                                {searchTerm ? "검색 결과가 없습니다." : "예약된 문자가 없습니다."}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <TablePagination
                    component="div"
                    count={totalElements}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[10, 25, 50]}
                    labelRowsPerPage="페이지당 행 수:"
                    labelDisplayedRows={({from, to, count}) => `${from}-${to} / ${count}`}
                />
            </Container>
            {/* 수정 다이얼로그 */}
            <Dialog open={editDialogOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
                <DialogTitle>메시지 수정</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{mb: 2}}>메시지 내용과 발송 예정 시간을 수정하세요.</DialogContentText>
                    <Box sx={{display: "flex", gap: 2, mb: 3, mt: 2}}>
                        <TextField
                            label="날짜"
                            type="date"
                            value={editSendAtDate}
                            onChange={(e) => setEditSendAtDate(e.target.value)}
                            InputLabelProps={{shrink: true}}
                            fullWidth
                        />
                        <TextField
                            label="시간"
                            type="time"
                            value={editSendAtTime}
                            onChange={(e) => setEditSendAtTime(e.target.value)}
                            InputLabelProps={{shrink: true}}
                            fullWidth
                        />
                    </Box>
                    <TextField
                        autoFocus
                        multiline
                        rows={6}
                        fullWidth
                        label="메시지 내용"
                        value={editContent}
                        onChange={(e) => {
                            const newContent = e.target.value;
                            const newByteCount = new TextEncoder().encode(newContent).length;

                            // Only update if within byte limit
                            if (newByteCount <= MAX_BYTES) {
                                setEditContent(newContent);
                                setByteCount(newByteCount);
                            }
                        }}
                        variant="outlined"
                        error={byteCount > MAX_BYTES}
                        helperText={`${byteCount}/${MAX_BYTES} 바이트 (${Math.round(byteCount / MAX_BYTES * 100)}%)`}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleEditClose} color="inherit">
                        취소
                    </Button>
                    <Button
                        onClick={handleEditSave}
                        color="primary"
                        variant="contained"
                        disabled={isEditing || !editContent.trim() || !editSendAtDate || !editSendAtTime || byteCount > MAX_BYTES}
                    >
                        {isEditing ? "저장 중..." : "저장"}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
                <DialogTitle>메시지 삭제</DialogTitle>
                <DialogContent>
                    <DialogContentText>이 메시지를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteClose} color="inherit">
                        취소
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={isDeleting}>
                        {isDeleting ? "삭제 중..." : "삭제"}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* 성공 메시지 스낵바 */}
            <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage(null)}>
                <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{width: "100%"}}>
                    {successMessage}
                </Alert>
            </Snackbar>
            {/* 에러 메시지 스낵바 */}
            <Snackbar open={!!errorMessage} autoHideDuration={6000} onClose={() => setErrorMessage(null)}>
                <Alert onClose={() => setErrorMessage(null)} severity="error" sx={{width: "100%"}}>
                    {errorMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default MessageList

