"use client"

import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardActions,
    Divider,
    Grid,
    Alert,
    Snackbar,
} from "@mui/material"
import api from "../services/api"

interface FormData {
    username: string
    password: string
    name: string
    phone: string
    email: string
    office: string
    region: string
    businessNo: string
}

function Register() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState<FormData>({
        username: "",
        password: "",
        name: "",
        phone: "",
        email: "",
        office: "",
        region: "",
        businessNo: "",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [openSnackbar, setOpenSnackbar] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const response = await api.post("/api/agent/signup", formData)

            // Check if registration was successful
            if (response.data.success) {
                console.log("Registration successful")
                navigate("/")
            } else {
                setError(response.data.error?.message || "Registration failed. Please try again.")
                setOpenSnackbar(true)
            }
        } catch (err: any) {
            console.error("Registration error:", err)
            setError(err.response?.data?.error?.message || "An error occurred during registration. Please try again.")
            setOpenSnackbar(true)
        } finally {
            setLoading(false)
        }
    }

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false)
    }

    return (
        <Container component="main" maxWidth="md">
            <Box
                sx={{
                    marginTop: 4,
                    marginBottom: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <Card sx={{ width: "100%", mt: 3 }}>
                    <CardHeader
                        title="Create an account"
                        subheader="Enter your information to create an account"
                        titleTypographyProps={{ align: "center", variant: "h5" }}
                        subheaderTypographyProps={{ align: "center" }}
                    />
                    <CardContent>
                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="username"
                                        label="Username"
                                        name="username"
                                        autoComplete="username"
                                        autoFocus
                                        value={formData.username}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        name="password"
                                        label="Password"
                                        type="password"
                                        id="password"
                                        autoComplete="new-password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="name"
                                        label="Full Name"
                                        name="name"
                                        autoComplete="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="phone"
                                        label="Phone Number"
                                        name="phone"
                                        autoComplete="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="email"
                                        label="Email Address"
                                        name="email"
                                        autoComplete="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="office"
                                        label="Office"
                                        name="office"
                                        value={formData.office}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="region"
                                        label="Region"
                                        name="region"
                                        value={formData.region}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        id="businessNo"
                                        label="Business Number"
                                        name="businessNo"
                                        value={formData.businessNo}
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                </Grid>
                            </Grid>
                            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
                                {loading ? "Registering..." : "Register"}
                            </Button>
                        </Box>
                    </CardContent>
                    <Divider />
                    <CardActions>
                        <Box sx={{ width: "100%", textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary">
                                Already have an account?{" "}
                                <Link to="/" style={{ textDecoration: "none" }}>
                                    Sign in
                                </Link>
                            </Typography>
                        </Box>
                    </CardActions>
                </Card>
            </Box>

            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    )
}

export default Register

