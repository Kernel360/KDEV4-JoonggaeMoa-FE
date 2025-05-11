import type React from "react"
import {useEffect, useState} from "react"
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material"
import {Add, ArrowBack, Search} from "@mui/icons-material"
import {useNavigate} from "react-router-dom"
import {contractApi} from "../services/contractApi"
import type {ContractResponse} from "../types/contract"

const ContractList = () => {
    const navigate = useNavigate()
    const [contracts, setContracts] = useState<ContractResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentSearchTerm, setCurrentSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [contractToDelete, setContractToDelete] = useState<string | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // 페이지네이션 관련 상태
    const [page, setPage] = useState(0)
    const [totalPageCount, setTotalPageCount] = useState(0)
    const rowsPerPage = 10

    useEffect(() => {
        fetchContracts(page, rowsPerPage, currentSearchTerm)
    }, [page, currentSearchTerm])

    const fetchContracts = async (page: number, rowsPerPage: number, searchTerm: string) => {
        try {
            setLoading(true)
            const response = await contractApi.getAllContracts(page, rowsPerPage, searchTerm)

            if (response.data.success && response.data.data) {
                setContracts(response.data.data.content)
                setTotalPageCount(response.data.data.totalPages)
            } else {
                setError("계약 목록을 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching contracts:", err)
            setError("계약 목록을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value)
    }

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        setCurrentSearchTerm(searchTerm)
        setPage(0)
        fetchContracts(0, rowsPerPage, searchTerm)
    }

    const handlePageChange = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
        setPage(newPage - 1)
    }

    const handleDeleteClick = (event: React.MouseEvent, contractId: string) => {
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

    const handleViewContract = (contractId: string) => {
        navigate(`/contract/${contractId}`)
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
        active: {color: "#e8f5e9", textColor: "#2e7d32", label: "유효"},
        expiring: {color: "#fff8e1", textColor: "#f57c00", label: "만료 임박"},
        expired: {color: "#ffebee", textColor: "#c62828", label: "만료"},
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

    return (
        <Box sx={{flexGrow: 1, minHeight: "100vh"}}>
            <Container
                maxWidth="lg"
                sx={{
                    mt: 4,
                    mb: 4,
                    mx: "auto",
                    px: {xs: 2, sm: 3, md: 4},
                }}
            >
                <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3}}>
                    <Box sx={{display: "flex", alignItems: "center"}}>
                        <IconButton onClick={() => navigate("/dashboard")} sx={{mr: 1}}>
                            <ArrowBack/>
                        </IconButton>
                        <Typography variant="h6" sx={{fontWeight: "bold"}}>
                            계약 관리
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add/>}
                        sx={{
                            bgcolor: "#007ea7",
                            "&:hover": {bgcolor: "#003459"},
                        }}
                        onClick={() => navigate("/contract/create")}
                    >
                        신규 계약 등록
                    </Button>
                </Box>

                <Paper elevation={0} sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 2,
                    bgcolor: "#ffffff",
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                }}>
                    <Box component="form" onSubmit={handleSearchSubmit} sx={{display: "flex", gap: 2}}>
                        <TextField
                            placeholder="임대인 또는 임차인 이름으로 검색"
                            variant="outlined"
                            size="small"
                            fullWidth
                            value={searchTerm}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search/>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{
                                bgcolor: "#007ea7",
                                "&:hover": {bgcolor: "#003459"},
                            }}
                        >
                            검색
                        </Button>
                        <FormControl size="small" sx={{minWidth: 150}}>
                            <InputLabel>계약 상태</InputLabel>
                            <Select value={statusFilter} label="계약 상태"
                                    onChange={(e) => setStatusFilter(e.target.value)}>
                                <MenuItem value="all">전체</MenuItem>
                                <MenuItem value="active">유효</MenuItem>
                                <MenuItem value="expiring">만료 임박</MenuItem>
                                <MenuItem value="expired">만료</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Paper>

                {loading ? (
                    <Box sx={{display: "flex", justifyContent: "center", my: 5}}>
                        <CircularProgress/>
                    </Box>
                ) : error ? (
                    <Paper elevation={0} sx={{p: 3, textAlign: "center"}}>
                        <Typography color="error">{error}</Typography>
                        <Button
                            variant="contained"
                            sx={{mt: 2}}
                            onClick={() => fetchContracts(0, rowsPerPage, currentSearchTerm)}
                        >
                            다시 시도
                        </Button>
                    </Paper>
                ) : (
                    <>
                        <TableContainer component={Paper} elevation={0} sx={{
                            borderRadius: 2,
                            overflow: "hidden",
                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                            <Table>
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
                                            계약번호
                                        </TableCell>
                                        <TableCell sx={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: '#003459'
                                        }}>
                                            임대인 이름
                                        </TableCell>
                                        <TableCell sx={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: '#003459'
                                        }}>
                                            임차인 이름
                                        </TableCell>
                                        <TableCell sx={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: '#003459'
                                        }}>
                                            계약일
                                        </TableCell>
                                        <TableCell sx={{
                                            padding: '12px 16px',
                                            textAlign: 'left',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: '#003459'
                                        }}>
                                            만료일
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
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {contracts.length > 0 ? (
                                        <>
                                            {contracts.map((contract) => {
                                                const status = getContractStatus(contract.expiredAt)
                                                return (
                                                    <TableRow
                                                        key={contract.id}
                                                        hover
                                                        onClick={() => handleViewContract(contract.id)}
                                                        sx={{
                                                            cursor: "pointer",
                                                            borderBottom: '1px solid #e9ecef',
                                                            backgroundColor: 'transparent',
                                                            transition: 'background-color 0.2s',
                                                            '&:hover': {
                                                                backgroundColor: '#f8f9fa'
                                                            }
                                                        }}
                                                    >
                                                        <TableCell sx={{
                                                            padding: '12px 16px',
                                                            fontSize: '0.875rem',
                                                            color: '#00171f'
                                                        }}>
                                                            {contract.id.slice(0, 8)} {contract.id.length > 8 && '...'}
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            padding: '12px 16px',
                                                            fontSize: '0.875rem',
                                                            color: '#00171f'
                                                        }}>
                                                            {contract.landlordName}
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            padding: '12px 16px',
                                                            fontSize: '0.875rem',
                                                            color: '#00171f'
                                                        }}>
                                                            {contract.tenantName}
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            padding: '12px 16px',
                                                            fontSize: '0.875rem',
                                                            color: '#00171f'
                                                        }}>
                                                            {formatDate(contract.startedAt)}
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            padding: '12px 16px',
                                                            fontSize: '0.875rem',
                                                            color: '#00171f'
                                                        }}>
                                                            {formatDate(contract.expiredAt)}
                                                        </TableCell>
                                                        <TableCell sx={{
                                                            padding: '12px 16px',
                                                            fontSize: '0.875rem',
                                                            color: '#00171f'
                                                        }}>
                                                            <Chip
                                                                label={statusConfig[status as keyof typeof statusConfig].label}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: statusConfig[status as keyof typeof statusConfig].color,
                                                                    color: statusConfig[status as keyof typeof statusConfig].textColor,
                                                                }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{py: 3}}>
                                                <Typography variant="body1">
                                                    {currentSearchTerm ? "검색 결과가 없습니다." : "등록된 계약이 없습니다."}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* 페이지네이션 */}
                        <Box sx={{
                            display: "flex",
                            justifyContent: "center",
                            mt: 3,
                            mb: 2
                        }}>
                            <Pagination
                                count={totalPageCount}
                                page={page + 1}
                                onChange={handlePageChange}
                                color="primary"
                                showFirstButton
                                showLastButton
                            />
                        </Box>
                    </>
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
                        {deleteLoading ? <CircularProgress size={24}/> : "삭제"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 성공 메시지 스낵바 */}
            <Snackbar open={!!successMessage} autoHideDuration={6000} onClose={() => setSuccessMessage(null)}>
                <Alert onClose={() => setSuccessMessage(null)} severity="success" sx={{width: "100%"}}>
                    {successMessage}
                </Alert>
            </Snackbar>

            {/* 에러 메시지 스낵바 */}
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{width: "100%"}}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default ContractList

