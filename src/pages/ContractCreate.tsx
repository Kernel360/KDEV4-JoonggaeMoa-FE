"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
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
    Chip,
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
    const [searchTerm, setSearchTerm] = useState("")
    
    // 페이지네이션 관련 상태
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const observer = useRef<IntersectionObserver | null>(null)
    const lastCustomerElementRef = useRef<HTMLDivElement | null>(null)

    // 계약 관련 상태
    const [startedAt, setStartedAt] = useState("")
    const [expiredAt, setExpiredAt] = useState("")
    const [contractFile, setContractFile] = useState<File | null>(null)

    useEffect(() => {
        fetchCustomers()

        // 오늘 날짜로 계약일 초기화
        const today = new Date()
        setStartedAt(today.toISOString().split("T")[0])

        // 기본 만료일은 1년 후
        const nextYear = new Date()
        nextYear.setFullYear(nextYear.getFullYear() + 1)
        setExpiredAt(nextYear.toISOString().split("T")[0])
    }, [])

    // 검색어가 변경될 때마다 고객 목록 초기화
    useEffect(() => {
        setCustomers([])
        setPage(0)
        setHasMore(true)
        fetchCustomers()
    }, [searchTerm])

    const fetchCustomers = async (pageNum = 0) => {
        try {
            if (pageNum === 0) {
                setCustomerLoading(true)
            } else {
                setIsLoadingMore(true)
            }
            
            const response = await customerApi.getCustomers(pageNum, 20)
            
            if (response.data.success && response.data.data) {
                const newCustomers = response.data.data.content
                
                if (pageNum === 0) {
                    setCustomers(newCustomers)
                } else {
                    setCustomers(prev => [...prev, ...newCustomers])
                }
                
                // 페이지네이션 정보 업데이트
                setHasMore(!response.data.data.last)
                setPage(pageNum)
            } else {
                setError("고객 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching customers:", err)
            setError("고객 목록을 불러오는데 실패했습니다.")
        } finally {
            setCustomerLoading(false)
            setIsLoadingMore(false)
        }
    }

    // 무한 스크롤을 위한 콜백 함수
    const lastCustomerRef = useCallback((node: HTMLDivElement | null) => {
        if (customerLoading) return
        
        if (observer.current) observer.current.disconnect()
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                fetchCustomers(page + 1)
            }
        })
        
        if (node) observer.current.observe(node)
        lastCustomerElementRef.current = node
    }, [customerLoading, hasMore, isLoadingMore, page])

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

        if (!startedAt) {
            setError("계약일을 입력해주세요.")
            return
        }

        if (!expiredAt) {
            setError("만료일을 입력해주세요.")
            return
        }

        // Add date validation
        const contractDate = new Date(startedAt)
        const expirationDate = new Date(expiredAt)
        
        if (expirationDate <= contractDate) {
            setError("날짜 정보를 올바르게 입력하세요")
            return
        }

        if (!contractFile) {
            setError("계약서 파일을 등록해주세요.")
            return
        }

        try {
            setLoading(true)
            setError(null)

            const contractData = {
                landlordId: selectedLandlord.id,
                tenantId: selectedTenant.id,
                startedAt,
                expiredAt,
            }

            const response = await contractApi.createContract(contractData, contractFile)

            if (response.data.success) {
                setSuccess(true)
                navigate("/contract")
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

    // 검색어로 고객 필터링 (이제 서버에서 처리되므로 클라이언트 필터링은 제거)
    const filteredCustomers = customers

    return (
        <Box sx={{ flexGrow: 1, minHeight: "100vh" }}>
            {/* Add error alert at the top */}
            {error && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 20,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 9999,
                        width: 'auto',
                        minWidth: 300,
                    }}
                >
                    <Alert severity="error" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                </Box>
            )}

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
                    <IconButton onClick={() => navigate("/contract")} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        신규 계약 등록
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={5}>
                            <Paper elevation={0} sx={{ p: 4, borderRadius: 2, height: "100%" }}>
                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
                                    고객 선택
                                </Typography>

                                {/* 검색창 */}
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="고객명 또는 전화번호로 검색"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    sx={{ mb: 2 }}
                                />

                                {/* 고객 목록 */}
                                <Box sx={{ border: "1px solid #eee", borderRadius: 1, mb: 2 }}>
                                    <Box sx={{ maxHeight: "500px", overflow: "auto", p: 1 }}>
                                        {customerLoading ? (
                                            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                                                <CircularProgress size={24} />
                                            </Box>
                                        ) : filteredCustomers.length > 0 ? (
                                            filteredCustomers.map((customer, index) => (
                                                <Box
                                                    key={customer.id}
                                                    ref={index === filteredCustomers.length - 1 ? lastCustomerRef : null}
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        p: 1,
                                                        borderBottom: "1px solid #f0f0f0",
                                                        cursor: "pointer",
                                                        bgcolor: 
                                                            (selectedLandlord?.id === customer.id || 
                                                             selectedTenant?.id === customer.id) 
                                                                ? "rgba(0, 126, 167, 0.08)" 
                                                                : "transparent",
                                                        "&:hover": {
                                                            bgcolor: "rgba(0, 126, 167, 0.05)",
                                                        },
                                                    }}
                                                    onClick={() => {
                                                        // 이미 선택된 고객인 경우 선택 해제
                                                        if (selectedLandlord?.id === customer.id) {
                                                            setSelectedLandlord(null);
                                                        } else if (selectedTenant?.id === customer.id) {
                                                            setSelectedTenant(null);
                                                        } else {
                                                            // 아직 선택되지 않은 고객인 경우
                                                            if (!selectedLandlord) {
                                                                setSelectedLandlord(customer);
                                                            } else if (!selectedTenant) {
                                                                setSelectedTenant(customer);
                                                            } else {
                                                                // 둘 다 이미 선택된 경우, 임대인을 새로 선택한 고객으로 변경
                                                                setSelectedLandlord(customer);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Box sx={{ flexGrow: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                                                            {customer.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            {customer.phone || "전화번호 없음"}
                                                        </Typography>
                                                    </Box>
                                                    <Box>
                                                        {selectedLandlord?.id === customer.id && (
                                                            <Chip 
                                                                label="임대인" 
                                                                size="small" 
                                                                sx={{ 
                                                                    bgcolor: "#007ea7", 
                                                                    color: "white",
                                                                    ml: "auto"
                                                                }} 
                                                            />
                                                        )}
                                                        {selectedTenant?.id === customer.id && (
                                                            <Chip 
                                                                label="임차인" 
                                                                size="small" 
                                                                sx={{ 
                                                                    bgcolor: "#003459", 
                                                                    color: "white",
                                                                    ml: "auto"
                                                                }} 
                                                            />
                                                        )}
                                                    </Box>
                                                </Box>
                                            ))
                                        ) : (
                                            <Box sx={{ p: 2, textAlign: "center" }}>
                                                <Typography variant="body2" color="textSecondary">
                                                    {searchTerm ? "검색 결과가 없습니다." : "고객이 없습니다."}
                                                </Typography>
                                            </Box>
                                        )}
                                        
                                        {isLoadingMore && (
                                            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                                                <CircularProgress size={24} />
                                            </Box>
                                        )}
                                    </Box>
                                </Box>

                                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">
                                        {selectedLandlord ? "임대인 선택됨" : "임대인 미선택"} / {selectedTenant ? "임차인 선택됨" : "임차인 미선택"}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} md={7}>
                            <Paper elevation={0} sx={{ p: 4, borderRadius: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: "bold", color: "#003459" }}>
                                    계약 기본 정보
                                </Typography>

                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="계약일"
                                            type="date"
                                            required
                                            value={startedAt}
                                            onChange={(e) => {
                                                const year = e.target.value.split('-')[0];
                                                if (year.length <= 4) {
                                                    setStartedAt(e.target.value);
                                                }
                                            }}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                            inputProps={{
                                                max: "9999-12-31"
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
                                            onChange={(e) => {
                                                const year = e.target.value.split('-')[0];
                                                if (year.length <= 4) {
                                                    setExpiredAt(e.target.value);
                                                }
                                            }}
                                            InputLabelProps={{
                                                shrink: true,
                                            }}
                                            inputProps={{
                                                max: "9999-12-31"
                                            }}
                                        />
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 4 }} />

                                <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: "bold", color: "#003459" }}>
                                    계약 당사자 정보
                                </Typography>

                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                                임대인
                                            </Typography>
                                            {selectedLandlord ? (
                                                <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(0, 126, 167, 0.05)" }}>
                                                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                                        {selectedLandlord.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {selectedLandlord.phone || "전화번호 없음"}
                                                    </Typography>
                                                </Paper>
                                            ) : (
                                                <Paper elevation={0} sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        왼쪽에서 임대인을 선택해주세요
                                                    </Typography>
                                                </Paper>
                                            )}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                                임차인
                                            </Typography>
                                            {selectedTenant ? (
                                                <Paper elevation={0} sx={{ p: 2, bgcolor: "rgba(0, 23, 31, 0.05)" }}>
                                                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                                                        {selectedTenant.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {selectedTenant.phone || "전화번호 없음"}
                                                    </Typography>
                                                </Paper>
                                            ) : (
                                                <Paper elevation={0} sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                                                    <Typography variant="body2" color="textSecondary">
                                                        왼쪽에서 임차인을 선택해주세요
                                                    </Typography>
                                                </Paper>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 4 }} />

                                <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: "bold", color: "#003459" }}>
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
                                                bgcolor: "#007ea7",
                                                "&:hover": { bgcolor: "#003459" },
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
                                        sx={{ bgcolor: "#007ea7", "&:hover": { bgcolor: "#003459" } }}
                                        disabled={loading}
                                    >
                                        {loading ? <CircularProgress size={24} /> : "계약 등록하기"}
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </form>
            </Container>

            {/* Remove the error Snackbar */}
            <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{ width: "100%" }}>
                    계약이 성공적으로 등록되었습니다.
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default ContractCreate


