import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
    const { name, value } = e.target;
    
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
      
      setFormData(prev => ({ ...prev, [name]: formattedNumber }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
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
        
        if (response.status === 200) {
          setSnackbar({
            open: true,
            message: '회원가입이 완료되었습니다.\n로그인 페이지로 이동합니다.',
            severity: 'success'
          });
          
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } catch (error: any) {
        console.error('Error:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || '회원가입 중 오류가 발생했습니다.',
          severity: 'error'
        });
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 50 }}>
      <Box sx={{ mb: 4 }}>
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          회원가입
        </Typography>
      </Box>
      
      <form onSubmit={handleSubmit}>
        <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            기본 정보
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="username"
              label="아이디"
              value={formData.username}
              onChange={handleChange}
              error={!!errors.username}
              helperText={errors.username}
              required
            />
            <TextField
              name="password"
              type="password"
              label="비밀번호"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              required
            />
            <TextField
              name="passwordConfirm"
              type="password"
              label="비밀번호 확인"
              value={formData.passwordConfirm}
              onChange={handleChange}
              error={!!errors.passwordConfirm}
              helperText={errors.passwordConfirm}
              required
            />
            <TextField
              name="name"
              label="이름"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
            <TextField
              name="phone"
              label="휴대폰 번호"
              value={formData.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
              required
              inputProps={{ maxLength: 13 }}
            />
            <TextField
              name="email"
              label="이메일"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              required
            />
          </Box>
        </Paper>

        <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            부동산 정보
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="office"
              label="부동산 이름"
              value={formData.office}
              onChange={handleChange}
              error={!!errors.office}
              helperText={errors.office}
            />
            <TextField
              name="region"
              label="지역"
              value={formData.region}
              onChange={handleChange}
              error={!!errors.region}
              helperText={errors.region}
            />
            <TextField
              name="businessNo"
              label="사업자 번호"
              value={formData.businessNo}
              onChange={handleChange}
              error={!!errors.businessNo}
              helperText={errors.businessNo}
            />
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/login')}
            sx={{ minWidth: 120 }}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{ minWidth: 120 }}
          >
            가입하기
          </Button>
        </Box>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SignUp; 