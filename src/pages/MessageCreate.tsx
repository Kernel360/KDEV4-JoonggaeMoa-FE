"use client"

import type React from "react"
import type { SelectChangeEvent } from "@mui/material/Select"

import { useState, useEffect, useRef, useCallback } from "react"
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
    FormHelperText,
    InputAdornment,
} from "@mui/material"
import { ArrowBack, InfoOutlined, Search } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { messageApi } from "../services/messageApi"
import { messageTemplateApi } from "../services/messageTemplateApi"
import { customerApi } from "../services/customerApi"
import type { CustomerListResponse } from "../services/customerApi"
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

// 현재 시간에서 30분 후의 시간을 반환하는 함수
function getThirtyMinutesLater(): { date: string; time: string } {
    const now = new Date()
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000) // 30분 추가

    const year = thirtyMinutesLater.getFullYear()
    const month = String(thirtyMinutesLater.getMonth() + 1).padStart(2, "0")
    const day = String(thirtyMinutesLater.getDate()).padStart(2, "0")
    const hours = String(thirtyMinutesLater.getHours()).padStart(2, "0")
    const minutes = String(thirtyMinutesLater.getMinutes()).padStart(2, "0")

    return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
    }
}

// 선택된 시간이 현재 시간으로부터 30분 이후인지 확인하는 함수
function isTimeAtLeastThirtyMinutesLater(date: string, time: string): boolean {
    const now = new Date()
    const selectedTime = new Date(`${date}T${time}:59`)
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000)

    console.log(selectedTime, thirtyMinutesLater)

    return selectedTime >= thirtyMinutesLater
}

const MessageCreate = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // 고객 관련 상태
    const [customers, setCustomers] = useState<{id: number; name: string; phone: string}[]>([])
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>([])
    const [customerLoading, setCustomerLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentSearchTerm, setCurrentSearchTerm] = useState("")
    
    // 무한 스크롤 관련 상태
    const [cursor, setCursor] = useState<number | undefined>(undefined)
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMoreCustomers, setIsLoadingMoreCustomers] = useState(false)
    const observer = useRef<IntersectionObserver | null>(null)
    const lastCustomerRef = useRef<HTMLDivElement | null>(null)

    // 메시지 관련 상태
    const [content, setContent] = useState("")
    const [templates, setTemplates] = useState<MessageTemplateResponse[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState("")
    const [previewContent, setPreviewContent] = useState("")

    // 전송 시간 관련 상태
    const [scheduledDate, setScheduledDate] = useState("")
    const [scheduledTime, setScheduledTime] = useState("")
    const [timeError, setTimeError] = useState(false)

    const [byteCount, setByteCount] = useState(0)

    useEffect(() => {
        fetchCustomers()
        fetchTemplates()

        // 현재 시간에서 30분 후로 초기화
        const { date, time } = getThirtyMinutesLater()
        setScheduledDate(date)
        setScheduledTime(time)

        // Initialize byte count
        setByteCount(getByteLength(content))
    }, [])

    // 시간이 변경될 때마다 유효성 검사
    useEffect(() => {
        if (scheduledDate && scheduledTime) {
            setTimeError(!isTimeAtLeastThirtyMinutesLater(scheduledDate, scheduledTime))
        }
    }, [scheduledDate, scheduledTime])

    // 고객 목록 가져오기
    const fetchCustomers = async (cursorId?: number) => {
        try {
            if (cursorId === undefined) {
                setCustomerLoading(true)
            } else {
                setIsLoadingMoreCustomers(true)
            }
            
            const response = await customerApi.getInfiniteCustomers(cursorId, currentSearchTerm)
            
            if (response.data.success && response.data.data) {
                const newCustomers = response.data.data.content
                
                if (cursorId === undefined) {
                    setCustomers(newCustomers)
                } else {
                    setCustomers(prev => [...prev, ...newCustomers])
                }
                
                // 마지막 고객의 ID를 커서로 설정
                if (newCustomers.length > 0) {
                    setCursor(newCustomers[newCustomers.length - 1].id)
                }
                
                // 더 이상 데이터가 없으면 hasMore를 false로 설정
                setHasMore(!response.data.data.last)
            } else {
                setError("고객 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching customers:", err)
            setError("고객 목록을 불러오는데 실패했습니다.")
        } finally {
            setCustomerLoading(false)
            setIsLoadingMoreCustomers(false)
        }
    }

    // 검색어가 변경될 때마다 고객 목록 초기화
    useEffect(() => {
        setCustomers([])
        setCursor(undefined)
        setHasMore(true)
        fetchCustomers()
    }, [currentSearchTerm])

    // 무한 스크롤을 위한 콜백 함수
    const lastCustomerRefCallback = useCallback((node: HTMLDivElement | null) => {
        if (customerLoading || isLoadingMoreCustomers) return
        
        if (observer.current) observer.current.disconnect()
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                fetchCustomers(cursor)
            }
        })
        
        if (node) observer.current.observe(node)
        lastCustomerRef.current = node
    }, [customerLoading, hasMore, isLoadingMoreCustomers, cursor])

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        setCurrentSearchTerm(searchTerm)
        setCustomers([])
        setCursor(undefined)
        setHasMore(true)
        fetchCustomers()
    }

    const fetchTemplates = async () => {
        try {
            const response = await messageTemplateApi.getMessageTemplates()

            if (response.data.success && response.data.data) {
                setTemplates(response.data.data)
            } else {
                console.error("Failed to fetch templates")
            }
        } catch (error) {
            console.error("Failed to fetch templates:", error)
        }
    }

    const handleTemplateChange = (e: SelectChangeEvent<string>) => {
        const templateId = e.target.value
        setSelectedTemplate(templateId)

        if (templateId) {
            const selectedTemplateObj = templates.find((template) => template.id.toString() === templateId)
            if (selectedTemplateObj) {
                setContent(selectedTemplateObj.content)
                setByteCount(getByteLength(selectedTemplateObj.content))
                updatePreview(selectedTemplateObj.content)
            }
        }
    }

    // 미리보기 업데이트 함수
    const updatePreview = (content: string) => {
        // 실제 미리보기에서는 ${이름} 등의 변수를 실제 값으로 대체
        let preview = content
        preview = preview.replace(/\${이름}/g, "홍길동")
        setPreviewContent(preview)
    }

    // 메시지 내용 변경 시 미리보기 업데이트
    const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newContent = e.target.value
        const newByteCount = getByteLength(newContent)

        if (newByteCount <= 90) {
            setContent(newContent)
            setByteCount(newByteCount)
            updatePreview(newContent)
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

        // 시간이 현재 시간으로부터 30분 이후인지 확인
        if (!isTimeAtLeastThirtyMinutesLater(scheduledDate, scheduledTime)) {
            setError("전송 시간은 현재 시간으로부터 최소 30분 이후로 설정해야 합니다.")
            setTimeError(true)
            return
        }

        try {
            setLoading(true)
            setError(null)

            // 전송 시간 설정
            const sendAt = `${scheduledDate} ${scheduledTime}`

            const messageData = {
                content,
                sendAt,
                customerIdList: selectedCustomers,
            }

            const response = await messageApi.createMessage(messageData)

            if (response.data.success) {
                setSuccess(true)
                navigate("/message")
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

    // 현재 시간 + 10분 이후의 시간으로 재설정하는 함수
    const resetToThirtyMinutesLater = () => {
        const { date, time } = getThirtyMinutesLater()
        setScheduledDate(date)
        setScheduledTime(time)
        setTimeError(false)
    }

    return (
        <Box sx={{ flexGrow: 1, minHeight: "100vh" }}>
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
                            <Paper 
                                elevation={0} 
                                sx={{ 
                                    p: 3, 
                                    borderRadius: 2, 
                                    height: "100%",
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}
                            >
                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold", color: "#00171f" }}>
                                    고객 선택
                                </Typography>

                                {/* 검색창 */}
                                <Box component="div" sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="고객명 또는 전화번호로 검색"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleSearchSubmit(e)
                                            }
                                        }}
                                        sx={{ 
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1,
                                                '&:hover fieldset': {
                                                    borderColor: '#007ea7',
                                                },
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#007ea7',
                                                }
                                            }
                                        }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Search fontSize="small" sx={{ color: '#666' }} />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                    <Button 
                                        variant="contained" 
                                        onClick={handleSearchSubmit}
                                        sx={{ 
                                            bgcolor: "#007ea7", 
                                            "&:hover": { bgcolor: "#003459" },
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        검색
                                    </Button>
                                </Box>

                                {/* 고객 목록 */}
                                <Box 
                                    sx={{ 
                                        border: "1px solid #eee", 
                                        borderRadius: 1, 
                                        mb: 2,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                        maxHeight: "500px", 
                                        overflow: "auto"
                                    }}
                                >
                                    {customerLoading ? (
                                        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                                            <CircularProgress size={24} sx={{ color: '#007ea7' }} />
                                        </Box>
                                    ) : customers.length > 0 ? (
                                        customers.map((customer, index) => (
                                            <Box
                                                component="div"
                                                key={customer.id}
                                                ref={index === customers.length - 1 ? lastCustomerRefCallback : null}
                                                sx={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    p: 1.5,
                                                    borderBottom: "1px solid #f0f0f0",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                    "&:hover": {
                                                        bgcolor: "rgba(0, 126, 167, 0.08)"
                                                    },
                                                    "&:last-child": {
                                                        borderBottom: "none"
                                                    }
                                                }}
                                                onClick={() => handleCustomerSelect(customer.id)}
                                            >
                                                <Checkbox
                                                    checked={selectedCustomers.includes(customer.id)}
                                                    onChange={() => handleCustomerSelect(customer.id)}
                                                    size="small"
                                                    onClick={(e) => e.stopPropagation()}
                                                    sx={{ 
                                                        color: '#007ea7',
                                                        '&.Mui-checked': {
                                                            color: '#007ea7',
                                                        }
                                                    }}
                                                />
                                                <Typography 
                                                    variant="body1" 
                                                    sx={{ 
                                                        ml: 1, 
                                                        fontWeight: 500,
                                                        fontSize: "0.95rem"
                                                    }}
                                                >
                                                    {customer.name} ({customer.phone})
                                                </Typography>
                                            </Box>
                                        ))
                                    ) : (
                                        <Box sx={{ p: 3, textAlign: "center" }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {currentSearchTerm ? "검색 결과가 없습니다." : "고객을 검색해주세요."}
                                            </Typography>
                                        </Box>
                                    )}
                                    
                                    {isLoadingMoreCustomers && (
                                        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                                            <CircularProgress size={20} sx={{ color: '#007ea7' }} />
                                        </Box>
                                    )}
                                </Box>

                                {/* 선택된 고객 수 */}
                                <Box 
                                    sx={{ 
                                        display: "flex", 
                                        justifyContent: "space-between", 
                                        alignItems: "center",
                                        p: 1,
                                        bgcolor: "rgba(0, 126, 167, 0.05)",
                                        borderRadius: 1
                                    }}
                                >
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: "#007ea7" }}>
                                        {selectedCustomers.length}명 선택됨
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={7}>
                            <Paper 
                                elevation={0} 
                                sx={{ 
                                    p: 3, 
                                    borderRadius: 2,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}
                            >
                                <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: "bold", color: "#00171f" }}>
                                    메시지 정보
                                </Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <FormControl 
                                            fullWidth 
                                            size="small" 
                                            sx={{ 
                                                mb: 2,
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 1,
                                                    '&:hover fieldset': {
                                                        borderColor: '#007ea7',
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: '#007ea7',
                                                    }
                                                }
                                            }}
                                        >
                                            <InputLabel>템플릿 선택</InputLabel>
                                            <Select value={selectedTemplate} label="템플릿 선택" onChange={handleTemplateChange}>
                                                <MenuItem value="">직접 입력</MenuItem>
                                                {templates.map((template) => (
                                                    <MenuItem key={template.id} value={template.id.toString()}>
                                                        {template.title}
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
                                    onChange={handleContentChange}
                                    placeholder="문자 내용을 입력하세요. (고객명은 ${이름}으로 입력하세요.)"
                                    sx={{ 
                                        mb: 1,
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 1,
                                            '&:hover fieldset': {
                                                borderColor: '#007ea7',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#007ea7',
                                            }
                                        }
                                    }}
                                    error={byteCount > 90}
                                    helperText={byteCount > 90 ? "최대 90바이트까지 입력 가능합니다." : ""}
                                />

                                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
                                    <Typography variant="caption" color={byteCount > 90 ? "error" : "text.secondary"}>
                                        {byteCount}/90 바이트
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, color: "#00171f" }}>
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
                                        wordBreak: "break-word",
                                        overflowWrap: "break-word",
                                        maxWidth: "100%",
                                        border: "1px solid #eee"
                                    }}
                                >
                                    {previewContent || "미리보기 내용이 여기에 표시됩니다."}
                                </Paper>

                                <Divider sx={{ my: 2 }} />

                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <Typography variant="subtitle1" sx={{ mr: 1, fontWeight: 500, color: "#00171f" }}>
                                        발송 예약
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            bgcolor: "rgba(0, 126, 167, 0.05)",
                                            borderRadius: 1,
                                            px: 1.5,
                                            py: 0.5,
                                            ml: 1,
                                        }}
                                    >
                                        <InfoOutlined fontSize="small" sx={{ mr: 0.5, color: "#007ea7" }} />
                                        <Typography variant="caption" sx={{ color: "#007ea7" }}>
                                            현재 시간으로부터 최소 30분 이후로 설정해야 합니다
                                        </Typography>
                                    </Box>
                                </Box>

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            label="날짜"
                                            value={scheduledDate}
                                            onChange={(e) => {
                                                const year = e.target.value.split('-')[0];
                                                if (year.length <= 4) {
                                                    setScheduledDate(e.target.value);
                                                }
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                            error={timeError}
                                            inputProps={{
                                                max: "9999-12-31"
                                            }}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 1,
                                                    '&:hover fieldset': {
                                                        borderColor: '#007ea7',
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: '#007ea7',
                                                    }
                                                }
                                            }}
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
                                            error={timeError}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 1,
                                                    '&:hover fieldset': {
                                                        borderColor: '#007ea7',
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: '#007ea7',
                                                    }
                                                }
                                            }}
                                        />
                                    </Grid>
                                </Grid>

                                {timeError && (
                                    <Box sx={{ mt: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <FormHelperText error>현재 시간으로부터 최소 30분 이후로 설정해야 합니다</FormHelperText>
                                        <Button
                                            size="small"
                                            onClick={resetToThirtyMinutesLater}
                                            sx={{ 
                                                color: "#007ea7", 
                                                fontSize: "0.75rem",
                                                '&:hover': {
                                                    bgcolor: 'rgba(0, 126, 167, 0.1)'
                                                }
                                            }}
                                        >
                                            30분 후로 재설정
                                        </Button>
                                    </Box>
                                )}

                                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate("/message")}
                                        sx={{ 
                                            mr: 1, 
                                            borderColor: "#007ea7", 
                                            color: "#007ea7",
                                            '&:hover': {
                                                borderColor: "#003459",
                                                color: "#003459",
                                                bgcolor: 'rgba(0, 126, 167, 0.08)'
                                            }
                                        }}
                                        disabled={loading}
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        sx={{ 
                                            bgcolor: "#007ea7", 
                                            "&:hover": { bgcolor: "#003459" } 
                                        }}
                                        disabled={loading}
                                    >
                                        {loading ? <CircularProgress size={24} /> : "예약하기"}
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
                    문자가 성공적으로 예약되었습니다.
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default MessageCreate


