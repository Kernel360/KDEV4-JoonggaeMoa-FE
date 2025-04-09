"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    TextField,
    InputAdornment,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Snackbar,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material"
import { Add, Search, ArrowBack, Delete, Edit } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { contractApi } from "../services/contractApi"
import type { ContractResponse } from "../types/contract"

const ContractList = () => {
    const navigate = useNavigate()
    const [contracts, setContracts] = useState<ContractResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [contractToDelete, setContractToDelete] = useState<number | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Add new state variables for pagination
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const loadingRef = useRef<HTMLTableCellElement>(null)

    useEffect(() => {
        fetchContracts()
    }, [])

    // Add intersection observer effect
    useEffect(() => {
        if (loading) return

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    setPage(prev => {
                        const nextPage = prev + 1
                        fetchContracts(nextPage)
                        return nextPage
                    })
                }
            },
            { threshold: 1.0 }
        )

        observerRef.current = observer

        if (loadingRef.current) {
            observer.observe(loadingRef.current)
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect()
            }
        }
    }, [loading, hasMore, isLoadingMore])

    // Modify fetchContracts to handle pagination
    const fetchContracts = async (pageNum: number = 0) => {
        try {
            if (pageNum === 0) {
                setLoading(true)
            } else {
                setIsLoadingMore(true)
            }
            
            const response = await contractApi.getAllContracts(pageNum)
            if (response.data.success && response.data.data) {
                const newContracts = response.data.data.content || []
                if (pageNum === 0) {
                    setContracts(newContracts)
                } else {
                    setContracts(prev => [...prev, ...newContracts])
                }
                setHasMore(!response.data.data.last)
            } else {
                setError("계약 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching contracts:", err)
            setError("계약 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
            setIsLoadingMore(false)
        }
    }

    const handleDeleteClick = (event: React.MouseEvent, contractId: number) => {
        event.stopPropagation()
        setContractToDelete(contractId)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (contractToDelete === null) return

        try {
            setDeleteLoading(true)
            const response = await contractApi.deleteContract(contractToDelete)

            if (response.data.success) {
                setSuccessMessage("계약이 성공적으로 삭제되었습니다.")
                // 목록에서 삭제된 계약 제거
                setContracts(contracts.filter((contract) => contract.id !== contractToDelete))
            } else {
                setError("계약 삭제에 실패했습니다.")
            }
        } catch (err) {
            console.error("Error deleting contract:", err)
            setError("계약 삭제에 실패했습니다.")
        } finally {
            setDeleteLoading(false)
            setDeleteDialogOpen(false)
            setContractToDelete(null)
        }
    }

    const handleViewContract = (contractId: number) => {
        navigate(`/contract/${contractId}`)
    }

    const handleEditContract = (event: React.MouseEvent, contractId: number) => {
        event.stopPropagation()
        navigate(`/contract/edit/${contractId}`)
    }

    // 계약 상태 계산 (만료일 기준)
    const getContractStatus = (expiredAt: string) => {
        const today = new Date()
        const expireDate = new Date(expiredAt)

        if (expireDate < today) {
            return "expired"
        } else {
            // 만료 30일 이내
            const daysUntilExpire = Math.ceil((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            if (daysUntilExpire <= 30) {
                return "expiring"
            } else {
                return "active"
            }
        }
    }

    // 상태별 칩 색상 및 텍스트
    const statusConfig = {
        active: { color: "#e8f5e9", textColor: "#2e7d32", label: "유효" },
        expiring: { color: "#fff8e1", textColor: "#f57c00", label: "만료 임박" },
        expired: { color: "#ffebee", textColor: "#c62828", label: "만료" },
    }

    // 날짜 형식화 함수
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            })
        } catch (e) {
            return dateString
        }
    }

    // 검색어와 상태 필터로 계약 필터링
    const filteredContracts = contracts.filter((contract) => {
        // 검색어 필터링 (임대인, 임차인 이름으로 검색)
        const searchMatch =
            contract.landlordName.toString().includes(searchTerm) || contract.tenantName.toString().includes(searchTerm)

        // 상태 필터링
        const status = getContractStatus(contract.expiredAt)
        const statusMatch = statusFilter === "all" || status === statusFilter

        return searchMatch && statusMatch
    })

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <Container
                maxWidth="lg"
                sx={{
                    mt: 4,
                    mb: 4,
                    mx: "auto",
                    px: { xs: 2, sm: 3, md: 4 },
                }}
            >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton onClick={() => navigate("/dashboard")} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            계약 관리
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        sx={{
                            bgcolor: "#000",
                            "&:hover": { bgcolor: "#333" },
                        }}
                        onClick={() => navigate("/contract/create")}
                    >
                        신규 계약 등록
                    </Button>
                </Box>

                <Paper elevation={0} sx={{ mb: 3, p: 3, borderRadius: 2 }}>
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <TextField
                            placeholder="임대인 또는 임차인 이름으로 검색"
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
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>계약 상태</InputLabel>
                            <Select value={statusFilter} label="계약 상태" onChange={(e) => setStatusFilter(e.target.value)}>
                                <MenuItem value="all">전체</MenuItem>
                                <MenuItem value="active">유효</MenuItem>
                                <MenuItem value="expiring">만료 임박</MenuItem>
                                <MenuItem value="expired">만료</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Paper>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
                        <Typography color="error">{error}</Typography>
                        <Button 
                            variant="contained" 
                            sx={{ mt: 2 }} 
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => fetchContracts(0)}
                        >
                            다시 시도
                        </Button>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: "#f9f9f9" }}>
                                    <TableCell sx={{ fontWeight: 500 }}>계약번호</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>임대인 이름</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>임차인 이름</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>계약일</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>만료일</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>상태</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }} align="right">
                                        작업
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredContracts.length > 0 ? (
                                    <>
                                        {filteredContracts.map((contract) => {
                                            const status = getContractStatus(contract.expiredAt)
                                            return (
                                                <TableRow
                                                    key={contract.id}
                                                    hover
                                                    onClick={() => handleViewContract(contract.id)}
                                                    sx={{ cursor: "pointer" }}
                                                >
                                                    <TableCell>{contract.id}</TableCell>
                                                    <TableCell>{contract.landlordName}</TableCell>
                                                    <TableCell>{contract.tenantName}</TableCell>
                                                    <TableCell>{formatDate(contract.createdAt)}</TableCell>
                                                    <TableCell>{formatDate(contract.expiredAt)}</TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={statusConfig[status as keyof typeof statusConfig].label}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: statusConfig[status as keyof typeof statusConfig].color,
                                                                color: statusConfig[status as keyof typeof statusConfig].textColor,
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton size="small" onClick={(e) => handleEditContract(e, contract.id)} sx={{ mr: 1 }}>
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                        <IconButton size="small" color="error" onClick={(e) => handleDeleteClick(e, contract.id)}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                        }
                                        <TableRow>
                                            <TableCell 
                                                colSpan={7} 
                                                ref={loadingRef}
                                                sx={{ border: 'none', height: '20px' }}
                                            >
                                                {isLoadingMore && (
                                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                                        <CircularProgress size={24} />
                                                    </Box>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    </>
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body1">
                                                {searchTerm || statusFilter !== "all" ? "검색 결과가 없습니다." : "등록된 계약이 없습니다."}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Container>

            {/* 삭제 확인 다이얼로그 */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>계약 삭제</DialogTitle>
                <DialogContent>
                    <DialogContentText>이 계약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
                        취소
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" disabled={deleteLoading}>
                        {deleteLoading ? <CircularProgress size={24} /> : "삭제"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 성공 메시지 스낵바 */}
            <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage(null)}>
                <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{ width: "100%" }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* 에러 메시지 스낵바 */}
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
                    {error}
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

export default ContractList

