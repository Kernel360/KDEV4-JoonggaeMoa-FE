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
            // Remove all non-numeric characters
            const numericValue = value.replace(/\D/g, '')
            
            // Format the phone number
            if (numericValue.length <= 11) {
                let formattedPhone = numericValue
                if (numericValue.length > 3) {
                    formattedPhone = numericValue.slice(0, 3) + '-' + numericValue.slice(3)
                }
                if (numericValue.length > 7) {
                    formattedPhone = formattedPhone.slice(0, 8) + '-' + formattedPhone.slice(8)
                }
                setEditData((prev) => (prev ? { ...prev, [name]: formattedPhone } : null))
            }
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
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                        마이페이지
                    </Typography>
                    <Button
                        startIcon={<Edit />}
                        onClick={handleEditClick}
                        sx={{ 
                            ml: "auto",
                            color: '#007ea7',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 126, 167, 0.08)',
                                color: '#003459'
                            }
                        }}
                    >
                        수정하기
                    </Button>
                </Box>

                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', mb: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                        <Avatar 
                            sx={{ 
                                width: 64, 
                                height: 64, 
                                bgcolor: '#007ea7',
                                fontSize: '1.5rem',
                                mr: 2
                            }}
                        >
                            {agentInfo.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: "bold", color: '#111827' }}>{agentInfo.name}</Typography>
                            <Typography variant="body1" color="text.secondary">
                                {agentInfo.office || '사무실 정보 없음'}
                            </Typography>
                        </Box>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 3, bgcolor: "#f9fafb", borderRadius: 2, height: '100%' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827', mb: 2 }}>
                                    기본 정보
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 'medium' }}>
                                            아이디
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#111827', mt: 0.5 }}>
                                            {agentInfo.username}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 'medium' }}>
                                            이름
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#111827', mt: 0.5 }}>
                                            {agentInfo.name}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 'medium' }}>
                                            전화번호
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#111827', mt: 0.5 }}>
                                            {agentInfo.phone}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 'medium' }}>
                                            이메일
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#111827', mt: 0.5 }}>
                                            {agentInfo.email}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Paper elevation={0} sx={{ p: 3, bgcolor: "#f9fafb", borderRadius: 2, height: '100%' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827', mb: 2 }}>
                                    사무실 정보
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 'medium' }}>
                                            사무실명
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#111827', mt: 0.5 }}>
                                            {agentInfo.office || '없음'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 'medium' }}>
                                            지역
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#111827', mt: 0.5 }}>
                                            {agentInfo.region || '없음'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 'medium' }}>
                                            사업자등록번호
                                        </Typography>
                                        <Typography variant="body1" sx={{ color: '#111827', mt: 0.5 }}>
                                            {agentInfo.businessNo || '없음'}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Paper>

                <Dialog 
                    open={openEditDialog} 
                    onClose={() => setOpenEditDialog(false)} 
                    maxWidth="sm" 
                    fullWidth
                    PaperProps={{
                        sx: {
                            borderRadius: 2,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        }
                    }}
                >
                    <DialogTitle sx={{ 
                        borderBottom: '1px solid #e5e7eb',
                        pb: 2,
                        fontWeight: 600,
                        color: '#111827'
                    }}>
                        정보 수정
                    </DialogTitle>
                    <form onSubmit={handleEditSubmit}>
                        <DialogContent sx={{ pt: 3 }}>
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
                                        disabled
                                        sx={{ mb: 1 }}
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
                                        sx={{ mb: 1 }}
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
                                        sx={{ mb: 1 }}
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
                                        sx={{ mb: 1 }}
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
                                        sx={{ mb: 1 }}
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
                                        sx={{ mb: 1 }}
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
                                        sx={{ mb: 1 }}
                                    />
                                </Grid>
                            </Grid>
                        </DialogContent>
                        <DialogActions sx={{ 
                            borderTop: '1px solid #e5e7eb',
                            pt: 2,
                            px: 3,
                            pb: 2
                        }}>
                            <Button 
                                onClick={() => setOpenEditDialog(false)}
                                sx={{ 
                                    color: '#6b7280',
                                    '&:hover': {
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    }
                                }}
                            >
                                취소
                            </Button>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                sx={{ 
                                    bgcolor: '#007ea7',
                                    '&:hover': { 
                                        bgcolor: '#003459' 
                                    }
                                }}
                            >
                                저장하기
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Container>
        </Box>
    )
}

export default MyPage