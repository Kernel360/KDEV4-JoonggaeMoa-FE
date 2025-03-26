"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
    Pagination,
    AppBar,
    Toolbar,
    Menu,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    type SelectChangeEvent,
    CircularProgress,
} from "@mui/material"
import { Search, Add, FileUpload, ArrowBack, KeyboardArrowDown } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { getAllCustomers, type CustomerResponse } from "../services/customerApi"
import { useAuth } from "../context/AuthContext"

const CustomerManagement = () => {
    const navigate = useNavigate()
    const { agentId } = useAuth()
    const [customers, setCustomers] = useState<CustomerResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null)
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [searchTerm, setSearchTerm] = useState("")

    const rowsPerPage = 10

    useEffect(() => {
        fetchCustomers()
    }, [])

    const fetchCustomers = async () => {
        try {
            setLoading(true)
            const response = await getAllCustomers()
            if (response.data.success && response.data.data) {
                setCustomers(response.data.data)
            } else {
                setError("고객 정보를 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching customers:", err)
            setError("고객 정보를 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value)
    }

    const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setFilterAnchorEl(event.currentTarget)
    }

    const handleFilterClose = () => {
        setFilterAnchorEl(null)
    }

    const handleStatusFilterChange = (event: SelectChangeEvent) => {
        setStatusFilter(event.target.value)
    }

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
        setPage(1) // Reset to first page on search
    }

    // Filter customers based on search term and VIP status
    const filteredCustomers = customers.filter((customer) => {
        const matchesSearch =
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.phone.includes(searchTerm) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "vip" && customer.isVip) ||
            (statusFilter === "normal" && !customer.isVip)

        return matchesSearch && matchesStatus
    })

    // Pagination
    const paginatedCustomers = filteredCustomers.slice((page - 1) * rowsPerPage, page * rowsPerPage)

    // Calculate total pages
    const totalPages = Math.ceil(filteredCustomers.length / rowsPerPage)

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        고객 관리
                    </Typography>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                        관리자
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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

                <Paper elevation={0} sx={{ mb: 3, p: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <TextField
                            placeholder="고객명, 연락처 또는 이메일로 검색"
                            variant="outlined"
                            size="small"
                            sx={{ width: "70%" }}
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
                        <Button
                            endIcon={<KeyboardArrowDown />}
                            onClick={handleFilterClick}
                            sx={{ borderColor: "#ddd", color: "#333" }}
                        >
                            {statusFilter === "all" ? "전체 상태" : statusFilter === "vip" ? "VIP 고객" : "일반 고객"}
                        </Button>
                        <Menu anchorEl={filterAnchorEl} open={Boolean(filterAnchorEl)} onClose={handleFilterClose}>
                            <FormControl sx={{ m: 1, minWidth: 120 }}>
                                <InputLabel id="status-filter-label">상태</InputLabel>
                                <Select
                                    labelId="status-filter-label"
                                    id="status-filter"
                                    value={statusFilter}
                                    label="상태"
                                    onChange={handleStatusFilterChange}
                                >
                                    <MenuItem value="all">전체</MenuItem>
                                    <MenuItem value="vip">VIP 고객</MenuItem>
                                    <MenuItem value="normal">일반 고객</MenuItem>
                                </Select>
                            </FormControl>
                        </Menu>
                    </Box>
                </Paper>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Paper elevation={0} sx={{ p: 3, textAlign: "center" }}>
                        <Typography color="error">{error}</Typography>
                        <Button variant="contained" sx={{ mt: 2 }} onClick={fetchCustomers}>
                            다시 시도
                        </Button>
                    </Paper>
                ) : (
                    <>
                        <TableContainer component={Paper} elevation={0}>
                            <Table sx={{ minWidth: 650 }}>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: "#f9f9f9" }}>
                                        <TableCell>고객명</TableCell>
                                        <TableCell>연락처</TableCell>
                                        <TableCell>이메일</TableCell>
                                        <TableCell>직업</TableCell>
                                        <TableCell>등록일자</TableCell>
                                        <TableCell>상태</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedCustomers.length > 0 ? (
                                        paginatedCustomers.map((customer) => (
                                            <TableRow
                                                key={customer.id}
                                                hover
                                                onClick={() => navigate(`/customer-management/${customer.id}`)}
                                                sx={{ cursor: "pointer" }}
                                            >
                                                <TableCell>{customer.name}</TableCell>
                                                <TableCell>{customer.phone}</TableCell>
                                                <TableCell>{customer.email}</TableCell>
                                                <TableCell>{customer.job}</TableCell>
                                                <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
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
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                                <Typography variant="body1">
                                                    {searchTerm ? "검색 결과가 없습니다." : "등록된 고객이 없습니다."}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                                전체 {filteredCustomers.length}건 중 {Math.min((page - 1) * rowsPerPage + 1, filteredCustomers.length)}
                                에서 {Math.min(page * rowsPerPage, filteredCustomers.length)}까지 표시
                            </Typography>
                            <Pagination count={totalPages} page={page} onChange={handlePageChange} shape="rounded" />
                        </Box>
                    </>
                )}
            </Container>

            <Box sx={{ bgcolor: "#fff", p: 2, textAlign: "center", mt: 4 }}>
                <Typography variant="caption" color="textSecondary">
                    © 2024 Customer Management System. All rights reserved.
                </Typography>
            </Box>
        </Box>
    )
}

export default CustomerManagement

