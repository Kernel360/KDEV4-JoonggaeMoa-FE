"use client"

// 대시보드에 상담 관리 메뉴 추가
import React from "react"
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Container,
    Grid,
    Paper,
    Button,
    Avatar,
    IconButton,
    Badge,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
} from "@mui/material"
import {
    Description,
    Business,
    People,
    Forum,
    Email,
    Home,
    Work,
    Person,
    Notifications,
    Add,
    Assignment,
} from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const Dashboard = () => {
    const { logout } = useAuth()
    const navigate = useNavigate()

    const handleCustomerManagement = () => {
        navigate("/customer-management")
    }

    const handleSurveyManagement = () => {
        navigate("/survey")
    }

    const handleConsultationManagement = () => {
        navigate("/consultation")
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        대시보드
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                        <IconButton size="large" color="inherit">
                            <Badge badgeContent={3} color="error">
                                <Notifications />
                            </Badge>
                        </IconButton>
                        <Box sx={{ display: "flex", alignItems: "center", ml: 2 }}>
                            <Avatar sx={{ bgcolor: "#3f51b5", width: 36, height: 36 }}>김</Avatar>
                            <Typography variant="body2" sx={{ ml: 1 }}>
                                김부동 중개사
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{ ml: 2, bgcolor: "#000", "&:hover": { bgcolor: "#333" } }}
                            onClick={logout}
                        >
                            로그아웃
                        </Button>
                    </Box>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                {/* Menu Icons */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={2}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                cursor: "default",
                                "&:hover": { bgcolor: "#f9f9f9" },
                            }}
                        >
                            <Description sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="body2">계약관리</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={2}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                cursor: "default",
                                "&:hover": { bgcolor: "#f9f9f9" },
                            }}
                        >
                            <Business sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="body2">매물관리</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={2}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                cursor: "pointer",
                                "&:hover": { bgcolor: "#f0f7ff" },
                            }}
                            onClick={handleCustomerManagement}
                        >
                            <People sx={{ fontSize: 40, mb: 1, color: "#3f51b5" }} />
                            <Typography variant="body2" sx={{ color: "#3f51b5", fontWeight: "bold" }}>
                                고객관리
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={2}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                cursor: "pointer",
                                "&:hover": { bgcolor: "#f0f7ff" },
                            }}
                            onClick={handleConsultationManagement}
                        >
                            <Forum sx={{ fontSize: 40, mb: 1, color: "#3f51b5" }} />
                            <Typography variant="body2" sx={{ color: "#3f51b5", fontWeight: "bold" }}>
                                상담관리
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={2}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                cursor: "pointer",
                                "&:hover": { bgcolor: "#f0f7ff" },
                            }}
                            onClick={handleSurveyManagement}
                        >
                            <Assignment sx={{ fontSize: 40, mb: 1, color: "#3f51b5" }} />
                            <Typography variant="body2" sx={{ color: "#3f51b5", fontWeight: "bold" }}>
                                설문관리
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={2}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                cursor: "default",
                                "&:hover": { bgcolor: "#f9f9f9" },
                            }}
                        >
                            <Email sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="body2">문자발송</Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Stats Cards */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={3}>
                        <Paper elevation={0} sx={{ p: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Avatar sx={{ bgcolor: "#f5f5f5", color: "#555" }}>
                                    <Work />
                                </Avatar>
                                <Box sx={{ ml: 2 }}>
                                    <Typography variant="caption" color="textSecondary">
                                        금일 상담 예약
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                                        8건
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={3}>
                        <Paper elevation={0} sx={{ p: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Avatar sx={{ bgcolor: "#f5f5f5", color: "#555" }}>
                                    <Home />
                                </Avatar>
                                <Box sx={{ ml: 2 }}>
                                    <Typography variant="caption" color="textSecondary">
                                        신규 매물
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                                        12건
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={3}>
                        <Paper elevation={0} sx={{ p: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Avatar sx={{ bgcolor: "#f5f5f5", color: "#555" }}>
                                    <Description />
                                </Avatar>
                                <Box sx={{ ml: 2 }}>
                                    <Typography variant="caption" color="textSecondary">
                                        진행중 계약
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                                        5건
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={3}>
                        <Paper elevation={0} sx={{ p: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <Avatar sx={{ bgcolor: "#f5f5f5", color: "#555" }}>
                                    <Person />
                                </Avatar>
                                <Box sx={{ ml: 2 }}>
                                    <Typography variant="caption" color="textSecondary">
                                        신규 문의
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                                        15건
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Recent Activities and Quick Actions */}
                <Grid container spacing={3}>
                    <Grid item xs={12} md={7}>
                        <Paper elevation={0} sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                                최근 활동
                            </Typography>
                            <List>
                                <ListItem alignItems="flex-start">
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: "#000" }}>KM</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary="김민수님 상담 예약"
                                        secondary={
                                            <React.Fragment>
                                                <Typography component="span" variant="body2" color="textPrimary">
                                                    강남구 아파트 매매 관련 상담
                                                </Typography>
                                                <Typography variant="caption" display="block" color="textSecondary">
                                                    10분 전
                                                </Typography>
                                            </React.Fragment>
                                        }
                                    />
                                </ListItem>
                                <Divider variant="inset" component="li" />
                                <ListItem alignItems="flex-start">
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: "#4caf50" }}>LP</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary="이평화님 매물 등록"
                                        secondary={
                                            <React.Fragment>
                                                <Typography component="span" variant="body2" color="textPrimary">
                                                    서초구 신규 매물 등록 완료
                                                </Typography>
                                                <Typography variant="caption" display="block" color="textSecondary">
                                                    1시간 전
                                                </Typography>
                                            </React.Fragment>
                                        }
                                    />
                                </ListItem>
                                <Divider variant="inset" component="li" />
                                <ListItem alignItems="flex-start">
                                    <ListItemAvatar>
                                        <Avatar sx={{ bgcolor: "#ff9800" }}>PJ</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary="박정민님 계약 진행"
                                        secondary={
                                            <React.Fragment>
                                                <Typography component="span" variant="body2" color="textPrimary">
                                                    송파구 오피스텔 계약금 입금 완료
                                                </Typography>
                                                <Typography variant="caption" display="block" color="textSecondary">
                                                    2시간 전
                                                </Typography>
                                            </React.Fragment>
                                        }
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <Paper elevation={0} sx={{ p: 3 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                                빠른 작업
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<Add />}
                                        sx={{ justifyContent: "flex-start", p: 1.5, borderColor: "#e0e0e0", color: "#333" }}
                                        onClick={() => navigate("/customer-management/add")}
                                    >
                                        신규 고객 등록
                                    </Button>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<Forum />}
                                        sx={{ justifyContent: "flex-start", p: 1.5, borderColor: "#e0e0e0", color: "#333" }}
                                        onClick={() => navigate("/consultation/create")}
                                    >
                                        상담 등록하기
                                    </Button>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<Assignment />}
                                        sx={{ justifyContent: "flex-start", p: 1.5, borderColor: "#e0e0e0", color: "#333" }}
                                        onClick={() => navigate("/survey/create")}
                                    >
                                        새 설문 만들기
                                    </Button>
                                </Grid>
                                <Grid item xs={6}>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        startIcon={<Email />}
                                        sx={{ justifyContent: "flex-start", p: 1.5, borderColor: "#e0e0e0", color: "#333" }}
                                    >
                                        문자 발송
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
            <Box sx={{ bgcolor: "#fff", p: 2, textAlign: "center", mt: 4 }}>
                <Typography variant="caption" color="textSecondary">
                    © 2024 Customer Management System. All rights reserved.
                </Typography>
            </Box>
        </Box>
    )
}

export default Dashboard

