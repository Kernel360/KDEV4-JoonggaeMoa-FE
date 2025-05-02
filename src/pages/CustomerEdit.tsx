"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    Button,
    Grid,
    FormControlLabel,
    Checkbox,
    AppBar,
    Toolbar,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
} from "@mui/material"
import { ArrowBack } from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { customerApi, type UpdateCustomerRequest, type CustomerHistoryResponse } from "../services/customerApi"
import dayjs from "dayjs"
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers"
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs"

const CustomerEdit = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<UpdateCustomerRequest>({
        name: "",
        birthday: "",
        phone: "",
        email: "",
        job: "",
        isVip: false,
        memo: "",
        consent: false,
        interestProperty: "",
        interestLocation: "",
        assetStatus: "",
    })

    useEffect(() => {
        if (id) {
            fetchCustomerDetails(Number.parseInt(id))
        }
    }, [id])

    const fetchCustomerDetails = async (customerId: number) => {
        try {
            setInitialLoading(true)
            const response = await customerApi.getCustomerById(customerId)

            if (response.data.success && response.data.data) {
                const customer = response.data.data
                setFormData({
                    name: customer.name,
                    birthday: customer.birthday || "",
                    phone: customer.phone,
                    email: customer.email || "",
                    job: customer.job || "",
                    isVip: customer.isVip,
                    memo: customer.memo || "",
                    consent: customer.consent,
                    interestProperty: customer.interestProperty || "",
                    interestLocation: customer.interestLocation || "",
                    assetStatus: customer.assetStatus || "",
                })
            } else {
                setError("고객 정보를 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching customer details:", err)
            setError("고객 정보를 불러오는데 실패했습니다.")
        } finally {
            setInitialLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        
        if (name === 'phone') {
            // Remove all non-numeric characters
            const numericValue = value.replace(/\D/g, '')
            
            // Format the phone number
            let formattedValue = numericValue
            if (numericValue.length >= 3) {
                formattedValue = numericValue.slice(0, 3) + '-' + numericValue.slice(3)
                if (numericValue.length >= 7) {
                    formattedValue = formattedValue.slice(0, 8) + '-' + numericValue.slice(7, 11)
                }
            }
            
            setFormData((prev) => ({ ...prev, [name]: formattedValue }))
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }))
        }
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        const { name, checked } = e.target
        // Ensure boolean value is set
        setFormData((prev) => ({ 
            ...prev, 
            [name]: checked || false 
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.phone || !formData.email || !formData.birthday) {
            setError("이름, 전화번호, 이메일, 생년월일은 필수 입력 항목입니다.")
            return
        }

        if (formData.birthday && dayjs(formData.birthday).isAfter(dayjs())) {
            setError("생년월일은 현재 날짜 이전이어야 합니다.");
            return
        }

        if (!id) return

        try {
            setLoading(true)
            setError(null)

            const response = await customerApi.updateCustomer(Number.parseInt(id), formData)

            if (response.data.success) {
                setSuccess(true)
                navigate(`/customer-management/${id}`)
            } else {
                setError(response.data.error?.message || "고객 정보 수정에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error updating customer:", err)
            setError(err.response?.data?.error?.message || "고객 정보 수정에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    if (initialLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <CircularProgress />
            </Box>
        )
    }

    return (
        <Box sx={{ flexGrow: 1, minHeight: "100vh" }}>
            <Container
                maxWidth="md"
                sx={{
                    mt: 4,
                    mb: 4,
                    mx: "auto",
                    px: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <Paper elevation={0} sx={{ p: 4, borderRadius: 2, bgcolor: "#ffffff" }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                        <IconButton onClick={() => navigate("/customer-management")} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            고객 정보 수정
                        </Typography>
                    </Box>

                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 3 }}>
                        고객의 정보를 수정해주세요.
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="이름"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="전화번호"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="010-0000-0000"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="이메일"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="직업" name="job" value={formData.job} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
                                    <DatePicker
                                        label="생년월일"
                                        value={formData.birthday ? dayjs(formData.birthday) : null}
                                        onChange={(newValue) => {
                                            if (newValue) {
                                                const formattedDate = dayjs(newValue).format('YYYY-MM-DD')
                                                setFormData(prev => ({ ...prev, birthday: formattedDate }))
                                            } else {
                                                setFormData(prev => ({ ...prev, birthday: '' }))
                                            }
                                        }}
                                        format="YYYY-MM-DD"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                required: true,
                                                error: false
                                            }
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <FormControlLabel
                                    control={<Checkbox checked={formData.isVip} onChange={handleCheckboxChange} name="isVip" />}
                                    label="VIP 고객"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="메모"
                                    name="memo"
                                    multiline
                                    rows={4}
                                    value={formData.memo}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={<Checkbox checked={formData.consent} onChange={handleCheckboxChange} name="consent" />}
                                    label="마케팅 정보 수신에 동의합니다."
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="관심 매물"
                                    name="interestProperty"
                                    value={formData.interestProperty}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="관심 지역"
                                    name="interestLocation"
                                    value={formData.interestLocation}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="자산 상태"
                                    name="assetStatus"
                                    value={formData.assetStatus}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                                <Button
                                    variant="outlined"
                                    sx={{ mr: 1, borderColor: "#ddd", color: "#333" }}
                                    onClick={() => navigate("/customer-management")}
                                    disabled={loading}
                                >
                                    취소
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    sx={{ bgcolor: "#007ea7", "&:hover": { bgcolor: "#003459" } }}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} /> : "고객 정보 수정하기"}
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
                    고객 정보가 성공적으로 수정되었습니다. 고객 목록 페이지로 이동합니다.
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default CustomerEdit

