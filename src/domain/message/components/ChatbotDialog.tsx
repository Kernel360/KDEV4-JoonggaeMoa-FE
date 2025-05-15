import CloseIcon from '@mui/icons-material/Close';
import {Box, Button, CircularProgress, Dialog, DialogContent, IconButton, TextField, Typography} from '@mui/material';
import React, {useEffect, useRef, useState} from 'react';

import api from '@/global/api/services/api';

interface Message {
    text: string;
    isUser: boolean;
}

interface ChatbotDialogProps {
    open: boolean;
    onClose: () => void;
}

const ChatbotDialog: React.FC<ChatbotDialogProps> = ({open, onClose}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    };

    // 초기 안내 메시지 추가
    useEffect(() => {
        if (open) {
            setMessages([
                {text: "안녕하세요! 어떤 도움이 필요하신가요?", isUser: false},
            ]);
        }
        scrollToBottom();
    }, [open]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, {text: userMessage, isUser: true}]);
        setLoading(true);

        try {
            const response = await api.post('/api/inquiries/chat', {
                question: userMessage
            });

            if (response.data.success) {
                setMessages(prev => [...prev, {text: response.data.data.answer, isUser: false}]);
            }
        } catch (error) {
            setMessages(prev => [...prev, {text: '답변을 가져오는 데 실패했습니다.', isUser: false}]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        height: '80vh',
                        margin: 2,
                        width: '100%',
                        maxWidth: '400px !important',
                        position: 'fixed',
                        bottom: 0,
                        right: 0,
                    }
                }}
            >
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderBottom: '1px solid #e0e0e0',
                    bgcolor: '#333',
                    color: 'white'
                }}>
                    <Typography variant="h6">AI 챗봇</Typography>
                    <IconButton onClick={onClose} sx={{color: 'white'}}>
                        <CloseIcon/>
                    </IconButton>
                </Box>

                <DialogContent sx={{
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    overflowY: 'auto',
                    maxHeight: '60vh', // 최대 높이를 제한하여 스크롤이 가능하게
                }}>
                    {messages.map((message, index) => (
                        <Box
                            key={index}
                            sx={{
                                display: 'flex',
                                justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                                mb: 1
                            }}
                        >
                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                {/* AI 메시지일 경우 로봇 이모티콘을 추가 */}
                                {!message.isUser && (
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                            mr: 2
                                        }}
                                    >
                                        {/* AI 이모티콘 표시 */}
                                        <Typography sx={{fontSize: 24}}>🤖</Typography>
                                    </Box>
                                )}

                                <Box sx={{
                                    maxWidth: '70%',
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: message.isUser ? '#4CAF50' : '#f5f5f5',
                                    color: message.isUser ? 'white' : 'black',
                                    wordBreak: 'break-word',
                                    boxShadow: 3,
                                }}>
                                    <Typography sx={{whiteSpace: 'pre-line'}}>
                                        {message.text}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                    {loading && (
                        <Box sx={{display: 'flex', justifyContent: 'center'}}>
                            <CircularProgress size={24}/>
                        </Box>
                    )}
                    <div ref={messagesEndRef}/>
                </DialogContent>

                <Box sx={{p: 2, borderTop: '1px solid #e0e0e0'}}>
                    <form onSubmit={handleSubmit}>
                        <Box sx={{display: 'flex', gap: 1}}>
                            <TextField
                                fullWidth
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="메시지를 입력하세요..."
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#333'
                                        }
                                    }
                                }}
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={loading}
                                sx={{
                                    bgcolor: '#333',
                                    '&:hover': {
                                        bgcolor: '#000'
                                    }
                                }}
                            >
                                전송
                            </Button>
                        </Box>
                    </form>
                </Box>
            </Dialog>

            <Box
                sx={{
                    position: 'fixed',
                    bottom: 20,
                    right: 20,
                    zIndex: 1000
                }}
            >
                {/* <Fab
                    color="primary"
                    onClick={() => !open && onClose()}
                    sx={{
                        bgcolor: '#333',
                        '&:hover': {
                            bgcolor: '#000'
                        }
                    }}
                >
                    <ChatIcon />
                </Fab> */}
            </Box>
        </>
    );
};

export default ChatbotDialog;
