"use client"

import type React from "react"
import { useState } from "react"
import {
    Box,
    Container,
    Typography,
    Paper,
    Button,
    Grid,
    AppBar,
    Toolbar,
    IconButton,
    Divider,
    Alert,
    Snackbar,
    CircularProgress,
} from "@mui/material"
import { ArrowBack, CloudUpload } from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { bulkCreateCustomers } from "../../services/customerApi"

const CustomerImport = () => {
    const navigate = useNavigate()
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0]

            // Check file type
            const fileExtension = selectedFile.name.split(".").pop()?.toLowerCase()
            if (fileExtension !== "xlsx" && fileExtension !== "xls" && fileExtension !== "csv") {
                setError("엑셀 또는 CSV 파일만 업로드 가능합니다.")
                return
            }

            setFile(selectedFile)
            setError(null)
        }
    }

    const handleUpload = async () => {
        if (!file) {
            setError("업로드할 파일을 선택해주세요.")
            return
        }

        try {
            setIsUploading(true)
            setError(null)

            const response = await bulkCreateCustomers(file)

            if (response.data.success) {
                setUploadSuccess(true)

                // Redirect after successful upload
                setTimeout(() => {
                    navigate("/customer-management")
                }, 2000)
            } else {
                setError(response.data.error?.message || "파일 업로드에 실패했습니다.")
            }
        } catch (err: any) {
            console.error("Error uploading file:", err)
            setError(err.response?.data?.error?.message || "파일 업로드에 실패했습니다.")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
            <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: "white" }}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: "#888", fontWeight: 300 }}>
                        고객 관리
                    </Typography>
                </Toolbar>
            </AppBar>

            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={0} sx={{ p: 4 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                        <IconButton onClick={() => navigate("/customer-management")} sx={{ mr: 1 }}>
                            <ArrowBack />
                        </IconButton>
                        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                            고객 정보 등록
                        </Typography>
                    </Box>

                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 3 }}>
                        엑셀 파일로 고객 정보를 일괄 등록합니다.
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
                            accept=".xlsx,.xls,.csv"
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
                                    bgcolor: "#3f51b5",
                                    "&:hover": { bgcolor: "#303f9f" },
                                    mb: 2,
                                }}
                            >
                                파일 선택하기
                            </Button>
                        </label>
                        <Typography variant="body2" color="textSecondary">
                            {file ? `선택된 파일: ${file.name}` : "엑셀 또는 CSV 파일을 선택해주세요"}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 1 }}>
                            지원 형식: .xlsx, .xls, .csv
                        </Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Grid container spacing={2} justifyContent="center">
                        <Grid item>
                            <Button
                                variant="outlined"
                                sx={{ borderColor: "#ddd", color: "#333" }}
                                onClick={() => navigate("/customer-management")}
                                disabled={isUploading}
                            >
                                취소
                            </Button>
                        </Grid>
                        <Grid item>
                            <Button
                                variant="contained"
                                sx={{ bgcolor: "#000", "&:hover": { bgcolor: "#333" } }}
                                disabled={!file || isUploading}
                                onClick={handleUpload}
                            >
                                {isUploading ? <CircularProgress size={24} /> : "업로드하기"}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>

            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar open={uploadSuccess} autoHideDuration={6000} onClose={() => setUploadSuccess(false)}>
                <Alert severity="success" sx={{ width: "100%" }}>
                    파일이 성공적으로 업로드되었습니다. 고객 목록 페이지로 이동합니다.
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

export default CustomerImport

