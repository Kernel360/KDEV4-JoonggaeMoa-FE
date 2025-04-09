"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react" // useRef, useCallback 추가
import {
    Box,
    Container,
    Typography,
    Paper,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Chip,
    AppBar,
    Toolbar,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    CircularProgress,
} from "@mui/material"
import { Search, Add, FileUpload, ArrowBack, Delete } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { customerApi } from "../services/customerApi"
import type { CustomerResponse } from "../services/customerApi"

const CustomerManagement: React.FC = () => {
    const navigate = useNavigate()
    const [customers, setCustomers] = useState<CustomerResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(0) // 페이지 번호 0부터 시작
    const [totalPageCount, setTotalPageCount] = useState(0) // 총 페이지 state
    const [searchTerm, setSearchTerm] = useState("")
    const [openDialog, setOpenDialog] = useState(false)
    const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null)
    const [hasMore, setHasMore] = useState(false) // 더 불러올 데이터가 있는지 여부

    const rowsPerPage = 10
    const observer = useRef<IntersectionObserver | null>(null) // Intersection Observer ref

    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await customerApi.getCustomers(page, rowsPerPage);
            if (response.data.success && response.data.data) {
                const newCustomers = response.data.data.content;
                setCustomers((prevCustomers) => {
                    const combined = [...prevCustomers, ...newCustomers];
                    // ID를 기준으로 중복 제거
                    const uniqueCustomers = Array.from(new Map(combined.map(customer => [customer.id, customer])).values());
                    return uniqueCustomers;
                });
                setTotalPageCount(response.data.data.totalPages);
                setHasMore(!response.data.data.last);
            } else {
                setError("고객 정보를 불러오는데 실패했습니다.");
            }
        } catch (err) {
            console.error("Error fetching customers:", err);
            setError("고객 정보를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage]);

    useEffect(() => {
        fetchCustomers()
    }, [fetchCustomers]) // fetchCustomers 함수가 변경될 때마다 호출

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
        setPage(0) // 검색 시 첫 페이지부터 다시 로드
        setCustomers([]) // 기존 고객 데이터 초기화
    }

    const handleDeleteCustomer = (id: number) => {
        setSelectedCustomerId(id)
        setOpenDialog(true)
    }

    const confirmDeleteCustomer = async () => {
        if (selectedCustomerId) {
            try {
                const response = await customerApi.deleteCustomer(selectedCustomerId)
                if (response.data.success) {
                    setCustomers(customers.filter((customer) => customer.id !== selectedCustomerId))
                } else {
                    setError("고객 삭제에 실패했습니다.")
                }
            } catch (error) {
                console.error("Error deleting customer:", error)
                setError("고객 삭제에 실패했습니다.")
            } finally {
                setOpenDialog(false)
                setSelectedCustomerId(null)
            }
        }
    }

    const closeDialog = () => {
        setOpenDialog(false)
        setSelectedCustomerId(null)
    }

    const lastCustomerRef = useCallback((node: HTMLTableRowElement) => {
        if (loading) return
        if (observer.current) observer.current.disconnect()

        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                setPage((prevPage) => prevPage + 1)
            }
        })

        if (node) observer.current.observe(node)
    }, [loading, hasMore, fetchCustomers])

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
                            고객 관리
                        </Typography>
                    </Box>
                    <Box>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            sx={{
                                bgcolor: "#000",
                                "&:hover": { bgcolor: "#333" },
                                mr: 1,
                            }}
                            onClick={() => navigate("/customer-management/add")}
                        >
                            개인 고객 등록
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<FileUpload />}
                            sx={{ borderColor: "#ddd", color: "#333" }}
                            onClick={() => navigate("/customer-management/import")}
                        >
                            엑셀 등록
                        </Button>
                    </Box>
                </Box>

                <Paper elevation={0} sx={{ mb: 3, p: 3, borderRadius: 2 }}>
                    <TextField
                        placeholder="고객명, 연락처 또는 이메일로 검색"
                        variant="outlined"
                        size="small"
                        fullWidth
                        value={searchTerm}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Paper>

                {loading && customers.length === 0 ? (
                    <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Paper elevation={0} sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
                        <Typography color="error">{error}</Typography>
                        <Button variant="contained" sx={{ mt: 2 }} onClick={() => setPage(0)}> {/* 첫 페이지부터 다시 로드 */}
                            다시 시도
                        </Button>
                    </Paper>
                ) : (
                    <>
                        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f9f9f9" }}>
                                        <TableCell sx={{ fontWeight: 500 }}>고객명</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>연락처</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>이메일</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>상태</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {customers.map((customer, index) => (
                                        <TableRow
                                            key={customer.id}
                                            hover
                                            onClick={() => navigate(`/customer-management/${customer.id}`)}
                                            sx={{ cursor: "pointer" }}
                                            ref={index === customers.length - 1 ? lastCustomerRef : null}
                                        >
                                            <TableCell>{customer.name}</TableCell>
                                            <TableCell>{customer.phone}</TableCell>
                                            <TableCell>{customer.email}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={customer.isVip ? "VIP" : "일반"}
                                                    color={customer.isVip ? "success" : "default"}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: customer.isVip ? "#e8f5e9" : "#f5f5f5",
                                                        color: customer.isVip ? "#2e7d32" : "#757575",
                                                        border: "none",
                                                    }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {loading && customers.length > 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">
                                                <CircularProgress size={20} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                                전체 {totalPageCount * rowsPerPage}건 중 {customers.length}건 표시
                            </Typography>
                        </Box>
                    </>
                )}
            </Container>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={openDialog}
                onClose={closeDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"고객 삭제"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        이 고객을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog}>취소</Button>
                    <Button onClick={confirmDeleteCustomer} color="error" autoFocus>
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>

            <Box sx={{ bgcolor: "#fff", p: 2, textAlign: "center", mt: 4 }}>
                <Typography variant="caption" color="textSecondary">
                    © 2024 Customer Management System. All rights reserved.
                </Typography>
            </Box>
        </Box>
    )
}

export default CustomerManagement