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
import type { CustomerListResponse } from "../services/customerApi"

const CustomerManagement: React.FC = () => {
    const navigate = useNavigate()
    const [customers, setCustomers] = useState<CustomerListResponse[]>([])
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
        <Box sx={{ flexGrow: 1, minHeight: "100vh" }}>
            <Container
                maxWidth="lg"
                sx={{
                    mt: 4,
                    mb: 4,
                    mx: "auto",
                    px: { xs: 2, sm: 3, md: 4 },
                }}
            >
                {/* 상단 액션 영역 */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <IconButton 
                            onClick={() => navigate("/dashboard")} 
                            sx={{ 
                                color: "text.primary",
                                "&:hover": { bgcolor: "action.hover" }
                            }}
                        >
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "text.primary" }}>
                            고객 목록
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            sx={{
                                bgcolor: '#007ea7',
                                '&:hover': { bgcolor: '#003459' },
                                textTransform: 'none',
                                boxShadow: 2,
                            }}
                            onClick={() => navigate("/customer-management/add")}
                        >
                            개인고객등록
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<FileUpload />}
                            sx={{ 
                                mr: 2, 
                                borderColor: "#007ea7", 
                                color: "#007ea7",
                                '&:hover': {
                                    borderColor: "#003459",
                                    color: "#003459",
                                    bgcolor: 'rgba(0, 126, 167, 0.08)'
                                }
                            }}
                            onClick={() => navigate("/customer-management/import")}
                        >
                            엑셀등록
                        </Button>
                    </Box>
                </Box>

                {/* 검색 영역 */}
                <Paper 
                    elevation={0} 
                    sx={{ 
                        mb: 3, 
                        p: 3, 
                        borderRadius: 2,
                        bgcolor: "white",
                        boxShadow: 2,
                    }}
                >
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <TextField
                            placeholder="고객명, 연락처로 검색"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={searchTerm}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search sx={{ color: "text.secondary" }} />
                                    </InputAdornment>
                                ),
                                sx: {
                                    borderRadius: 2,
                                    "& fieldset": {
                                        borderColor: "grey.300",
                                    },
                                    "&:hover fieldset": {
                                        borderColor: "primary.main",
                                    },
                                },
                            }}
                        />
                    </Box>
                </Paper>

                {/* 고객 리스트 테이블 */}
                {loading && customers.length === 0 ? (
                    <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Paper elevation={0} sx={{ p: 3, textAlign: "center", borderRadius: 2 }}>
                        <Typography color="error">{error}</Typography>
                        <Button variant="contained" sx={{ mt: 2 }} onClick={() => setPage(0)}>
                            다시 시도
                        </Button>
                    </Paper>
                ) : (
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            borderRadius: 2,
                            overflow: "hidden",
                            boxShadow: 2,
                        }}
                    >
                        <TableContainer>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow sx={{ 
                                        backgroundColor: '#e9ecef',
                                        borderBottom: '1px solid #e9ecef'
                                    }}>
                                        <TableCell sx={{ 
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: '#003459'
                                        }}>
                                            고객명
                                        </TableCell>
                                        <TableCell sx={{ 
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: '#003459'
                                        }}>
                                            연락처
                                        </TableCell>
                                        <TableCell sx={{ 
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: '#003459'
                                        }}>
                                            이메일
                                        </TableCell>
                                        <TableCell sx={{ 
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: '#003459'
                                        }}>
                                            상태
                                        </TableCell>
                                        <TableCell sx={{ 
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: '#003459'
                                        }}>
                                            생년월일
                                        </TableCell>
                                        <TableCell sx={{ 
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: '#003459'
                                        }}>
                                            직업
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {customers.map((customer, index) => (
                                        <TableRow
                                            key={customer.id}
                                            hover
                                            onClick={() => navigate(`/customer-management/${customer.id}`)}
                                            sx={{ 
                                                cursor: "pointer",
                                                bgcolor: index % 2 === 0 ? "white" : "grey.50",
                                                "&:hover": {
                                                    bgcolor: "action.hover",
                                                },
                                            }}
                                            ref={index === customers.length - 1 ? lastCustomerRef : null}
                                        >
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#00171f', fontSize: '0.875rem' }}>
                                                    {customer.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: '#00171f', fontSize: '0.875rem' }}>
                                                    {customer.phone}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: '#00171f', fontSize: '0.875rem' }}>
                                                    {customer.email}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={customer.isVip ? "VIP" : "일반"}
                                                    color={customer.isVip ? "warning" : "default"}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: customer.isVip ? '#007ea7' : '#f5f5f5',
                                                        color: customer.isVip ? '#ffffff' : '#003459',
                                                        fontWeight: 600,
                                                        fontSize: '0.75rem',
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: '#00171f', fontSize: '0.875rem' }}>
                                                    {customer.birthday}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: '#00171f', fontSize: '0.875rem' }}>
                                                    {customer.job}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {loading && customers.length > 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <CircularProgress size={20} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* 페이지네이션 */}
                        <Box sx={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            p: 2,
                            borderTop: 1,
                            borderColor: "divider",
                        }}>
                            <Typography variant="body2" color="text.secondary">
                                총 {customers.length}명의 고객
                            </Typography>
                        </Box>
                    </Paper>
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
        </Box>
    )
}

export default CustomerManagement