"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
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
    Pagination,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button
} from "@mui/material"
import { Search, ArrowBack } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { getAllConsultations } from "../../services/consultationApi"
import { ConsultationStatus, ConsultationType } from "../../types/consultation"
import type { ConsultationResponse } from "../../types/consultation"

// 상담 상태별 칩 색상 및 텍스트
const statusConfig = {
    [ConsultationStatus.WAITING]: { color: "#e3f2fd", textColor: "#1976d2", label: "예약 대기" },
    [ConsultationStatus.CONFIRMED]: { color: "#fff8e1", textColor: "#f57c00", label: "예약 확정" },
    [ConsultationStatus.COMPLETED]: { color: "#e8f5e9", textColor: "#2e7d32", label: "완료" },
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

const ConsultationHistory = () => {
    const navigate = useNavigate()
    const [consultations, setConsultations] = useState<ConsultationResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [typeFilter, setTypeFilter] = useState<string>("ALL")
    const [page, setPage] = useState(1)
    const rowsPerPage = 10

    useEffect(() => {
        fetchConsultations()
    }, [])

    const fetchConsultations = async () => {
        try {
            setLoading(true)
            const response = await getAllConsultations()

            if (response.data.success && response.data.data) {
                // 서버 응답 데이터를 컴포넌트에서 사용하는 형식으로 변환
                const formattedConsultations = response.data.data.map((item: any) => ({
                    id: item.consultationId,
                    customer: {
                        id: item.customerId,
                        name: item.customerName,
                        phone: item.customerPhone,
                        email: item.customerEmail || "",
                    },
                    consultationType: item.consultationType || ConsultationType.VISIT, // 기본값 설정
                    scheduledAt: item.date,
                    memo: item.memo || "",
                    status: item.consultationStatus,
                    propertyInterest: item.interestProperty,
                    budget: item.assetStatus,
                    result: item.result,
                    nextAction: item.nextAction,
                    createdAt: item.date,
                    updatedAt: item.date,
                }))

                setConsultations(formattedConsultations)
            } else {
                setError("상담 내역을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching consultations:", err)
            setError("상담 내역을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 상담 상세 페이지로 이동
    const handleViewConsultation = (consultationId: number) => {
        navigate(`/consultation/${consultationId}`)
    }

    // 페이지 변경 핸들러
    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value)
    }

    // 검색어와 필터로 상담 내역 필터링
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

        // 상태 필터링
        const statusMatch = statusFilter === "ALL" || consultation.status === statusFilter

        // 유형 필터링
        const typeMatch = typeFilter === "ALL" || consultation.consultationType === typeFilter

        return searchMatch && statusMatch && typeMatch
    })

    // 페이지네이션
    const paginatedConsultations = filteredConsultations.slice((page - 1) * rowsPerPage, page * rowsPerPage)

    const pageCount = Math.ceil(filteredConsultations.length / rowsPerPage)

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        상담 내역 관리
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton onClick={() => navigate("/consultation")} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            상담 내역 관리
                        </Typography>
                    </Box>
                </Box>

                {/* 검색 및 필터 */}
                <Paper elevation={0} sx={{ mb: 3, p: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
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
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>상담 상태</InputLabel>
                                <Select value={statusFilter} label="상담 상태" onChange={(e) => setStatusFilter(e.target.value)}>
                                    <MenuItem value="ALL">전체</MenuItem>
                                    <MenuItem value={ConsultationStatus.WAITING}>예약 대기</MenuItem>
                                    <MenuItem value={ConsultationStatus.CONFIRMED}>예약 확정</MenuItem>
                                    <MenuItem value={ConsultationStatus.COMPLETED}>완료됨</MenuItem>
                                    <MenuItem value={ConsultationStatus.CANCELED}>취소됨</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>상담 유형</InputLabel>
                                <Select value={typeFilter} label="상담 유형" onChange={(e) => setTypeFilter(e.target.value)}>
                                    <MenuItem value="ALL">전체</MenuItem>
                                    <MenuItem value={ConsultationType.VISIT}>방문 상담</MenuItem>
                                    <MenuItem value={ConsultationType.CALL}>전화 상담</MenuItem>
                                    <MenuItem value={ConsultationType.VIDEO}>화상 상담</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
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
                    <>
                        <Paper elevation={0} sx={{ mb: 3 }}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "#f9f9f9" }}>
                                            <TableCell>고객명</TableCell>
                                            <TableCell>연락처</TableCell>
                                            <TableCell>상담 일시</TableCell>
                                            <TableCell>상담 유형</TableCell>
                                            <TableCell>상태</TableCell>
                                            <TableCell>비고</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {paginatedConsultations.length > 0 ? (
                                            paginatedConsultations.map((consultation) => (
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
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{consultation.result ? "상담완료" : ""}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center">
                                                    <Typography sx={{ py: 2 }}>
                                                        {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL"
                                                            ? "검색 결과가 없습니다."
                                                            : "등록된 상담이 없습니다."}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>

                        <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 2 }}>
                            <Pagination count={pageCount} page={page} onChange={handlePageChange} shape="rounded" />
                        </Box>
                    </>
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

export default ConsultationHistory

