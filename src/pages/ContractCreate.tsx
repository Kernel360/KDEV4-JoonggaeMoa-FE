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
    IconButton,
    CircularProgress,
    Snackbar,
    Alert,
    Divider,
    Autocomplete,
} from "@mui/material"
import { ArrowBack, CloudUpload } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { contractApi } from "../services/contractApi"
import { customerApi } from "../services/customerApi"
import type { CustomerResponse } from "../types/customer"

const ContractCreate = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // 고객 관련 상태
    const [customers, setCustomers] = useState<CustomerResponse[]>([])
    const [customerLoading, setCustomerLoading] = useState(true)
    const [selectedLandlord, setSelectedLandlord] = useState<CustomerResponse | null>(null)
    const [selectedTenant, setSelectedTenant] = useState<CustomerResponse | null>(null)

    // 계약 관련 상태
    const [createdAt, setCreatedAt] = useState("")
    const [expiredAt, setExpiredAt] = useState("")
    const [contractFile, setContractFile] = useState<File | null>(null)

    useEffect(() => {
        fetchCustomers()

        // 오늘 날짜로 계약일 초기화
        const today = new Date()
        setCreatedAt(today.toISOString().split("T")[0])

        // 기본 만료일은 1년 후
        const nextYear = new Date()
        nextYear.setFullYear(nextYear.getFullYear() + 1)
        setExpiredAt(nextYear.toISOString().split("T")[0])
    }, [])

    const fetchCustomers = async () => {
    try {
        setCustomerLoading(true)
        const response = await customerApi.getCustomers()
        if (response.data.success && response.data.data) {
            setCustomers(response.data.data.content)
        } else {
            setError("고객 목록을 불러오는데 실패했습니다.")
        }
    } catch (err) {
        console.error("Error fetching customers:", err)
        setError("고객 목록을 불러오는데 실패했습니다.")
    } finally {
        setCustomerLoading(false)
    }
}

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0]

            // 파일 타입 검사 (PDF 및 이미지 파일 허용)
            const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/gif"]
            if (!allowedTypes.includes(selectedFile.type)) {
                setError("PDF 또는 이미지 파일(JPG, PNG, GIF)만 업로드 가능합니다.")
                return
            }

            // 파일 크기 검사 (10MB 제한)
            if (selectedFile.size > 10 * 1024 * 1024) {
                setError("파일 크기는 10MB 이하여야 합니다.")
                return
            }

            setContractFile(selectedFile)
            setError(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedLandlord) {
            setError("임대인을 선택해주세요.")
            return
        }

        if (!selectedTenant) {
            setError("임차인을 선택해주세요.")
            return
        }

        if (selectedLandlord.id === selectedTenant.id) {
            setError("임대인과 임차인은 동일할 수 없습니다.")
            return
        }

        if (!createdAt) {
            setError("계약일을 입력해주세요.")
            return
        }

        if (!expiredAt) {
            setError("만료일을 입력해주세요.")
            return
        }

        // if (!contractFile) {
        //     setError("계약서 파일을 업로드해주세요.")
        //     return
        // }

        try {
            setLoading(true)
            setError(null)

            const contractData = {
                landlordId: selectedLandlord.id,
                tenantId: selectedTenant.id,
                createdAt,
                expiredAt,
            }

            const response = await contractApi.createContract(contractData, contractFile)

            if (response.data.success) {
                setSuccess(true)
                setTimeout(() => {
                    navigate("/contract")
                }, 1500)
            } else {
                setError(response.data.error?.message || "계약 등록에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error creating contract:", err)
            setError(err.response?.data?.error?.message || "계약 등록에 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                    <IconButton onClick={() => navigate("/contract")} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        신규 계약 등록
                    </Typography>
                </Box>

                <Paper elevation={0} sx={{ p: 4 }}>
                    <form onSubmit={handleSubmit}>
                        <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: "bold" }}>
                            계약 기본 정보
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="계약일"
                                    type="date"
                                    required
                                    value={createdAt}
                                    onChange={(e) => setCreatedAt(e.target.value)}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="만료일"
                                    type="date"
                                    required
                                    value={expiredAt}
                                    onChange={(e) => setExpiredAt(e.target.value)}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: "bold" }}>
                            계약 당사자 정보
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <Autocomplete
                                    options={customers || []}
                                    loading={customerLoading}
                                    getOptionLabel={(option) => `${option.name} (${option.phone})`}
                                    value={selectedLandlord}
                                    onChange={(event, newValue) => {
                                        setSelectedLandlord(newValue)
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="임대인 선택"
                                            required
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {customerLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Autocomplete
                                    options={customers || []}
                                    loading={customerLoading}
                                    getOptionLabel={(option) => `${option.name} (${option.phone})`}
                                    value={selectedTenant}
                                    onChange={(event, newValue) => {
                                        setSelectedTenant(newValue)
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="임차인 선택"
                                            required
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {customerLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 4 }} />

                        <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: "bold" }}>
                            계약서 파일
                        </Typography>

                        <Box
                            sx={{
                                border: "2px dashed #ccc",
                                borderRadius: 2,
                                p: 5,
                                textAlign: "center",
                                mb: 3,
                            }}
                        >
                            <input
                                accept=".pdf,.jpg,.jpeg,.png,.gif"
                                style={{ display: "none" }}
                                id="raised-button-file"
                                type="file"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="raised-button-file">
                                <Button
                                    variant="contained"
                                    component="span"
                                    startIcon={<CloudUpload />}
                                    sx={{
                                        bgcolor: "#3f51b5",
                                        "&:hover": { bgcolor: "#303f9f" },
                                        mb: 2,
                                    }}
                                >
                                    계약서 파일 선택
                                </Button>
                            </label>
                            <Typography variant="body2" color="textSecondary">
                                {contractFile ? `선택된 파일: ${contractFile.name}` : "PDF 파일을 선택해주세요"}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 1 }}>
                                지원 형식: PDF, JPG, PNG, GIF (최대 10MB)
                            </Typography>
                        </Box>

                        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                            <Button
                                variant="outlined"
                                sx={{ mr: 1, borderColor: "#ddd", color: "#333" }}
                                onClick={() => navigate("/contract")}
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
                                {loading ? <CircularProgress size={24} /> : "계약 등록하기"}
                            </Button>
                        </Box>
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
                    계약이 성공적으로 등록되었습니다.
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

export default ContractCreate

