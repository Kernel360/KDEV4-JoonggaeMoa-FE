"use client"

import type React from "react"
import { useState } from "react"
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
import { useNavigate } from "react-router-dom"
import { createCustomer, type CreateCustomerRequest } from "../services/customerApi"

const CustomerAdd = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<CreateCustomerRequest>({
        name: "",
        birthday: "",
        phone: "",
        email: "",
        job: "",
        isVip: false,
        memo: "",
        consent: false,
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target
        setFormData((prev) => ({ ...prev, [name]: checked }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.phone) {
            setError("이름과 연락처는 필수 입력 항목입니다.")
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response = await createCustomer(formData)

            if (response.data.success) {
                setSuccess(true)
                setTimeout(() => {
                    navigate("/customer-management")
                }, 1500)
            } else {
                setError(response.data.error?.message || "고객 등록에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error creating customer:", err)
            setError(err.response?.data?.error?.message || "고객 등록에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        고객 관리
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={0} sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                        <IconButton onClick={() => navigate("/customer-management")} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            고객 정보 등록
                        </Typography>
                    </Box>

                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 3 }}>
                        고객의 기본 정보를 입력해주세요.
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField required fullWidth label="이름" name="name" value={formData.name} onChange={handleChange} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    required
                                    fullWidth
                                    label="연락처"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="010-0000-0000"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
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
                                <TextField
                                    fullWidth
                                    label="생년월일"
                                    name="birthday"
                                    value={formData.birthday}
                                    onChange={handleChange}
                                    placeholder="YYYY-MM-DD"
                                    helperText="예: 1990-01-01 형식으로 입력해주세요"
                                />
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
                                    sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#333" } }}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} /> : "고객 등록하기"}
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
                    고객이 성공적으로 등록되었습니다. 고객 목록 페이지로 이동합니다.
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

export default CustomerAdd

