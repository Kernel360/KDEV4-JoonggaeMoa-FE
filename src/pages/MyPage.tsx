"use client"

import React, { useState, useEffect } from "react"
import {
    Box,
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Avatar,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
} from "@mui/material"
import { ArrowBack, Edit } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { getAgent, updateAgent, AgentInfo } from "../services/agentService"

const MyPage = () => {
    const navigate = useNavigate()
    const { logout } = useAuth()
    const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [editData, setEditData] = useState<AgentInfo | null>(null)
    const [openEditDialog, setOpenEditDialog] = useState(false)

    useEffect(() => {
        fetchAgentInfo()
    }, [])

    const fetchAgentInfo = async () => {
        try {
            setLoading(true)
            const data = await getAgent()
            setAgentInfo(data)
        } catch (error) {
            console.error("Failed to fetch agent info:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditClick = () => {
        if (agentInfo) {
            setEditData({ ...agentInfo })
            setOpenEditDialog(true)
        }
    }

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        
        if (name === 'phone') {
            // Remove all non-digit characters
            const digits = value.replace(/\D/g, '')
            
            // Format the phone number
            let formattedPhone = digits
            if (digits.length >= 3) {
                formattedPhone = digits.slice(0, 3) + '-' + digits.slice(3)
                if (digits.length >= 7) {
                    formattedPhone = formattedPhone.slice(0, 8) + '-' + digits.slice(7, 11)
                }
            }
            
            setEditData((prev) => (prev ? { ...prev, [name]: formattedPhone } : null))
        } else {
            setEditData((prev) => (prev ? { ...prev, [name]: value } : null))
        }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editData) return

        try {
            await updateAgent(editData)
            setAgentInfo(editData)
            setOpenEditDialog(false)
        } catch (error) {
            console.error("Failed to update agent info:", error)
        }
    }

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                <CircularProgress />
            </Box>
        )
    }

    if (!agentInfo) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                <Typography>에이전트 정보를 불러올 수 없습니다.</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <Container maxWidth="md" sx={{ py: 3 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                            마이페이지
                        </Typography>
                        <Button
                            startIcon={<Edit />}
                            onClick={handleEditClick}
                            sx={{ ml: "auto" }}
                        >
                            수정하기
                        </Button>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>{agentInfo.name}</Typography>
                        <Typography variant="body1" color="textSecondary">
                            {agentInfo.office}
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: "#fafafa", borderRadius: 2 }}>
                                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                                    기본 정보
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                    <Box>
                                        <Typography variant="body2" color="textSecondary" display="block">
                                            아이디
                                        </Typography>
                                        <Typography variant="body1">{agentInfo.username}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="textSecondary" display="block">
                                            이름
                                        </Typography>
                                        <Typography variant="body1">{agentInfo.name}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="textSecondary" display="block">
                                            전화번호
                                        </Typography>
                                        <Typography variant="body1">{agentInfo.phone}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="textSecondary" display="block">
                                            이메일
                                        </Typography>
                                        <Typography variant="body1">{agentInfo.email}</Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Paper elevation={0} sx={{ p: 2, bgcolor: "#fafafa", borderRadius: 2 }}>
                                <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                                    사무실 정보
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                                    <Box>
                                        <Typography variant="body2" color="textSecondary" display="block">
                                            사무실명
                                        </Typography>
                                        <Typography variant="body1">{agentInfo.office || '없음'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="textSecondary" display="block">
                                            지역
                                        </Typography>
                                        <Typography variant="body1">{agentInfo.region || '없음'}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="textSecondary" display="block">
                                            사업자등록번호
                                        </Typography>
                                        <Typography variant="body1">{agentInfo.businessNo || '없음'}</Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
                        <DialogTitle>정보 수정</DialogTitle>
                        <form onSubmit={handleEditSubmit}>
                            <DialogContent>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="아이디"
                                            name="username"
                                            value={editData?.username || ""}
                                            onChange={handleEditChange}
                                            size="small"
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="이름"
                                            name="name"
                                            value={editData?.name || ""}
                                            onChange={handleEditChange}
                                            size="small"
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="전화번호"
                                            name="phone"
                                            value={editData?.phone || ""}
                                            onChange={handleEditChange}
                                            size="small"
                                            required
                                            inputProps={{
                                                maxLength: 13,
                                                placeholder: "010-0000-0000"
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="이메일"
                                            name="email"
                                            type="email"
                                            value={editData?.email || ""}
                                            onChange={handleEditChange}
                                            size="small"
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="사무실명"
                                            name="office"
                                            value={editData?.office || ""}
                                            onChange={handleEditChange}
                                            size="small"
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="지역"
                                            name="region"
                                            value={editData?.region || ""}
                                            onChange={handleEditChange}
                                            size="small"
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="사업자등록번호"
                                            name="businessNo"
                                            value={editData?.businessNo || ""}
                                            onChange={handleEditChange}
                                            size="small"
                                            required
                                        />
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setOpenEditDialog(false)}>취소</Button>
                                <Button type="submit" variant="contained" sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#333" } }}>
                                    저장하기
                                </Button>
                            </DialogActions>
                        </form>
                    </Dialog>
                </Paper>
            </Container>
        </Box>
    )
}

export default MyPage