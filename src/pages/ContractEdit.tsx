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
    AppBar,
    Toolbar,
    IconButton,
    CircularProgress,
    Snackbar,
    Alert,
    Divider,
} from "@mui/material"
import { ArrowBack, CloudUpload } from "@mui/icons-material"
import { useNavigate, useParams } from "react-router-dom"
import { contractApi } from "../services/contractApi"
import { customerApi } from "../services/customerApi"
import type { ContractResponse } from "../types/contract"
import type { CustomerResponse } from "../types/customer"

const ContractEdit = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // 계약 관련 상태
    const [contract, setContract] = useState<ContractResponse | null>(null)
    const [landlord, setLandlord] = useState<CustomerResponse | null>(null)
    const [tenant, setTenant] = useState<CustomerResponse | null>(null)
    const [createdAt, setCreatedAt] = useState("")
    const [expiredAt, setExpiredAt] = useState("")
    const [contractFile, setContractFile] = useState<File | null>(null)

    useEffect(() => {
        if (id) {
            fetchContractDetails(Number.parseInt(id))
        }
    }, [id])

    const fetchContractDetails = async (contractId: number) => {
        try {
            setInitialLoading(true)
            const response = await contractApi.getContractById(contractId)

            if (response.data.success && response.data.data) {
                const contractData = response.data.data
                setContract(contractData)
                setCreatedAt(contractData.createdAt.split("T")[0])
                setExpiredAt(contractData.expiredAt.split("T")[0])

                // 임대인 정보 조회
                try {
                    const landlordResponse = await customerApi.getCustomerById(contractData.landlordId)
                    if (landlordResponse.data.success && landlordResponse.data.data) {
                        setLandlord(landlordResponse.data.data)
                    }
                } catch (err) {
                    console.error("Error fetching landlord details:", err)
                }

                // 임차인 정보 조회
                try {
                    const tenantResponse = await customerApi.getCustomerById(contractData.tenantId)
                    if (tenantResponse.data.success && tenantResponse.data.data) {
                        setTenant(tenantResponse.data.data)
                    }
                } catch (err) {
                    console.error("Error fetching tenant details:", err)
                }
            } else {
                setError("계약 정보를 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching contract details:", err)
            setError("계약 정보를 불러오는데 실패했습니다.")
        } finally {
            setInitialLoading(false)
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

        if (!id) return

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
                createdAt,
                expiredAt,
            }

            const response = await contractApi.updateContract(Number.parseInt(id), contractData, contractFile)

            if (response.data.success) {
                setSuccess(true)
                setTimeout(() => {
                    navigate(`/contract/${id}`)
                }, 1500)
            } else {
                setError(response.data.error?.message || "계약 수정에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error updating contract:", err)
            setError(err.response?.data?.error?.message || "계약 수정에 실패했습니다.")
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

    if (!contract) {
        return (
            <Container>
                <Box sx={{ mt: 5, textAlign: "center" }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        계약을 찾을 수 없습니다.
                    </Typography>
                    <Button variant="contained" onClick={() => navigate("/contract")} sx={{ mt: 2 }}>
                        계약 목록으로 돌아가기
                    </Button>
                </Box>
            </Container>
        )
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                    <IconButton onClick={() => navigate(`/contract/${id}`)} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        계약 수정
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
                            계약 당사자 정보 (수정 불가)
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="임대인"
                                    value={landlord ? `${landlord.name} (${landlord.phone})` : `ID: ${contract.landlordId}`}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    disabled
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="임차인"
                                    value={tenant ? `${tenant.name} (${tenant.phone})` : `ID: ${contract.tenantId}`}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    disabled
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
                                    새 계약서 파일 선택
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
                                onClick={() => navigate(`/contract/${id}`)}
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
                                {loading ? <CircularProgress size={24} /> : "계약 수정하기"}
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
                    계약이 성공적으로 수정되었습니다.
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

export default ContractEdit

