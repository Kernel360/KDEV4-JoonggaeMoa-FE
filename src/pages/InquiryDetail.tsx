import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    CircularProgress,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Inquiry, InquiryConsultationRequest } from '../types/inquiry';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
// Update the import statement at the top
import logo from '../../public/배경없는 로고.ico';

const InquiryDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [inquiry, setInquiry] = useState<Inquiry | null>(null);
    const [answer, setAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [password, setPassword] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [editedInquiry, setEditedInquiry] = useState({
        title: '',
        content: '',
        name: '',
        password: ''
    });
    const [consultation, setConsultation] = useState<InquiryConsultationRequest>({
        agentId: 0,
        name: '',
        email: '',
        phone: '',
        consent: false,
        consultAt: new Date().toLocaleString('sv', { 
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false 
        }).replace(',', '')
    });

    const fetchInquiry = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/inquiries/${id}`);
            if (response.data.success) {
                setInquiry(response.data.data);
                setEditedInquiry({
                    title: response.data.data.title || '',
                    content: response.data.data.content || '',
                    name: response.data.data.name || '',
                    password: ''
                });
            }
        } catch (err) {
            setError('문의글을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiry();
    }, [id]);

    const handleSubmitAnswer = async () => {
        try {
            const response = await api.post(`/api/inquiries/${id}`, {
                content: answer
            });
            if (response.data.success) {
                fetchInquiry();
                setAnswer('');
            }
        } catch (err: any) {
            if (err.response?.data?.error?.code === 4042) {
                setError('로그인이 필요한 서비스입니다.');
            } else {
                setError('답변 작성에 실패했습니다.');
            }
        }
    };

   const handleEdit = async () => {
        try {
            // Validate fields
            if (!editedInquiry.title.trim() || !editedInquiry.content.trim() || !password.trim()) {
                setError('제목, 내용, 비밀번호를 모두 입력해주세요.');
                return;
            }

            const requestData = {
                password: password,
                title: editedInquiry.title,
                content: editedInquiry.content
            };

            console.log('Request Data:', requestData);
            
            const response = await api.patch(`/api/inquiries/${id}`, requestData);
            console.log('Response:', response.data);

            if (!response.data.success) {
                const code = response.data.error?.code;
                console.log('Error Code:', code);

                if (code === 4006 || code === 4003) {
                    setError('비밀번호가 일치하지 않습니다.');
                } else if (code === 4004) {
                    setError('존재하지 않는 문의글입니다.');
                } else {
                    setError('문의글 수정에 실패했습니다.');
                }
                return;
            }

            setEditMode(false);
            setPassword('');
            fetchInquiry();
        } catch (err: any) {
            console.error('Error details:', err.response?.data);
            setError('서버 요청 중 오류가 발생했습니다.');
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }


    // Update the function signature and payload creation
    const handleSubmitConsultation = async (answerData: any) => {
        try {
            const phoneRegex = /^010-\d{4}-\d{4}$/;
            if (!phoneRegex.test(consultation.phone)) {
                setError('전화번호 형식이 올바르지 않습니다.');
                return;
            }
    
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
            if (!emailRegex.test(consultation.email)) {
                setError('이메일 형식이 올바르지 않습니다.');
                return;
            }
    
            const consultDate = new Date(consultation.consultAt);
            if (consultDate <= new Date()) {
                setError('상담 일시는 현재 시간 이후로 선택해주세요.');
                return;
            }
    
            if (!consultation.name.trim() || !consultation.consent) {
                setError('모든 필수 항목을 입력해주세요.');
                return;
            }
    
            const payload = {
                ...consultation,
                consultAt: new Date(consultation.consultAt)
                    .toLocaleString('sv', { 
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }).replace(',', '') 
            };
    
            const response = await api.post('/api/inquiries/consultations', payload);
            if (response.data.success) {
                setOpenDialog(false);
                setConsultation({
                    agentId: 0,
                    name: '',
                    email: '',
                    phone: '',
                    consent: false,
                    consultAt: new Date().toISOString()
                });
            }
        } catch (err: any) {
            if (err.response?.data?.error?.code === 4003) {
                setError('잘못된 데이터 형식입니다.');
            } else {
                setError('상담 신청에 실패했습니다.');
            }
        }
    };


    return (
        <Box sx={{ p: 3, bgcolor: '#f5f5f5' }}>
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                mb: 4,
                pb: 2,
                borderBottom: '2px solid #333'
            }}>
                <img 
                    src="/배경없는 로고.ico"
                    alt="중개모아 로고" 
                    style={{ height: '50px', marginBottom: '8px' }} 
                />
                <Typography 
                    variant="h5" 
                    sx={{ 
                        color: '#333',
                        fontWeight: 'bold',
                        letterSpacing: '0.1em'
                    }}
                >
                    중개모아
                </Typography>
            </Box>

            <Button 
                variant="contained" 
                onClick={() => navigate('/inquiry')} 
                sx={{ 
                    mb: 3,
                    backgroundColor: '#333',
                    '&:hover': {
                        backgroundColor: '#000'
                    }
                }}
            >
                목록으로 돌아가기
            </Button>

            {inquiry && (
                <Paper sx={{ p: 3, backgroundColor: '#fff', boxShadow: 3 }}>
                    {!editMode ? (
                        <>
                            <Typography variant="h5" sx={{ mb: 2, color: '#333', fontWeight: 'bold' }}>
                                {inquiry.title}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ mb: 3, color: '#666' }}>
                                작성자: {inquiry.name} | 작성일: {new Date(inquiry.createdAt).toLocaleString()}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 4, whiteSpace: 'pre-wrap', color: '#333' }}>
                                {inquiry.content}
                            </Typography>
                            <Button 
                                variant="outlined" 
                                onClick={() => setEditMode(true)}
                                sx={{ 
                                    mb: 3,
                                    color: '#333',
                                    borderColor: '#333',
                                    '&:hover': {
                                        borderColor: '#000',
                                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                    }
                                }}
                            >
                                수정하기
                            </Button>
                        </>
                    ) : (
                        <Box sx={{ mb: 4 }}>
                            <TextField
                                fullWidth
                                label="제목"
                                value={editedInquiry.title}
                                onChange={(e) => setEditedInquiry({ ...editedInquiry, title: e.target.value })}
                                sx={{ 
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#333'
                                        }
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#333'
                                    }
                                }}
                            />
                            <TextField
                                fullWidth
                                label="내용"
                                multiline
                                rows={4}
                                value={editedInquiry.content}
                                onChange={(e) => setEditedInquiry({ ...editedInquiry, content: e.target.value })}
                                sx={{ 
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#333'
                                        }
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#333'
                                    }
                                }}
                            />
                            <TextField
                                fullWidth
                                label="비밀번호"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                sx={{ 
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#333'
                                        }
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#333'
                                    }
                                }}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button 
                                    variant="contained" 
                                    onClick={handleEdit}
                                    sx={{
                                        backgroundColor: '#333',
                                        '&:hover': {
                                            backgroundColor: '#000'
                                        }
                                    }}
                                >
                                    저장
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    onClick={() => setEditMode(false)}
                                    sx={{
                                        color: '#333',
                                        borderColor: '#333',
                                        '&:hover': {
                                            borderColor: '#000',
                                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                        }
                                    }}
                                >
                                    취소
                                </Button>
                            </Box>
                        </Box>
                    )}

                    <Typography variant="h6" sx={{ mt: 4, mb: 2, color: '#333', fontWeight: 'bold' }}>
                        답변
                    </Typography>
                    {inquiry.answers.map((answer, index) => (
                        <Paper 
                            key={index} 
                            sx={{ 
                                p: 2, 
                                mb: 2, 
                                bgcolor: '#f8f9fa',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px'
                            }}
                        >
                            <Typography variant="subtitle2" sx={{ color: '#333', fontWeight: 'bold' }}>
                                {answer.agentName} ({answer.agentOffice} - {answer.agentRegion})
                            </Typography>
                            <Typography variant="body1" sx={{ my: 1, color: '#333' }}>
                                {answer.content}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                <Typography variant="caption" sx={{ color: '#666' }}>
                                    {new Date(answer.createdAt).toLocaleString()}
                                </Typography>
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => {
                                        console.log('Agent ID:', answer.agentId);
                                        setConsultation(prev => ({ ...prev, agentId: answer.agentId }));
                                        console.log('Consultation Object:', consultation);
                                        setOpenDialog(true);
                                    }}
                                    sx={{
                                        backgroundColor: '#666',
                                        '&:hover': {
                                            backgroundColor: '#666'
                                        }
                                    }}
                                >
                                    상담 신청
                                </Button>
                            </Box>
                        </Paper>
                    ))}

                    {isAuthenticated && (
                        <Box sx={{ mt: 3 }}>
                            <TextField
                                fullWidth
                                label="답변 작성"
                                multiline
                                rows={4}
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#333'
                                        }
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#333'
                                    }
                                }}
                            />
                            <Button 
                                variant="contained" 
                                onClick={handleSubmitAnswer}
                                sx={{ 
                                    mt: 2,
                                    backgroundColor: '#333',
                                    '&:hover': {
                                        backgroundColor: '#000'
                                    }
                                }}
                            >
                                답변 등록
                            </Button>
                        </Box>
                    )}
                </Paper>
            )}

            <Snackbar 
                open={!!error} 
                autoHideDuration={6000} 
                onClose={() => setError(null)}
            >
                <Alert 
                    onClose={() => setError(null)} 
                    severity="error"
                    sx={{ 
                        backgroundColor: '#d32f2f',
                        color: '#fff'
                    }}
                >
                    {error}
                </Alert>
            </Snackbar>

            <Dialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{
                    sx: { 
                        borderRadius: 2,
                        bgcolor: '#f8f9fa'
                    }
                }}
            >
                <DialogTitle sx={{ 
                    borderBottom: '2px solid #333', 
                    color: '#333',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    pb: 2
                }}>
                    상담 신청하기
                </DialogTitle>
                <DialogContent sx={{ mt: 3, mb: 2 }}>
                    <TextField
                        fullWidth
                        label="이름"
                        margin="normal"
                        value={consultation.name}
                        onChange={(e) => setConsultation({ ...consultation, name: e.target.value })}
                        sx={{ 
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                    borderColor: '#333'
                                }
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#333'
                            }
                        }}
                    />
                    <TextField
                        fullWidth
                        label="전화번호"
                        type="phone"
                        margin="normal"
                        value={consultation.phone}
                        onChange={(e) => setConsultation({ ...consultation, phone: e.target.value })}
                        helperText="예) 010-1234-5678"
                        sx={{ 
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                    borderColor: '#333'
                                }
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#333'
                            },
                            '& .MuiFormHelperText-root': {
                                color: '#666'
                            }
                        }}
                    />
                    <TextField
                        fullWidth
                        label="이메일"
                        type="email"
                        margin="normal"
                        value={consultation.email}
                        onChange={(e) => setConsultation({ ...consultation, email: e.target.value })}
                        helperText="예) email@email.com"
                        sx={{ 
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                    borderColor: '#333'
                                }
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#333'
                            }
                        }}
                    />
                </DialogContent>
                <DialogContent sx={{ mb: 2 }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                        <DateTimePicker
                            label="상담 희망 일시"
                            value={consultation.consultAt ? new Date(consultation.consultAt) : null}
                            onChange={(newValue) => {
                                if (newValue) {
                                    const formattedDate = newValue.toISOString().slice(0, 16).replace('T', ' ');
                                    setConsultation({ ...consultation, consultAt: formattedDate });
                                }
                            }}
                            minDateTime={new Date()}
                            format="yyyy-MM-dd HH:mm"
                            sx={{ 
                                width: '100%',
                                mt: 2,
                                '& .MuiOutlinedInput-root': {
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#333'
                                    }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#333'
                                }
                            }}
                        />
                    </LocalizationProvider>
                </DialogContent>
                <DialogContent sx={{ mb: 2 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={consultation.consent}
                                onChange={(e) => setConsultation({ ...consultation, consent: e.target.checked })}
                            />
                        }
                        label="개인정보 수집 및 이용에 동의합니다"
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                
                <DialogActions sx={{ 
                    p: 3, 
                    borderTop: '1px solid #e0e0e0',
                    gap: 1
                }}>
                    <Button 
                        onClick={() => setOpenDialog(false)}
                        variant="outlined"
                        sx={{ 
                            color: '#333',
                            borderColor: '#333',
                            '&:hover': {
                                borderColor: '#000',
                                backgroundColor: 'rgba(0, 0, 0, 0.04)'
                            }
                        }}
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleSubmitConsultation} 
                        variant="contained"
                        sx={{
                            backgroundColor: '#333',
                            '&:hover': {
                                backgroundColor: '#000'
                            }
                        }}
                    >
                        상담 신청
                    </Button>
                </DialogActions>
            </Dialog>
            
        </Box>
    );
};

export default InquiryDetail;