import type React from "react"
import {useState} from "react"
import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Container,
    FormControlLabel,
    Grid,
    IconButton,
    Paper,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material"
import {ArrowBack} from "@mui/icons-material"
import {useNavigate} from "react-router-dom"
import {type CreateCustomerRequest, customerApi} from "@/domain/customer/services/customerApi"
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers"
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs"
import dayjs from "dayjs"
import "dayjs/locale/ko"

const CustomerAdd = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<CreateCustomerRequest>({
        name: "",
        birthday: "",
        phone: "",
        email: "",
        job: "",
        isVip: false,
        memo: "",
        consent: false,
        interestProperty: "",
        interestLocation: "",
        assetStatus: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target

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
                setFormData(prev => ({...prev, [name]: formattedPhone}))
            }
        } else {
            setFormData(prev => ({...prev, [name]: value}))
        }
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, checked} = e.target
        setFormData((prev) => ({...prev, [name]: checked}))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.phone || !formData.email || !formData.birthday) {
            setError("이름, 전화번호, 이메일, 생년월일은 필수 입력 항목입니다.")
            return
        }

        if (formData.birthday && dayjs(formData.birthday).isAfter(dayjs())) {
            setError("생년월일은 현재 날짜 이전이어야 합니다.");
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response = await customerApi.createCustomer(formData)

            if (response.data.success) {
                setSuccess(true)
                navigate("/customer-management")

            } else {
                if (response.data.error?.code == "4092") {
                    setError("이미 등록된 전화번호입니다.")
                } else if (response.data.error?.code == "4093") {
                    setError("이미 등록된 이메일입니다.")
                } else {
                    setError("고객 등록에 실패했습니다.")
                }
            }
        } catch (err: any) {
            console.error("Error creating customer:", err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box sx={{flexGrow: 1, minHeight: "100vh"}}>
            <Container
                maxWidth="md"
                sx={{
                    mt: 4,
                    mb: 4,
                    mx: "auto",
                    px: {xs: 2, sm: 3, md: 4},
                }}
            >
                <Paper elevation={0} sx={{p: 4, borderRadius: 2, bgcolor: "#ffffff"}}>
                    <Box sx={{display: "flex", alignItems: "center", mb: 4}}>
                        <IconButton onClick={() => navigate("/customer-management")} sx={{mr: 1}}>
                            <ArrowBack/>
                        </IconButton>
                        <Typography variant="h6" sx={{fontWeight: "bold"}}>
                            고객 정보 등록
                        </Typography>
                    </Box>

                    <Typography variant="subtitle2" color="textSecondary" sx={{mb: 3}}>
                        고객의 기본 정보를 입력해주세요.
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <TextField
                                    required
                                    fullWidth
                                    label="이름"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <TextField
                                    required
                                    fullWidth
                                    label="전화번호"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="010-0000-0000"
                                />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <TextField
                                    required
                                    fullWidth
                                    label="이메일"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <TextField fullWidth label="직업" name="job" value={formData.job}
                                           onChange={handleChange}/>
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
                                    <DatePicker
                                        label="생년월일"
                                        value={formData.birthday ? dayjs(formData.birthday) : null}
                                        onChange={(newValue) => {
                                            if (newValue) {
                                                const formattedDate = dayjs(newValue).format('YYYY-MM-DD')
                                                setFormData(prev => ({...prev, birthday: formattedDate}))
                                            } else {
                                                setFormData(prev => ({...prev, birthday: ''}))
                                            }
                                        }}
                                        format="YYYY-MM-DD"
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                required: true,
                                                error: false
                                            }
                                        }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <FormControlLabel
                                    control={<Checkbox checked={formData.isVip} onChange={handleCheckboxChange}
                                                       name="isVip"/>}
                                    label="VIP 고객"
                                />
                            </Grid>
                            <Grid size={12}>
                                <TextField
                                    fullWidth
                                    label="메모"
                                    name="memo"
                                    multiline
                                    rows={4}
                                    value={formData.memo}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid size={12}>
                                <FormControlLabel
                                    control={<Checkbox checked={formData.consent} onChange={handleCheckboxChange}
                                                       name="consent"/>}
                                    label="마케팅 정보 수신에 동의합니다."
                                />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <TextField
                                    fullWidth
                                    label="관심 매물"
                                    name="interestProperty"
                                    value={formData.interestProperty}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <TextField
                                    fullWidth
                                    label="관심 지역"
                                    name="interestLocation"
                                    value={formData.interestLocation}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6
                                }}>
                                <TextField
                                    fullWidth
                                    label="자산 상태"
                                    name="assetStatus"
                                    value={formData.assetStatus}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid sx={{display: "flex", justifyContent: "center", mt: 2}} size={12}>
                                <Button
                                    variant="outlined"
                                    sx={{mr: 1, borderColor: "#ddd", color: "#333"}}
                                    onClick={() => navigate("/customer-management")}
                                    disabled={loading}
                                >
                                    취소
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    sx={{bgcolor: "#007ea7", "&:hover": {bgcolor: "#003459"}}}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24}/> : "고객 등록하기"}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Container>
            <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
                <Alert onClose={() => setError(null)} severity="error" sx={{width: "100%"}}>
                    {error}
                </Alert>
            </Snackbar>
            <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
                <Alert onClose={() => setSuccess(false)} severity="success" sx={{width: "100%"}}>
                    고객이 성공적으로 등록되었습니다. 고객 목록 페이지로 이동합니다.
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default CustomerAdd