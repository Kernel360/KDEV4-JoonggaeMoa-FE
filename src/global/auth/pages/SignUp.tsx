import React, {useState} from 'react';
import {Alert, Box, Button, IconButton, InputAdornment, Link, Snackbar, TextField, Typography,} from '@mui/material';
import {useNavigate} from 'react-router-dom';
import {Badge, Business, Email, LocationOn, Lock, Person, Phone, Visibility, VisibilityOff} from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface FormData {
    username: string;
    password: string;
    passwordConfirm: string;
    name: string;
    phone: string;
    email: string;
    office: string;
    region: string;
    businessNo: string;
}

interface FormErrors {
    username?: string;
    password?: string;
    passwordConfirm?: string;
    name?: string;
    phone?: string;
    email?: string;
    office?: string;
    region?: string;
    businessNo?: string;
}

const SignUp = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<FormData>({
        username: '',
        password: '',
        passwordConfirm: '',
        name: '',
        phone: '',
        email: '',
        office: '',
        region: '',
        businessNo: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' as 'success' | 'error'
    });

    const validateForm = () => {
        const newErrors: FormErrors = {};

        // Username validation
        if (!formData.username) {
            newErrors.username = '아이디를 입력해주세요';
        } else if (formData.username.length < 4 || formData.username.length > 12) {
            newErrors.username = '아이디는 4~12자 사이여야 합니다.';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요';
        } else if (formData.password.length < 4 || formData.password.length > 12) {
            newErrors.password = '비밀번호는 4~12자 사이여야 합니다.';
        }

        // Password confirmation
        if (!formData.passwordConfirm) {
            newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요';
        } else if (formData.password !== formData.passwordConfirm) {
            newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다';
        }

        // Name validation
        if (!formData.name) {
            newErrors.name = '이름을 입력해주세요';
        }

        // Phone validation
        if (!formData.phone) {
            newErrors.phone = '휴대폰 번호를 입력해주세요';
        } else if (!/^\d{11}$/.test(formData.phone.replace(/-/g, ''))) {
            newErrors.phone = '전화번호 형식이 올바르지 않습니다. (예: 000-0000-0000)';
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = '이메일을 입력해주세요';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '이메일 형식이 올바르지 않습니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;

        // 휴대폰 번호 입력 시 자동 포맷팅
        if (name === 'phone') {
            const numbersOnly = value.replace(/[^\d]/g, '');
            let formattedNumber = numbersOnly;

            if (numbersOnly.length > 0) {
                if (numbersOnly.length <= 3) {
                    formattedNumber = numbersOnly;
                } else if (numbersOnly.length <= 7) {
                    formattedNumber = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3)}`;
                } else {
                    formattedNumber = `${numbersOnly.slice(0, 3)}-${numbersOnly.slice(3, 7)}-${numbersOnly.slice(7, 11)}`;
                }
            }

            setFormData(prev => ({...prev, [name]: formattedNumber}));
            return;
        }

        setFormData(prev => ({...prev, [name]: value}));
    };

    const formatPhoneNumber = (phone: string) => {
        // 이미 하이픈이 포함된 형식이면 그대로 반환
        if (phone.includes('-')) {
            return phone;
        }
        // 숫자만 있는 경우 하이픈 추가
        return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            try {
                const formattedData = {
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    phone: formatPhoneNumber(formData.phone),
                    email: formData.email,
                    office: formData.office,
                    region: formData.region,
                    businessNo: formData.businessNo,
                };

                const response = await axios.post(
                    `${API_BASE_URL}/api/agents/signup`,
                    formattedData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (response.data.success) {
                    setSnackbar({
                        open: true,
                        message: '회원가입이 완료되었습니다.\n로그인 페이지로 이동합니다.',
                        severity: 'success'
                    });

                    navigate('/login');
                }
            } catch (error: any) {
                console.error('Error:', error);
                if (error.response?.data?.error?.code === '4091') {
                    setSnackbar({
                        open: true,
                        message: '이미 사용 중인 아이디입니다.',
                        severity: 'error'
                    });
                } else if (error.response?.data?.error?.code === '4092') {
                    setSnackbar({
                        open: true,
                        message: '이미 사용 중인 핸드폰 번호입니다.',
                        severity: 'error'
                    });
                } else if (error.response?.data?.error?.code === '4093') {
                    setSnackbar({
                        open: true,
                        message: '이미 사용 중인 이메일입니다.',
                        severity: 'error'
                    });
                } else {
                    setSnackbar({
                        open: true,
                        message: error.response?.data?.error?.message || '회원가입 중 오류가 발생했습니다.',
                        severity: 'error'
                    });
                }
            }
        }
    };

    const handleSnackbarClose = () => {
        setSnackbar(prev => ({...prev, open: false}));
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            bgcolor: '#ffffff',
            overflow: 'hidden'
        }}>
            {/* 왼쪽 브랜드 소개 영역 */}
            <Box sx={{
                display: {xs: 'none', lg: 'flex'},
                width: '50%',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 6,
                background: 'linear-gradient(to right, #e6f3f7, #f0f7fa)',
                height: '100vh'
            }}>
                <Box>
                    <Box sx={{width: '90px', mb: 4}}>
                        <img
                            src="/로고.png"
                            alt="브랜드 로고"
                            style={{width: '100%'}}
                        />
                    </Box>
                    <Typography variant="h2" sx={{
                        color: '#007ea7',
                        fontWeight: 700,
                        mb: 3,
                        fontSize: '2.5rem',
                        lineHeight: 1.2
                    }}>
                        부동산 중개의<br/>새로운 기준
                    </Typography>
                    <Typography sx={{
                        color: '#00a8e8',
                        fontSize: '1.25rem',
                        mb: 4
                    }}>
                        더 쉽고 편리한 부동산 중개 서비스로<br/>
                        여러분의 성공을 지원합니다.
                    </Typography>
                </Box>

                <Box>
                    <Box sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 2,
                        mb: 4
                    }}>
                        {[
                            {icon: 'home', title: '매물 관리', desc: '효율적인 관리'},
                            {icon: 'handshake', title: '계약 관리', desc: '안전한 계약'},
                            {icon: 'chart-line', title: '실적 분석', desc: '성과 확인'}
                        ].map((item, i) => (
                            <Box key={i} sx={{
                                bgcolor: 'rgba(255,255,255,0.8)',
                                p: 2,
                                borderRadius: 2,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <Typography sx={{color: '#007ea7', mb: 1, fontWeight: 600}}>
                                    {item.title}
                                </Typography>
                                <Typography sx={{color: '#007ea7', fontSize: '0.875rem'}}>
                                    {item.desc}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                    <Typography sx={{color: '#007ea7', fontSize: '0.875rem'}}>
                        © 2025 중개모아. All rights reserved.
                    </Typography>
                </Box>
            </Box>

            {/* 오른쪽 회원가입 폼 */}
            <Box sx={{
                width: {xs: '100%', lg: '50%'},
                display: 'flex',
                flexDirection: 'column',
                p: 4,
                overflow: 'auto',
                height: '100vh'
            }}>
                <Box sx={{
                    width: '100%',
                    maxWidth: '32rem',
                    mx: 'auto',
                    pt: 4
                }}>
                    <Box sx={{textAlign: {xs: 'center', lg: 'left'}, mb: 5}}>
                        <Typography variant="h4" sx={{
                            fontWeight: 700,
                            color: 'text.primary',
                            mb: 1
                        }}>
                            회원가입
                        </Typography>
                        <Typography sx={{color: 'text.secondary'}}>
                            중개모아의 새로운 회원이 되어주세요.
                        </Typography>
                    </Box>

                    <form onSubmit={handleSubmit}>
                        <Box sx={{mb: 4}}>
                            <Typography variant="h6" sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                mb: 2
                            }}>
                                기본 정보
                            </Typography>

                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                <Box>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        mb: 1
                                    }}>
                                        아이디 <Box component="span" sx={{color: 'error.main'}}>*</Box>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="username"
                                        placeholder="아이디를 입력하세요"
                                        value={formData.username}
                                        onChange={handleChange}
                                        error={!!errors.username}
                                        helperText={errors.username}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Person sx={{color: 'text.secondary'}}/>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '& fieldset': {
                                                    borderColor: 'grey.300',
                                                },
                                            },
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        mb: 1
                                    }}>
                                        비밀번호 <Box component="span" sx={{color: 'error.main'}}>*</Box>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="비밀번호를 입력하세요"
                                        value={formData.password}
                                        onChange={handleChange}
                                        error={!!errors.password}
                                        helperText={errors.password}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock sx={{color: 'text.secondary'}}/>
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff/> : <Visibility/>}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '& fieldset': {
                                                    borderColor: 'grey.300',
                                                },
                                            },
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        mb: 1
                                    }}>
                                        비밀번호 확인 <Box component="span" sx={{color: 'error.main'}}>*</Box>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="passwordConfirm"
                                        type={showPasswordConfirm ? 'text' : 'password'}
                                        placeholder="비밀번호를 다시 입력하세요"
                                        value={formData.passwordConfirm}
                                        onChange={handleChange}
                                        error={!!errors.passwordConfirm}
                                        helperText={errors.passwordConfirm}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock sx={{color: 'text.secondary'}}/>
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                                        edge="end"
                                                    >
                                                        {showPasswordConfirm ? <VisibilityOff/> : <Visibility/>}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '& fieldset': {
                                                    borderColor: 'grey.300',
                                                },
                                            },
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        mb: 1
                                    }}>
                                        이름 <Box component="span" sx={{color: 'error.main'}}>*</Box>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="name"
                                        placeholder="이름을 입력하세요"
                                        value={formData.name}
                                        onChange={handleChange}
                                        error={!!errors.name}
                                        helperText={errors.name}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Person sx={{color: 'text.secondary'}}/>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '& fieldset': {
                                                    borderColor: 'grey.300',
                                                },
                                            },
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        mb: 1
                                    }}>
                                        휴대폰 번호 <Box component="span" sx={{color: 'error.main'}}>*</Box>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="phone"
                                        placeholder="휴대폰 번호를 입력하세요"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        error={!!errors.phone}
                                        helperText={errors.phone}
                                        inputProps={{maxLength: 13}}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Phone sx={{color: 'text.secondary'}}/>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '& fieldset': {
                                                    borderColor: 'grey.300',
                                                },
                                            },
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        mb: 1
                                    }}>
                                        이메일 <Box component="span" sx={{color: 'error.main'}}>*</Box>
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="email"
                                        type="email"
                                        placeholder="이메일을 입력하세요"
                                        value={formData.email}
                                        onChange={handleChange}
                                        error={!!errors.email}
                                        helperText={errors.email}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Email sx={{color: 'text.secondary'}}/>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '& fieldset': {
                                                    borderColor: 'grey.300',
                                                },
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{mb: 4}}>
                            <Typography variant="h6" sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                mb: 2
                            }}>
                                부동산 정보
                            </Typography>

                            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                                <Box>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        mb: 1
                                    }}>
                                        부동산 이름
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="office"
                                        placeholder="부동산 이름을 입력하세요"
                                        value={formData.office}
                                        onChange={handleChange}
                                        error={!!errors.office}
                                        helperText={errors.office}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Business sx={{color: 'text.secondary'}}/>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '& fieldset': {
                                                    borderColor: 'grey.300',
                                                },
                                            },
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        mb: 1
                                    }}>
                                        지역
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="region"
                                        placeholder="지역을 입력하세요"
                                        value={formData.region}
                                        onChange={handleChange}
                                        error={!!errors.region}
                                        helperText={errors.region}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <LocationOn sx={{color: 'text.secondary'}}/>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '& fieldset': {
                                                    borderColor: 'grey.300',
                                                },
                                            },
                                        }}
                                    />
                                </Box>

                                <Box>
                                    <Typography sx={{
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: 'text.primary',
                                        mb: 1
                                    }}>
                                        사업자 번호
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="businessNo"
                                        placeholder="사업자 번호를 입력하세요"
                                        value={formData.businessNo}
                                        onChange={handleChange}
                                        error={!!errors.businessNo}
                                        helperText={errors.businessNo}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Badge sx={{color: 'text.secondary'}}/>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 2,
                                                '& fieldset': {
                                                    borderColor: 'grey.300',
                                                },
                                            },
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{display: 'flex', gap: 2, mb: 4}}>
                            <Button
                                type="submit"
                                variant="contained"
                                sx={{
                                    flex: 1,
                                    py: 1.5,
                                    bgcolor: 'rgba(0, 168, 232, 0.8)',
                                    '&:hover': {
                                        bgcolor: '#00a8e8',
                                    },
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                }}
                            >
                                가입하기
                            </Button>
                        </Box>

                        <Box sx={{
                            mt: 4,
                            textAlign: 'center'
                        }}>
                            <Typography sx={{color: 'text.secondary'}}>
                                이미 계정이 있으신가요?{' '}
                                <Link
                                    component="button"
                                    variant="body2"
                                    onClick={() => navigate('/login')}
                                    sx={{
                                        textDecoration: 'none',
                                        color: '#00a8e8',
                                        fontWeight: 500
                                    }}
                                >
                                    로그인
                                </Link>
                            </Typography>
                        </Box>
                    </form>
                </Box>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert
                    onClose={handleSnackbarClose}
                    severity={snackbar.severity}
                    sx={{width: '100%', borderRadius: 2}}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default SignUp; 