import React, {useEffect, useState} from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Pagination,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import {useAuth} from '../context/AuthContext';
import api from '../services/api';
import {InquiryRequest, InquiryResponse} from '../types/inquiry';
import {useNavigate} from 'react-router-dom';
import ChatbotDialog from '../components/ChatbotDialog';
import ChatIcon from '@mui/icons-material/Chat';

const InquiryBoard: React.FC = () => {
    const navigate = useNavigate();

    const [inquiries, setInquiries] = useState<InquiryResponse[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [newInquiry, setNewInquiry] = useState<InquiryRequest>({
        name: '',
        password: '',
        title: '',
        content: '',
    });
    const {isAuthenticated} = useAuth();
    const [openChatbot, setOpenChatbot] = useState(false);

    const fetchInquiries = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/inquiries?page=${page}&size=10&sort=createdAt,desc`);
            if (response.data.success) {
                setInquiries(response.data.data.content);
                setTotalPages(response.data.data.totalPages);
            }
        } catch (err) {
            setError('문의글을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInquiries();
    }, [page]);

    const handleSubmitInquiry = async () => {
        try {
            if (newInquiry.password.length < 4 || newInquiry.password.length > 12) {
                setError('비밀번호는 4~12자리여야 합니다.');
                return;
            }

            if (newInquiry.content.length > 500) {
                setError('내용은 500자를 초과할 수 없습니다.');
                return;
            }

            const response = await api.post('/api/inquiries', newInquiry);
            if (response.data.success) {
                setOpenDialog(false);
                fetchInquiries();
                setNewInquiry({name: '', password: '', title: '', content: ''});
            }
        } catch (err: any) {
            if (err.response?.data?.error?.code === 4003) {
                setError('잘못된 데이터 형식입니다.');
            } else {
                setError('문의글 작성에 실패했습니다.');
            }
        }
    };

    // Remove handleSubmitAnswer function as it's no longer needed

    return (
        <Box sx={{p: 3}}>
            <Box sx={{
                maxWidth: '1200px',
                mx: 'auto',
                px: 4
            }}>
                {!isAuthenticated && (
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 4,
                        pb: 2,
                        borderBottom: '2px solid #003459'
                    }}>
                        <img
                            src="/로고.png"
                            alt="중개모아 로고"
                            style={{height: '50px'}}
                        />
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                                color: '#003459',
                                fontSize: '1.4rem',
                                transition: 'color 0.2s ease',
                            }}
                        >
                            중개모아
                        </Typography>
                    </Box>
                )}

                <Box sx={{
                    display: 'flex',
                    color: '#003459',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3
                }}>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 800,
                            color: '#003459',
                            fontSize: '1.4rem',
                            transition: 'color 0.2s ease',
                        }}
                    >
                        문의 게시판
                    </Typography>
                    {!isAuthenticated && (
                        <Button
                            variant="contained"
                            onClick={() => setOpenDialog(true)}
                            sx={{
                                bgcolor: '#007ea7',
                                '&:hover': {bgcolor: '#003459'},
                                textTransform: 'none',
                                boxShadow: 2,
                            }}
                        >
                            문의하기
                        </Button>
                    )}
                </Box>

                <TableContainer component={Paper} elevation={0} sx={{
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{
                                backgroundColor: '#e9ecef',
                                borderBottom: '1px solid #e9ecef'
                            }}>
                                <TableCell sx={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#003459'
                                }}>번호</TableCell>
                                <TableCell sx={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#003459'
                                }}>제목</TableCell>
                                <TableCell sx={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#003459'
                                }}>작성자</TableCell>
                                <TableCell sx={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#003459'
                                }}>작성일</TableCell>
                                <TableCell sx={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#003459'
                                }}>답변수</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{py: 5}}>
                                        <CircularProgress sx={{color: '#333'}}/>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                inquiries.map((inquiry) => (
                                    <TableRow
                                        key={inquiry.id}
                                        hover
                                        onClick={() => navigate(`/inquiry/${inquiry.id}`)}
                                        sx={{
                                            cursor: "pointer",
                                            borderBottom: '1px solid #e9ecef',
                                            backgroundColor: 'transparent',
                                            transition: 'background-color 0.2s',
                                            '&:hover': {
                                                backgroundColor: '#f8f9fa'
                                            }
                                        }}
                                    >
                                        <TableCell sx={{
                                            padding: '12px 16px',
                                            fontSize: '0.875rem',
                                            color: '#00171f'
                                        }}>{inquiry.id}</TableCell>
                                        <TableCell sx={{
                                            padding: '12px 16px',
                                            fontSize: '0.875rem',
                                            color: '#00171f'
                                        }}>{inquiry.title}</TableCell>
                                        <TableCell sx={{
                                            padding: '12px 16px',
                                            fontSize: '0.875rem',
                                            color: '#00171f'
                                        }}>{inquiry.name}</TableCell>
                                        <TableCell sx={{
                                            padding: '12px 16px',
                                            fontSize: '0.875rem',
                                            color: '#00171f'
                                        }}>{new Date(inquiry.createdAt).toLocaleString()}</TableCell>
                                        <TableCell sx={{
                                            padding: '12px 16px',
                                            fontSize: '0.875rem',
                                            color: '#00171f'
                                        }}>{inquiry.count}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{mt: 3, display: 'flex', justifyContent: 'center'}}>
                    <Pagination
                        count={totalPages}
                        page={page + 1}
                        onChange={(_, value) => setPage(value - 1)}
                        sx={{
                            '& .Mui-selected': {
                                backgroundColor: '#003459 !important',
                                color: 'white'
                            }
                        }}
                    />
                </Box>
            </Box>

            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        bgcolor: '#ffffff'  // Changed from '#e9ecef' to white
                    }
                }}
            >
                <DialogTitle sx={{
                    borderBottom: '2px solid #003459',
                    color: '#003459',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    pb: 2
                }}>
                    문의하기
                </DialogTitle>
                <DialogContent sx={{mt: 2}}>
                    <TextField
                        fullWidth
                        label="이름"
                        margin="normal"
                        value={newInquiry.name}
                        onChange={(e) => setNewInquiry({...newInquiry, name: e.target.value})}
                        sx={{
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
                        margin="normal"
                        value={newInquiry.password}
                        onChange={(e) => setNewInquiry({...newInquiry, password: e.target.value})}
                        helperText="비밀번호는 4~12자리여야 합니다"
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
                        label="제목"
                        margin="normal"
                        value={newInquiry.title}
                        onChange={(e) => setNewInquiry({...newInquiry, title: e.target.value})}
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
                        label="내용"
                        multiline
                        rows={4}
                        margin="normal"
                        value={newInquiry.content}
                        onChange={(e) => setNewInquiry({...newInquiry, content: e.target.value})}
                        inputProps={{maxLength: 500}}
                        helperText={`${newInquiry.content.length}/500자`}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '&.Mui-focused fieldset': {
                                    borderColor: '#007ea7'
                                }
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                                color: '#007ea7'
                            },
                            '& .MuiFormHelperText-root': {
                                color: '#00171f'
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{
                    p: 3,
                    borderTop: '1px solid #e9ecef',
                    gap: 1
                }}>
                    <Button
                        onClick={() => setOpenDialog(false)}
                        variant="outlined"
                        sx={{
                            color: '#007ea7',
                            borderColor: '#007ea7',
                            '&:hover': {
                                borderColor: '#003459',
                                backgroundColor: 'rgba(0, 126, 167, 0.04)'
                            }
                        }}
                    >
                        취소
                    </Button>
                    <Button
                        onClick={handleSubmitInquiry}
                        variant="contained"
                        sx={{
                            backgroundColor: '#007ea7',
                            '&:hover': {
                                backgroundColor: '#003459'
                            }
                        }}
                    >
                        등록
                    </Button>
                </DialogActions>
            </Dialog>

            <Box
                sx={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    zIndex: 1000
                }}
            >
                <Button
                    variant="contained"
                    onClick={() => setOpenChatbot(true)}
                    sx={{
                        backgroundColor: '#333',
                        borderRadius: '50%',
                        minWidth: '56px',
                        width: '56px',
                        height: '56px',
                        '&:hover': {
                            backgroundColor: '#000'
                        }
                    }}
                >
                    <ChatIcon/>
                </Button>
            </Box>

            <ChatbotDialog
                open={openChatbot}
                onClose={() => setOpenChatbot(false)}
            />
        </Box>
    );
};

export default InquiryBoard;