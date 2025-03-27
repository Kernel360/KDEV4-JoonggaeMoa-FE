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
    Autocomplete,
} from "@mui/material"
import { ArrowBack } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { createConsultation } from "../../services/consultationApi"
import { getAllCustomers } from "../../services/customerApi"
import type { CustomerResponse } from "../../types/customer"

// 계약 유형 옵션
const CONTRACT_TYPES = ["매매", "전세", "월세", "단기임대", "기타"]

// 상담 상태 옵션
const CONSULTATION_STATUSES = [
    { value: "WAITING", label: "예약 대기" },
    { value: "CONFIRMED", label: "예약 확정" },
    { value: "CANCELED", label: "예약 취소" },
    { value: "COMPLETED", label: "완료" },
]

const ConsultationCreate = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [customers, setCustomers] = useState<CustomerResponse[]>([])
    const [customersLoading, setCustomersLoading] = useState(true)

    // 폼 데이터
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerResponse | null>(null)
    const [scheduledDate, setScheduledDate] = useState("")
    const [scheduledTime, setScheduledTime] = useState("")
    const [purpose, setPurpose] = useState("")
    const [interestProperty, setInterestProperty] = useState("")
    const [interestLocation, setInterestLocation] = useState("")
    const [contractType, setContractType] = useState("")
    const [assetStatus, setAssetStatus] = useState("")
    const [memo, setMemo] = useState("")
    const [consultationStatus, setConsultationStatus] = useState("WAITING")

    useEffect(() => {
        fetchCustomers()
    }, [])

    const fetchCustomers = async () => {
        try {
            setCustomersLoading(true)
            const response = await getAllCustomers()

            if (response.data.success && response.data.data) {
                setCustomers(response.data.data)
            } else {
                setError("고객 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching customers:", err)
            setError("고객 목록을 불러오는데 실패했습니다.")
        } finally {
            setCustomersLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // 유효성 검사
        if (!selectedCustomer) {
            setError("고객을 선택해주세요.")
            return
        }

        if (!scheduledDate || !scheduledTime) {
            setError("상담 일시를 입력해주세요.")
            return
        }

        try {
            setLoading(true)
            setError(null)

            // 날짜와 시간을 "yyyy-MM-dd HH:mm" 형식으로 결합
            const date = `${scheduledDate} ${scheduledTime}`

            const consultationData = {
                customerId: selectedCustomer.id,
                date,
                purpose: purpose || undefined,
                interestProperty: interestProperty || undefined,
                interestLocation: interestLocation || undefined,
                contractType: contractType || undefined,
                assetStatus: assetStatus || undefined,
                memo: memo || undefined,
                consultationStatus: consultationStatus || undefined,
            }

            const response = await createConsultation(consultationData)

            if (response.data.success) {
                setSuccess(true)
                setTimeout(() => {
                    navigate("/consultation")
                }, 1500)
            } else {
                setError(response.data.error?.message || "상담 등록에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error creating consultation:", err)
            setError(err.response?.data?.error?.message || "상담 등록에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        상담 하기
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={0} sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                        <IconButton onClick={() => navigate("/consultation")} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            상담 등록
                        </Typography>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "medium" }}>
                                    고객 정보
                                </Typography>
                            </Grid>

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

                            <Grid item xs={12}>
                                <Typography variant="subtitle1" sx={{ mb: 2, mt: 2, fontWeight: "medium" }}>
                                    상담 정보
                                </Typography>
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
                                    label="상담 목적"
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="상담 목적을 입력하세요"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="contract-type-label">계약 유형</InputLabel>
                                    <Select
                                        labelId="contract-type-label"
                                        id="contract-type"
                                        value={contractType}
                                        label="계약 유형"
                                        onChange={(e) => setContractType(e.target.value)}
                                    >
                                        <MenuItem value="">선택 안함</MenuItem>
                                        {CONTRACT_TYPES.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
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
                                    label="자산 상태"
                                    value={assetStatus}
                                    onChange={(e) => setAssetStatus(e.target.value)}
                                    placeholder="고객의 자산 상태를 입력하세요"
                                />
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth>
                                    <InputLabel id="consultation-status-label">상담 상태</InputLabel>
                                    <Select
                                        labelId="consultation-status-label"
                                        id="consultation-status"
                                        value={consultationStatus}
                                        label="상담 상태"
                                        onChange={(e) => setConsultationStatus(e.target.value)}
                                    >
                                        {CONSULTATION_STATUSES.map((status) => (
                                            <MenuItem key={status.value} value={status.value}>
                                                {status.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
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
                                    onClick={() => navigate("/consultation")}
                                    disabled={loading}
                                >
                                    취소
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#333" } }}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} /> : "상담 등록하기"}
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
                    상담이 성공적으로 등록되었습니다. 상담 목록 페이지로 이동합니다.
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

export default ConsultationCreate

