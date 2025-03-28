"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    AppBar,
    Toolbar,
    IconButton,
    TextField,
    InputAdornment,
    Chip,
    CircularProgress,
    Divider,
    Menu,
    MenuItem,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
} from "@mui/material"
import { Search, Add, ArrowBack, CalendarMonth, ChevronLeft, ChevronRight } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { consultationApi } from "../services/consultationApi"
import { customerApi } from "../services/customerApi"
import { ConsultationStatus, ConsultationType } from "../types/consultation"
import type { ConsultationResponse } from "../types/consultation"
import type { CustomerResponse } from "../types/customer"

// 상담 상태별 칩 색상 및 텍스트 - 새로운 상태 값에 맞게 업데이트
const statusConfig = {
    [ConsultationStatus.WAITING]: { color: "#e3f2fd", textColor: "#1976d2", label: "예약 대기" },
    [ConsultationStatus.CONFIRMED]: { color: "#fff8e1", textColor: "#f57c00", label: "예약 확정" },
    [ConsultationStatus.COMPLETED]: { color: "#e8f5e9", textColor: "#2e7d32", label: "진행 완료" },
    [ConsultationStatus.CANCELED]: { color: "#ffebee", textColor: "#c62828", label: "예약 취소" },
}

// 상담 유형별 텍스트
const typeConfig = {
    [ConsultationType.VISIT]: "방문 상담",
    [ConsultationType.CALL]: "전화 상담",
    [ConsultationType.VIDEO]: "화상 상담",
}

// 날짜 문자열을 Date 객체로 변환하는 함수
const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null

    try {
        // "yyyyMMdd HH:mm" 형식 처리 (예: "20240327 14:30")
        if (dateString.includes(" ")) {
            const [datePart, timePart] = dateString.split(" ")

            // 날짜 부분이 yyyyMMdd 형식인 경우
            if (datePart.length === 8) {
                const year = Number.parseInt(datePart.substring(0, 4))
                const month = Number.parseInt(datePart.substring(4, 6)) - 1 // 월은 0-11
                const day = Number.parseInt(datePart.substring(6, 8))

                // 시간 부분 처리
                let hours = 0,
                    minutes = 0
                if (timePart && timePart.includes(":")) {
                    const [hoursStr, minutesStr] = timePart.split(":")
                    hours = Number.parseInt(hoursStr)
                    minutes = Number.parseInt(minutesStr)
                }

                return new Date(year, month, day, hours, minutes)
            }
        }

        // ISO 형식 또는 다른 표준 형식 시도
        const date = new Date(dateString)
        if (!isNaN(date.getTime())) {
            return date
        }

        return null
    } catch (error) {
        console.error("날짜 파싱 오류:", error, dateString)
        return null
    }
}

// 날짜를 yyyy-MM-dd 형식으로 변환하는 함수
const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

const ConsultationList = () => {
    const navigate = useNavigate()
    const [consultations, setConsultations] = useState<ConsultationResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")

    // 현재 월 상태
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    // 상태 변경 관련 상태
    const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null)
    const [selectedConsultation, setSelectedConsultation] = useState<number | null>(null)
    const [statusLoading, setStatusLoading] = useState(false)
    const [statusSuccess, setStatusSuccess] = useState(false)
    const [statusError, setStatusError] = useState<string | null>(null)

    // 상담 등록 모달 관련 상태
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [customers, setCustomers] = useState<CustomerResponse[]>([])
    const [customersLoading, setCustomersLoading] = useState(false)
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse | null>(null)
    const [scheduledDate, setScheduledDate] = useState("")
    const [scheduledTime, setScheduledTime] = useState("")
    const [createLoading, setCreateLoading] = useState(false)
    const [createSuccess, setCreateSuccess] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)

    useEffect(() => {
        fetchConsultations()
    }, [])

    // fetchConsultations 함수를 수정하여 서버 응답 데이터를 적절히 변환합니다
    const fetchConsultations = async () => {
        try {
            setLoading(true)
            const response = await consultationApi.getConsultations()

            if (response.data.success && response.data.data) {
                // 서버 응답 데이터를 컴포넌트에서 사용하는 형식으로 변환
                const formattedConsultations = response.data.data.map((item: ConsultationResponse) => ({
                    id: item.consultationId,
                    customer: {
                        id: item.customerId,
                        name: item.customerName,
                        phone: item.customerPhone,
                        email: "",
                    },
                    consultationType: item.consultationType || ConsultationType.VISIT, // 기본값 설정
                    scheduledAt: item.date,
                    memo: item.memo || "",
                    status: item.consultationStatus as ConsultationStatus,
                    propertyInterest: item.interestProperty,
                    budget: item.assetStatus,
                    result: item.result,
                    nextAction: item.nextAction,
                    createdAt: item.date,
                    updatedAt: item.date,
                }))

                setConsultations(formattedConsultations)
            } else {
                setError("상담 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching consultations:", err)
            setError("상담 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 고객 목록 가져오기
    const fetchCustomers = async () => {
        try {
            setCustomersLoading(true)
            const response = await customerApi.getCustomers()

            if (response.data.success && response.data.data) {
                setCustomers(response.data.data)
            } else {
                setCreateError("고객 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching customers:", err)
            setCreateError("고객 목록을 불러오는데 실패했습니다.")
        } finally {
            setCustomersLoading(false)
        }
    }

    // 이전 달로 이동
    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    // 다음 달로 이동
    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    // 해당 월의 일수 구하기
    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month + 1, 0).getDate()
    }

    // 해당 월의 첫 날 요일 구하기 (0: 일요일, 6: 토요일)
    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month, 1).getDay()
    }

    // 현재 월의 캘린더 데이터 생성
    const generateCalendarData = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const daysInMonth = getDaysInMonth(year, month)
        const firstDayOfMonth = getFirstDayOfMonth(year, month)

        const days = []
        // 이전 달의 일부 날짜 채우기
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null)
        }

        // 현재 달의 날짜 채우기
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i))
        }

        // 7일씩 그룹화
        const weeks = []
        let week = []
        days.forEach((day, index) => {
            week.push(day)
            if (index % 7 === 6 || index === days.length - 1) {
                weeks.push(week)
                week = []
            }
        })

        return weeks
    }

    // 날짜별 상담 개수 계산 - 날짜 파싱 로직 수정
    const getConsultationCountByDate = (date: Date) => {
        if (!date) return 0

        const dateString = formatDateToYYYYMMDD(date)

        return consultations.filter((consultation) => {
            // scheduledAt이 없는 경우 필터링에서 제외
            if (!consultation.scheduledAt) return false

            // 날짜 파싱
            const consultDate = parseDate(consultation.scheduledAt)
            if (!consultDate) return false

            // 날짜만 비교 (시간 제외)
            const consultDateString = formatDateToYYYYMMDD(consultDate)
            return consultDateString === dateString
        }).length
    }

    // 날짜를 선택했을 때 처리
    const handleDateClick = (date: Date) => {
        setSelectedDate(date)
        // 날짜 클릭 시 해당 날짜의 상담 목록 필터링
        // TODO: 백엔드 API로 날짜별 상담 목록 조회 구현
    }

    // 상담 상세 페이지로 이동
    const handleViewConsultation = (consultationId: number) => {
        navigate(`/consultation/${consultationId}`)
    }

    // 상태 변경 메뉴 열기
    const handleStatusMenuOpen = (event: React.MouseEvent<HTMLDivElement>, consultationId: number) => {
        event.stopPropagation()
        setStatusAnchorEl(event.currentTarget)
        setSelectedConsultation(consultationId)
    }

    // 상태 변경 메뉴 닫기
    const handleStatusMenuClose = () => {
        setStatusAnchorEl(null)
        setSelectedConsultation(null)
    }

    // 상담 상태 변경
    const handleStatusChange = async (newStatus: ConsultationStatus) => {
        if (!selectedConsultation) return

        try {
            setStatusLoading(true)
            setStatusError(null)

            const response = await consultationApi.updateConsultationStatus(selectedConsultation, newStatus)

            if (response.data.success) {
                // 상태 변경 성공 시 목록 업데이트
                setConsultations(
                    consultations.map((consultation) =>
                        consultation.id === selectedConsultation ? { ...consultation, status: newStatus } : consultation,
                    ),
                )
                setStatusSuccess(true)
            } else {
                setStatusError(response.data.error?.message || "상담 상태 변경에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error updating consultation status:", err)
            setStatusError(err.response?.data?.error?.message || "상담 상태 변경에 실패했습니다.")
        } finally {
            setStatusLoading(false)
            handleStatusMenuClose()
        }
    }

    // 상담 등록 모달 열기
    const handleCreateModalOpen = () => {
        setCreateModalOpen(true)
        fetchCustomers()
        // 오늘 날짜로 초기화
        const today = new Date()
        setScheduledDate(formatDateToYYYYMMDD(today))
        setScheduledTime("10:00") // 기본 시간 설정
    }

    // 상담 등록 모달 닫기
    const handleCreateModalClose = () => {
        setCreateModalOpen(false)
        setSelectedCustomer(null)
        setScheduledDate("")
        setScheduledTime("")
        setCreateError(null)
    }

    // 상담 등록 처리
    const handleCreateConsultation = async () => {
        // 유효성 검사
        if (!selectedCustomer) {
            setCreateError("고객을 선택해주세요.")
            return
        }

        if (!scheduledDate || !scheduledTime) {
            setCreateError("상담 일시를 입력해주세요.")
            return
        }

        try {
            setCreateLoading(true)
            setCreateError(null)

            // 날짜와 시간을 "yyyy-MM-ddTHH:mm:00" 형식으로 결합
            const date = `${scheduledDate} ${scheduledTime}`

            const consultationData = {
                customerId: selectedCustomer.id,
                date: date,
            }

            const response = await consultationApi.createConsultation(consultationData)

            if (response.data.success) {
                setCreateSuccess(true)
                handleCreateModalClose()
                // 상담 목록 다시 불러오기
                fetchConsultations()
            } else {
                setCreateError(response.data.error?.message || "상담 등록에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error creating consultation:", err)
            setCreateError(err.response?.data?.error?.message || "상담 등록에 실패했습니다.")
        } finally {
            setCreateLoading(false)
        }
    }

    // 검색어로 필터링 - customer 객체가 존재하는지 확인하는 안전 검사 추가
    const filteredConsultations = consultations.filter((consultation) => {
        // customer 객체가 없는 경우 필터링에서 제외
        if (!consultation.customer) {
            return false
        }

        // 검색어 필터링
        const searchMatch =
            consultation.customer.name.includes(searchTerm) ||
            consultation.customer.phone.includes(searchTerm) ||
            (consultation.customer.email && consultation.customer.email.includes(searchTerm))

        return searchMatch
    })

    // 캘린더 데이터
    const calendarData = generateCalendarData()

    // 상단 요약 정보 계산 - 날짜 파싱 로직 수정
    const today = new Date()
    const todayString = formatDateToYYYYMMDD(today)

    // 오늘 상담 카운트 - 오늘 날짜이면서 상태가 "예약 확정"인 상담만 필터링
    const todayConsultations = consultations.filter((c) => {
        if (!c.scheduledAt) return false

        const consultDate = parseDate(c.scheduledAt)
        if (!consultDate) return false

        const consultDateString = formatDateToYYYYMMDD(consultDate)
        return consultDateString === todayString && c.status === ConsultationStatus.CONFIRMED
    })

    const scheduledCount = consultations.filter((c) => c.status === ConsultationStatus.CONFIRMED).length
    const completedCount = consultations.filter((c) => c.status === ConsultationStatus.COMPLETED).length

    // 날짜 형식화 함수 - 화면 표시용
    const formatDateTime = (dateString: string): string => {
        const date = parseDate(dateString)
        if (!date) return "날짜 정보 없음"

        return date.toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        상담 관리
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
                            상담 관리
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        sx={{
                            bgcolor: "#000",
                            "&:hover": { bgcolor: "#333" },
                        }}
                        onClick={handleCreateModalOpen}
                    >
                        상담 등록
                    </Button>
                </Box>

                {/* 요약 정보 */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={4}>
                        <Paper elevation={0} sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                오늘 상담
                            </Typography>
                            <Typography variant="h3" sx={{ color: "#2196f3", fontWeight: "bold" }}>
                                {todayConsultations.length}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={4}>
                        <Paper elevation={0} sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                예약 상담
                            </Typography>
                            <Typography variant="h3" sx={{ color: "#ff9800", fontWeight: "bold" }}>
                                {scheduledCount}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={4}>
                        <Paper elevation={0} sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                완료된 상담
                            </Typography>
                            <Typography variant="h3" sx={{ color: "#4caf50", fontWeight: "bold" }}>
                                {completedCount}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* 검색 필드 */}
                <Paper elevation={0} sx={{ mb: 3, p: 2 }}>
                    <TextField
                        placeholder="고객명, 연락처 또는 이메일로 검색"
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
                        <Button variant="contained" sx={{ mt: 2 }} onClick={fetchConsultations}>
                            다시 시도
                        </Button>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {/* 상담 목록 테이블 */}
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    상담 목록
                                </Typography>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>고객명</TableCell>
                                                <TableCell>연락처</TableCell>
                                                <TableCell>상담 일시</TableCell>
                                                <TableCell>상담 유형</TableCell>
                                                <TableCell>상태</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredConsultations.length > 0 ? (
                                                filteredConsultations.map((consultation) => (
                                                    <TableRow
                                                        key={consultation.id}
                                                        hover
                                                        onClick={() => handleViewConsultation(consultation.id)}
                                                        sx={{ cursor: "pointer" }}
                                                    >
                                                        <TableCell>{consultation.customer.name}</TableCell>
                                                        <TableCell>{consultation.customer.phone}</TableCell>
                                                        <TableCell>
                                                            {consultation.scheduledAt ? formatDateTime(consultation.scheduledAt) : "날짜 정보 없음"}
                                                        </TableCell>
                                                        <TableCell>{typeConfig[consultation.consultationType]}</TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={statusConfig[consultation.status]?.label || "알 수 없음"}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: statusConfig[consultation.status]?.color || "#f5f5f5",
                                                                    color: statusConfig[consultation.status]?.textColor || "#757575",
                                                                    cursor: "pointer",
                                                                }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleStatusMenuOpen(e, consultation.id)
                                                                }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center">
                                                        <Typography sx={{ py: 2 }}>
                                                            {searchTerm ? "검색 결과가 없습니다." : "등록된 상담이 없습니다."}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>

                        {/* 캘린더 뷰 */}
                        <Grid item xs={12}>
                            <Paper elevation={0} sx={{ p: 3 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                                    <Typography variant="h6">
                                        <CalendarMonth sx={{ verticalAlign: "middle", mr: 1 }} />
                                        상담 일정
                                    </Typography>
                                    <Box>
                                        <IconButton onClick={goToPreviousMonth}>
                                            <ChevronLeft />
                                        </IconButton>
                                        <Typography variant="subtitle1" component="span" sx={{ mx: 2 }}>
                                            {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                                        </Typography>
                                        <IconButton onClick={goToNextMonth}>
                                            <ChevronRight />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Divider sx={{ mb: 2 }} />

                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell align="center">일</TableCell>
                                            <TableCell align="center">월</TableCell>
                                            <TableCell align="center">화</TableCell>
                                            <TableCell align="center">수</TableCell>
                                            <TableCell align="center">목</TableCell>
                                            <TableCell align="center">금</TableCell>
                                            <TableCell align="center">토</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {calendarData.map((week, weekIndex) => (
                                            <TableRow key={`week-${weekIndex}`}>
                                                {week.map((day, dayIndex) => (
                                                    <TableCell
                                                        key={`day-${weekIndex}-${dayIndex}`}
                                                        align="center"
                                                        sx={{
                                                            height: "80px",
                                                            width: "14.28%",
                                                            position: "relative",
                                                            cursor: day ? "pointer" : "default",
                                                            bgcolor:
                                                                selectedDate && day && selectedDate.toDateString() === day.toDateString()
                                                                    ? "#f5f5f5"
                                                                    : "inherit",
                                                            color: day
                                                                ? dayIndex === 0
                                                                    ? "error.main"
                                                                    : // 일요일
                                                                    dayIndex === 6
                                                                        ? "primary.main"
                                                                        : // 토요일
                                                                        "inherit"
                                                                : "#aaa",
                                                        }}
                                                        onClick={() => day && handleDateClick(day)}
                                                    >
                                                        {day && (
                                                            <>
                                                                <Typography variant="body2">{day.getDate()}</Typography>
                                                                {getConsultationCountByDate(day) > 0 && (
                                                                    <Chip
                                                                        size="small"
                                                                        label={`${getConsultationCountByDate(day)}건`}
                                                                        sx={{
                                                                            position: "absolute",
                                                                            bottom: "5px",
                                                                            left: "50%",
                                                                            transform: "translateX(-50%)",
                                                                            bgcolor: "#e3f2fd",
                                                                            color: "#1976d2",
                                                                            fontSize: "0.7rem",
                                                                            height: "20px",
                                                                        }}
                                                                    />
                                                                )}
                                                            </>
                                                        )}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Container>

            {/* 상태 변경 메뉴 */}
            <Menu
                anchorEl={statusAnchorEl}
                open={Boolean(statusAnchorEl)}
                onClose={handleStatusMenuClose}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                <Typography variant="subtitle2" sx={{ px: 2, py: 1, fontWeight: "bold" }}>
                    상담 상태 변경
                </Typography>
                <Divider />
                {Object.values(ConsultationStatus).map((status) => (
                    <MenuItem key={status} onClick={() => handleStatusChange(status)} disabled={statusLoading}>
                        <Chip
                            label={statusConfig[status]?.label}
                            size="small"
                            sx={{
                                bgcolor: statusConfig[status]?.color,
                                color: statusConfig[status]?.textColor,
                                width: "100%",
                                justifyContent: "center",
                            }}
                        />
                    </MenuItem>
                ))}
            </Menu>

            {/* 상담 등록 모달 */}
            <Dialog open={createModalOpen} onClose={handleCreateModalClose} maxWidth="sm" fullWidth>
                <DialogTitle>상담 등록</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Autocomplete
                                    options={customers}
                                    loading={customersLoading}
                                    getOptionLabel={(option) => `${option.name} (${option.phone})`}
                                    value={selectedCustomer}
                                    onChange={(event, newValue) => {
                                        setSelectedCustomer(newValue)
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="고객 선택"
                                            required
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {customersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="상담 날짜"
                                    type="date"
                                    required
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="상담 시간"
                                    type="time"
                                    required
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCreateModalClose} disabled={createLoading}>
                        취소
                    </Button>
                    <Button
                        onClick={handleCreateConsultation}
                        variant="contained"
                        disabled={createLoading || !selectedCustomer || !scheduledDate || !scheduledTime}
                    >
                        {createLoading ? <CircularProgress size={24} /> : "등록"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 상태 변경 성공 메시지 */}
            <Snackbar open={statusSuccess} autoHideDuration={3000} onClose={() => setStatusSuccess(false)}>
                <Alert onClose={() => setStatusSuccess(false)} severity="success" sx={{ width: "100%" }}>
                    상담 상태가 성공적으로 변경되었습니다.
                </Alert>
            </Snackbar>

            {/* 상태 변경 에러 메시지 */}
            <Snackbar open={!!statusError} autoHideDuration={3000} onClose={() => setStatusError(null)}>
                <Alert onClose={() => setStatusError(null)} severity="error" sx={{ width: "100%" }}>
                    {statusError}
                </Alert>
            </Snackbar>

            {/* 상담 등록 성공 메시지 */}
            <Snackbar open={createSuccess} autoHideDuration={3000} onClose={() => setCreateSuccess(false)}>
                <Alert onClose={() => setCreateSuccess(false)} severity="success" sx={{ width: "100%" }}>
                    상담이 성공적으로 등록되었습니다.
                </Alert>
            </Snackbar>

            {/* 상담 등록 에러 메시지 */}
            <Snackbar open={!!createError} autoHideDuration={3000} onClose={() => setCreateError(null)}>
                <Alert onClose={() => setCreateError(null)} severity="error" sx={{ width: "100%" }}>
                    {createError}
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

export default ConsultationList

