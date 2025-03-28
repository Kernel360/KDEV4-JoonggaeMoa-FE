"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    Grid,
    TextField,
    Button,
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
} from "@mui/material"
import { ArrowBack } from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { consultationApi } from "../services/consultationApi"
import { ConsultationStatus, ConsultationType } from "../types/consultation"

// 상담 유형 옵션
const CONSULTATION_TYPES = [
    { value: ConsultationType.VISIT, label: "방문 상담" },
    { value: ConsultationType.CALL, label: "전화 상담" },
    { value: ConsultationType.VIDEO, label: "화상 상담" },
]

// 상담 상태 옵션
const CONSULTATION_STATUSES = [
    { value: ConsultationStatus.WAITING, label: "예약 대기" },
    { value: ConsultationStatus.CONFIRMED, label: "예약 확정" },
    { value: ConsultationStatus.COMPLETED, label: "진행 완료" },
    { value: ConsultationStatus.CANCELED, label: "예약 취소" },
]

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

// Date 객체를 "YYYY-MM-DD" 형식으로 변환
const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

// Date 객체를 "HH:MM" 형식으로 변환
const formatTimeToHHMM = (date: Date): string => {
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${hours}:${minutes}`
}

const ConsultationEdit = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // 폼 데이터 - 상담 정보
    const [consultationType, setConsultationType] = useState<ConsultationType>(ConsultationType.VISIT)
    const [scheduledDate, setScheduledDate] = useState("")
    const [scheduledTime, setScheduledTime] = useState("")
    const [purpose, setPurpose] = useState("")
    const [interestProperty, setInterestProperty] = useState("")
    const [interestLocation, setInterestLocation] = useState("")
    const [contractType, setContractType] = useState("")
    const [assetStatus, setAssetStatus] = useState("")
    const [memo, setMemo] = useState("")

    // 고객 정보 (읽기 전용)
    const [customerName, setCustomerName] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")

    useEffect(() => {
        if (id) {
            console.log("상담 ID:", id) // 로그 추가
            fetchConsultationDetails(Number.parseInt(id))
        }
    }, [id])

    const fetchConsultationDetails = async (consultationId: number) => {
        try {
            setLoading(true)
            console.log("상담 상세 정보 요청:", consultationId) // 로그 추가
            const response = await consultationApi.getConsultationById(consultationId)

            console.log("상담 상세 정보 응답:", response.data) // 로그 추가

            if (response.data.success && response.data.data) {
                const item = response.data.data

                // 고객 정보 설정
                setCustomerName(item.customerName || "")
                setCustomerPhone(item.customerPhone || "")

                // 상담 유형 설정 (기본값: 방문 상담)
                setConsultationType(item.consultationType || ConsultationType.VISIT)

                // 상담 정보 설정
                setPurpose(item.purpose || "")
                setInterestProperty(item.interestProperty || "")
                setInterestLocation(item.interestLocation || "")
                setContractType(item.contractType || "")
                setAssetStatus(item.assetStatus || "")
                setMemo(item.memo || "")

                // 날짜 및 시간 설정
                if (item.date) {
                    const date = parseDate(item.date)
                    if (date) {
                        setScheduledDate(formatDateToYYYYMMDD(date))
                        setScheduledTime(formatTimeToHHMM(date))
                    }
                }
            } else {
                setError("상담 정보를 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching consultation details:", err)
            setError("상담 정보를 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    // 상담 정보 수정 제출 (상태 포함)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!id) return

        // 유효성 검사
        if (!scheduledDate || !scheduledTime) {
            setError("상담 일시를 입력해주세요.")
            return
        }

        try {
            setSubmitting(true)
            setError(null)

            // 날짜와 시간을 서버 형식으로 변환
            const formattedDate = `${scheduledDate}T${scheduledTime}:00`

            const consultationData = {
                date: formattedDate,
                purpose,
                interestProperty,
                interestLocation,
                contractType,
                assetStatus,
                memo,
            }

            console.log("상담 수정 요청 데이터:", consultationData) // 로그 추가
            const response = await consultationApi.updateConsultation(Number.parseInt(id), consultationData)
            console.log("상담 수정 응답:", response.data) // 로그 추가

            if (response.data.success) {
                setSuccess(true)
                setTimeout(() => {
                    navigate(`/consultation/${id}`)
                }, 1500)
            } else {
                setError(response.data.error?.message || "상담 정보 수정에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error updating consultation:", err)
            setError(err.response?.data?.error?.message || "상담 정보 수정에 실패했습니다.")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        상담 수정
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={0} sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                        <IconButton onClick={() => navigate(`/consultation/${id}`)} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            상담 정보 수정
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "medium" }}>
                                    고객 정보
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="고객명"
                                    value={customerName}
                                    disabled
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="연락처"
                                    value={customerPhone}
                                    disabled
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle1" sx={{ mb: 2, mt: 2, fontWeight: "medium" }}>
                                    상담 정보
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel>상담 유형</InputLabel>
                                    <Select
                                        value={consultationType}
                                        label="상담 유형"
                                        onChange={(e) => setConsultationType(e.target.value as ConsultationType)}
                                    >
                                        {CONSULTATION_TYPES.map((type) => (
                                            <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="상담 목적"
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="상담 목적을 입력하세요"
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

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="관심 매물"
                                    value={interestProperty}
                                    onChange={(e) => setInterestProperty(e.target.value)}
                                    placeholder="관심 매물 정보를 입력하세요"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="관심 지역"
                                    value={interestLocation}
                                    onChange={(e) => setInterestLocation(e.target.value)}
                                    placeholder="관심 지역을 입력하세요"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="계약 유형"
                                    value={contractType}
                                    onChange={(e) => setContractType(e.target.value)}
                                    placeholder="계약 유형을 입력하세요"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="자산 상태"
                                    value={assetStatus}
                                    onChange={(e) => setAssetStatus(e.target.value)}
                                    placeholder="고객의 자산 상태를 입력하세요"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="메모"
                                    multiline
                                    rows={4}
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                    placeholder="상담에 관한 추가 정보를 입력하세요"
                                />
                            </Grid>

                            <Grid item xs={12} sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                                <Button
                                    variant="outlined"
                                    sx={{ mr: 1, borderColor: "#ddd", color: "#333" }}
                                    onClick={() => navigate(`/consultation/${id}`)}
                                    disabled={submitting}
                                >
                                    취소
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#333" } }}
                                    disabled={submitting}
                                >
                                    {submitting ? <CircularProgress size={24} /> : "상담 정보 수정하기"}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Container>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: "100%" }}>
                    상담 정보가 성공적으로 수정되었습니다.
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

export default ConsultationEdit

