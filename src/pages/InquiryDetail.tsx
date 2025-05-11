import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Paper,
    Snackbar,
    TextField,
    Typography
} from '@mui/material';
import {useAuth} from '../context/AuthContext';
import api from '../services/api';
import {InquiryConsultationRequest, InquiryDetailResponse} from '../types/inquiry';
import {LocalizationProvider} from '@mui/x-date-pickers';
import {DateTimePicker} from '@mui/x-date-pickers/DateTimePicker';
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFns';
import {ko} from 'date-fns/locale';

const InquiryDetail: React.FC = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const {isAuthenticated} = useAuth();
    const [inquiry, setInquiry] = useState<InquiryDetailResponse | null>(null);
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
            const response = await api.post(`/api/inquiries-answers/${id}`, {
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
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <CircularProgress/>
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

            const emailRegex = /^.+@.+\..+$/.test(consultation.email);
            if (!emailRegex) {
                setError('이메일 형식이 올바르지 않습니다.');
                return;
            }


            const consultDate = new Date(consultation.consultAt);
            const now = new Date();

            if (consultDate.getTime() <= now.getTime()) {
                setError('상담 일시는 현재 시간 이후로 선택해주세요.');
                return;
            }

            const twoMonthsLater = new Date(now);
            twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

            if (consultDate > twoMonthsLater) {
                setError('상담 일시는 오늘부터 2달 이내로 선택해주세요.');
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
        <Box sx={{p: 3}}>
            <Box sx={{
                maxWidth: '1200px',
                mx: 'auto',
                px: 4
            }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    mb: 4,
                    pb: 2,
                    borderBottom: '2px solid #333'
                }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            cursor: 'pointer',
                            flexGrow: 1
                        }}
                        onClick={() => navigate('/inquiry')}
                    >
                        <img
                            src="/로고.png"
                            alt="중개모아 로고"
                            style={{height: '50px'}}
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
                </Box>

                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3
                }}>
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/inquiry')}
                        sx={{
                            borderColor: "#007ea7",
                            color: "#007ea7",
                            '&:hover': {
                                borderColor: "#003459",
                                color: "#003459",
                                bgcolor: 'rgba(0, 126, 167, 0.08)'
                            }
                        }}
                    >
                        돌아가기
                    </Button>
                    {!editMode && (
                        <Button
                            variant="outlined"
                            onClick={() => setEditMode(true)}
                            sx={{
                                borderColor: "#007ea7",
                                color: "#007ea7",
                                '&:hover': {
                                    borderColor: "#003459",
                                    color: "#003459",
                                    bgcolor: 'rgba(0, 126, 167, 0.08)'
                                }
                            }}
                        >
                            수정하기
                        </Button>
                    )}
                </Box>

                {inquiry && (
                    <Paper sx={{p: 3, backgroundColor: '#fff', boxShadow: 3}}>
                        {!editMode ? (
                            <>
                                <Typography variant="h5" sx={{mb: 2, color: '#333', fontWeight: 'bold'}}>
                                    {inquiry.title}
                                </Typography>
                                <Typography variant="subtitle2" sx={{mb: 3, color: '#666'}}>
                                    작성자: {inquiry.name} | 작성일: {new Date(inquiry.createdAt).toLocaleString()}
                                </Typography>
                                <Typography variant="body1" sx={{mb: 4, whiteSpace: 'pre-wrap', color: '#333'}}>
                                    {inquiry.content}
                                </Typography>
                            </>
                        ) : (
                            <Box sx={{mb: 4}}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        mb: 3,
                                        borderRadius: 2,
                                        bgcolor: '#f8f9fa',
                                        border: '1px solid #e9ecef'
                                    }}
                                >
                                    <Typography variant="subtitle1" sx={{mb: 2, color: '#003459', fontWeight: 500}}>
                                        문의글 수정
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        label="제목"
                                        value={editedInquiry.title}
                                        onChange={(e) => setEditedInquiry({...editedInquiry, title: e.target.value})}
                                        sx={{
                                            mb: 2,
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#007ea7'
                                                }
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': {
                                                color: '#007ea7'
                                            }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="내용"
                                        multiline
                                        rows={6}
                                        value={editedInquiry.content}
                                        onChange={(e) => setEditedInquiry({...editedInquiry, content: e.target.value})}
                                        sx={{
                                            mb: 2,
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#007ea7'
                                                }
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': {
                                                color: '#007ea7'
                                            }
                                        }}
                                    />
                                    <TextField
                                        fullWidth
                                        label="비밀번호"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        helperText="수정을 위해 비밀번호를 입력해주세요"
                                        sx={{
                                            mb: 2,
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused fieldset': {
                                                    borderColor: '#007ea7'
                                                }
                                            },
                                            '& .MuiInputLabel-root.Mui-focused': {
                                                color: '#007ea7'
                                            },
                                            '& .MuiFormHelperText-root': {
                                                color: '#666'
                                            }
                                        }}
                                    />
                                </Paper>
                                <Box sx={{display: 'flex', gap: 1, justifyContent: 'flex-end'}}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setEditMode(false)}
                                        sx={{
                                            borderColor: "#007ea7",
                                            color: "#007ea7",
                                            '&:hover': {
                                                borderColor: "#003459",
                                                color: "#003459",
                                                bgcolor: 'rgba(0, 126, 167, 0.08)'
                                            }
                                        }}
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={handleEdit}
                                        sx={{
                                            bgcolor: '#007ea7',
                                            '&:hover': {bgcolor: '#003459'},
                                            textTransform: 'none',
                                            boxShadow: 2,
                                        }}
                                    >
                                        저장
                                    </Button>
                                </Box>
                            </Box>
                        )}

                        <Typography variant="h6" sx={{mt: 4, mb: 2, color: '#333', fontWeight: 'bold'}}>
                            답변
                        </Typography>
                        {inquiry.answers.map((answer) => (
                            <Paper
                                key={answer.agentId}
                                elevation={0}
                                sx={{
                                    p: 3,
                                    mb: 2,
                                    borderRadius: 2,
                                    border: '1px solid #e9ecef',
                                    backgroundColor: '#fff',
                                    '&:hover': {
                                        borderColor: '#003459',
                                        boxShadow: '0 2px 8px rgba(0, 52, 89, 0.15)'
                                    }
                                }}
                            >
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 2,
                                    pb: 2,
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{
                                                color: '#003459',
                                                fontWeight: 600
                                            }}
                                        >
                                            {answer.agentName}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: '#666',
                                                ml: 1
                                            }}
                                        >
                                            {answer.agentOffice} | {answer.agentRegion}
                                        </Typography>
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#666',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        {new Date(answer.createdAt).toLocaleString()}
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        color: '#333',
                                        whiteSpace: 'pre-wrap',
                                        lineHeight: 1.6,
                                        mb: 2
                                    }}
                                >
                                    {answer.content}
                                </Typography>
                                <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            setConsultation({
                                                ...consultation,
                                                agentId: answer.agentId
                                            });
                                            setOpenDialog(true);
                                        }}
                                        sx={{
                                            bgcolor: '#003459',
                                            color: '#fff',
                                            '&:hover': {
                                                bgcolor: '#002845'
                                            },
                                            textTransform: 'none',
                                            px: 3
                                        }}
                                    >
                                        상담 신청하기
                                    </Button>
                                </Box>
                            </Paper>
                        ))}

                        {isAuthenticated && (
                            <Box sx={{mt: 3}}>
                                <TextField
                                    fullWidth
                                    label="답변 작성"
                                    multiline
                                    rows={4}
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    inputProps={{maxLength: 255}}
                                    helperText={`${answer.length}/255`}
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
                                <Box sx={{display: 'flex', justifyContent: 'flex-end', mt: 2}}>
                                    <Button
                                        variant="contained"
                                        onClick={handleSubmitAnswer}
                                        sx={{
                                            bgcolor: '#007ea7',
                                            '&:hover': {bgcolor: '#003459'},
                                            textTransform: 'none',
                                            boxShadow: 2,
                                        }}
                                    >
                                        답변 등록
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Paper>
                )}
            </Box>

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
                <DialogContent sx={{mt: 2}}>
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
                        <TextField
                            fullWidth
                            label="이름"
                            margin="normal"
                            value={consultation.name}
                            onChange={(e) => setConsultation({...consultation, name: e.target.value})}
                            error={!!error && !consultation.name}
                            helperText={!!error && !consultation.name ? '이름을 입력해주세요' : ''}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#003459'
                                    }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#003459'
                                }
                            }}
                        />
                        <TextField
                            fullWidth
                            label="전화번호"
                            type="tel"
                            margin="normal"
                            value={consultation.phone}
                            onChange={(e) => {
                                let value = e.target.value.replace(/[^0-9]/g, '');
                                if (value.length > 0) {
                                    if (value.length <= 3) {
                                        value = value;
                                    } else if (value.length <= 7) {
                                        value = value.slice(0, 3) + '-' + value.slice(3);
                                    } else {
                                        value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11);
                                    }
                                }
                                setConsultation({...consultation, phone: value});
                            }}
                            error={!!error && (!consultation.phone || !/^010-\d{4}-\d{4}$/.test(consultation.phone))}
                            helperText={!!error && (!consultation.phone || !/^010-\d{4}-\d{4}$/.test(consultation.phone)) ? '올바른 전화번호 형식이 아닙니다' : '예) 010-1234-5678'}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#003459'
                                    }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#003459'
                                }
                            }}
                        />
                        <TextField
                            fullWidth
                            label="이메일"
                            type="email"
                            margin="normal"
                            value={consultation.email}
                            onChange={(e) => setConsultation({...consultation, email: e.target.value})}
                            error={!!error && (!consultation.email || !/^.+@.+\..+$/.test(consultation.email))}
                            helperText={!!error && (!consultation.email || !/^.+@.+\..+$/.test(consultation.email)) ? '올바른 이메일 형식이 아닙니다' : '예) email@email.com'}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#003459'
                                    }
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#003459'
                                }
                            }}
                        />
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                            <DateTimePicker
                                label="상담 희망 일시"
                                value={consultation.consultAt ? new Date(consultation.consultAt) : null}
                                onChange={(newValue) => {
                                    if (newValue) {
                                        const now = new Date();
                                        const twoMonthsLater = new Date();
                                        twoMonthsLater.setMonth(now.getMonth() + 2);

                                        // 한국 시간으로 변환
                                        const koreanTime = new Date(newValue.getTime() + (9 * 60 * 60 * 1000));
                                        const year = koreanTime.getUTCFullYear();
                                        const month = String(koreanTime.getUTCMonth() + 1).padStart(2, '0');
                                        const day = String(koreanTime.getUTCDate()).padStart(2, '0');
                                        const hours = String(koreanTime.getUTCHours()).padStart(2, '0');
                                        const minutes = String(koreanTime.getUTCMinutes()).padStart(2, '0');
                                        const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}`;
                                        setConsultation({...consultation, consultAt: formattedDate});
                                        setError(null);
                                    }
                                }}
                                minDateTime={new Date()}
                                maxDateTime={(() => {
                                    const maxDate = new Date();
                                    maxDate.setMonth(maxDate.getMonth() + 2);
                                    return maxDate;
                                })()}
                                format="yyyy-MM-dd HH:mm"
                                sx={{
                                    width: '100%',
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#003459'
                                        }
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#003459'
                                    }
                                }}
                                slotProps={{
                                    textField: {
                                        helperText: "상담 신청은 오늘로부터 2개월 이내로만 가능합니다"
                                    }
                                }}
                            />
                        </LocalizationProvider>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={consultation.consent}
                                    onChange={(e) => setConsultation({...consultation, consent: e.target.checked})}
                                    sx={{
                                        color: '#003459',
                                        '&.Mui-checked': {
                                            color: '#003459',
                                        },
                                    }}
                                />
                            }
                            label="개인정보 수집 및 이용에 동의합니다"
                            sx={{mt: 1}}
                        />
                    </Box>
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
                            color: '#003459',
                            borderColor: '#003459',
                            '&:hover': {
                                borderColor: '#002845',
                                backgroundColor: 'rgba(0, 52, 89, 0.04)'
                            }
                        }}
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleSubmitConsultation}
                        variant="contained"
                        sx={{
                            backgroundColor: '#003459',
                            '&:hover': {
                                backgroundColor: '#002845'
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