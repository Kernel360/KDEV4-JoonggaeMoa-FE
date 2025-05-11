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
    Divider,
    Grid,
    IconButton,
    Paper,
    Snackbar,
    Typography,
} from "@mui/material"
import {ArrowBack, Delete, Download} from "@mui/icons-material"
import {useNavigate, useParams} from "react-router-dom"
import {contractApi} from "@/domain/contract/services/contractApi"
import type {ContractResponse} from "@/domain/contract/types/contract"

const ContractDetail = () => {
    const navigate = useNavigate()
    const {id} = useParams<{ id: string }>()
    const [contract, setContract] = useState<ContractResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    useEffect(() => {
        if (id) {
            fetchContractDetails(id)
        }
    }, [id])

    const fetchContractDetails = async (contractId: string) => {
        try {
            setLoading(true)
            const response = await contractApi.getContractById(contractId)

            if (response.data.success && response.data.data) {
                const contractData = response.data.data
                setContract(contractData)
            } else {
                setError("계약 정보를 불러오는데 실패했습니다.")
            }
        } catch (err) {
            console.error("Error fetching contract details:", err)
            setError("계약 정보를 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!id) return

        try {
            setDeleteLoading(true)
            const response = await contractApi.deleteContract(id)

            if (response.data.success) {
                setSuccessMessage("계약이 성공적으로 삭제되었습니다.")
                setDeleteDialogOpen(false)

                navigate("/contract")
            } else {
                setError("계약 삭제에 실패했습니다.")
            }
        } catch (err) {
            console.error("Error deleting contract:", err)
            setError("계약 삭제에 실패했습니다.")
        } finally {
            setDeleteLoading(false)
        }
    }

    const handleDownloadContract = () => {
        if (!contract || !contract.url) return

        // 계약서 파일 다운로드
        window.open(contract.url, "_blank")
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

    if (loading) {
        return (
            <Box sx={{display: "flex", justifyContent: "center", alignItems: "center", height: "100vh"}}>
                <CircularProgress/>
            </Box>
        )
    }

    if (error || !contract) {
        return (
            <Container>
                <Box sx={{mt: 5, textAlign: "center"}}>
                    <Typography variant="h6" color="error" gutterBottom>
                        {error || "계약을 찾을 수 없습니다."}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate("/contract")} sx={{mt: 2}}>
                        계약 목록으로 돌아가기
                    </Button>
                </Box>
            </Container>
        )
    }

    const contractStatus = getContractStatus(contract.expiredAt)

    return (
        <Box sx={{flexGrow: 1, minHeight: "100vh"}}>
            <Container maxWidth="md" sx={{mt: 4, mb: 4}}>
                <Box sx={{display: "flex", alignItems: "center", mb: 4}}>
                    <IconButton onClick={() => navigate("/contract")} sx={{mr: 1}}>
                        <ArrowBack/>
                    </IconButton>
                    <Typography variant="h6" sx={{fontWeight: "bold"}}>
                        계약 상세 정보
                    </Typography>
                    <Box sx={{flexGrow: 1}}/>
                    <Button startIcon={<Delete/>} color="error" onClick={handleDeleteClick}>
                        삭제
                    </Button>
                </Box>

                <Paper elevation={0} sx={{p: 4, mb: 3, borderRadius: 2, bgcolor: "#ffffff"}}>
                    <Box sx={{display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3}}>
                        <Typography variant="h6" sx={{fontWeight: "bold", color: "#003459"}}>
                            계약 기본 정보
                        </Typography>
                        <Chip
                            label={statusConfig[contractStatus as keyof typeof statusConfig].label}
                            sx={{
                                bgcolor: statusConfig[contractStatus as keyof typeof statusConfig].color,
                                color: statusConfig[contractStatus as keyof typeof statusConfig].textColor,
                                fontWeight: "bold",
                            }}
                        />
                    </Box>

                    <Grid container spacing={3}>
                        <Grid
                            size={{
                                xs: 12,
                                sm: 6
                            }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                계약번호
                            </Typography>
                            <Typography variant="body1" sx={{mt: 1, mb: 2, fontWeight: "medium"}}>
                                {contract.id}
                            </Typography>
                        </Grid>
                        <Grid
                            size={{
                                xs: 12,
                                sm: 6
                            }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                계약서 파일
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<Download/>}
                                size="small"
                                onClick={handleDownloadContract}
                                sx={{mt: 1, mb: 2, borderColor: "#007ea7", color: "#007ea7"}}
                            >
                                계약서 파일 보기
                            </Button>
                        </Grid>
                        <Grid
                            size={{
                                xs: 12,
                                sm: 6
                            }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                계약일
                            </Typography>
                            <Typography variant="body1" sx={{mt: 1, mb: 2}}>
                                {formatDate(contract.startedAt)}
                            </Typography>
                        </Grid>
                        <Grid
                            size={{
                                xs: 12,
                                sm: 6
                            }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                만료일
                            </Typography>
                            <Typography variant="body1" sx={{mt: 1, mb: 2}}>
                                {formatDate(contract.expiredAt)}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>

                <Paper elevation={0} sx={{p: 4, borderRadius: 2, bgcolor: "#ffffff"}}>
                    <Typography variant="h6" sx={{fontWeight: "bold", mb: 3, color: "#003459"}}>
                        계약 당사자 정보
                    </Typography>

                    <Typography variant="subtitle1" sx={{fontWeight: "medium", mb: 2, color: "#007ea7"}}>
                        임대인 정보
                    </Typography>
                    <Grid container spacing={3} sx={{mb: 4}}>
                        <Grid
                            size={{
                                xs: 12,
                                sm: 6
                            }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                이름
                            </Typography>
                            <Typography variant="body1" sx={{mt: 1, mb: 2}}>
                                {contract.landlordName || "-"}
                            </Typography>
                        </Grid>
                        <Grid
                            size={{
                                xs: 12,
                                sm: 6
                            }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                연락처
                            </Typography>
                            <Typography variant="body1" sx={{mt: 1, mb: 2}}>
                                {contract.landlordPhone || "-"}
                            </Typography>
                        </Grid>
                        <Grid size={12}>
                            <Typography variant="subtitle2" color="textSecondary">
                                이메일
                            </Typography>
                            <Typography variant="body1" sx={{mt: 1, mb: 2}}>
                                {contract.landlordEmail || "-"}
                            </Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{my: 3}}/>

                    <Typography variant="subtitle1" sx={{fontWeight: "medium", mb: 2, color: "#007ea7"}}>
                        임차인 정보
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid
                            size={{
                                xs: 12,
                                sm: 6
                            }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                이름
                            </Typography>
                            <Typography variant="body1" sx={{mt: 1, mb: 2}}>
                                {contract.tenantName || "-"}
                            </Typography>
                        </Grid>
                        <Grid
                            size={{
                                xs: 12,
                                sm: 6
                            }}>
                            <Typography variant="subtitle2" color="textSecondary">
                                연락처
                            </Typography>
                            <Typography variant="body1" sx={{mt: 1, mb: 2}}>
                                {contract.tenantPhone || "-"}
                            </Typography>
                        </Grid>
                        <Grid size={12}>
                            <Typography variant="subtitle2" color="textSecondary">
                                이메일
                            </Typography>
                            <Typography variant="body1" sx={{mt: 1, mb: 2}}>
                                {contract.tenantEmail || "-"}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
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
    );
}

export default ContractDetail

