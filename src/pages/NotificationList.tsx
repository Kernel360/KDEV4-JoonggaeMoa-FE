import React from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    Container,
    IconButton,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

interface Notification {
    id: number;
    type: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}

const getNotificationColor = (type: string) => {
    switch (type) {
        case 'SURVEY':
            return '#2196f3';
        case 'ARTICLE':
            return '#4caf50';
        case 'CONSULTATION':
            return '#ff9800';
        case 'MESSAGE':
            return '#9c27b0';
        case 'CONTRACT':
            return '#f44336';
        default:
            return '#757575';
    }
};

const NotificationList: React.FC = () => {
    const { notifications, markAsRead } = useNotification();
    const navigate = useNavigate();

    const handleNotificationNavigation = async (notification: Notification) => {
        try {
            if (!notification.isRead) {
                await markAsRead(notification.id);
            }

            switch (notification.type) {
                case 'SURVEY':
                    navigate('/survey');
                    break;
                case 'ARTICLE':
                    navigate('/article-management');
                    break;
                case 'CONSULTATION':
                    navigate('/consultation');
                    break;
                case 'MESSAGE':
                    navigate('/message');
                    break;
                case 'CONTRACT':
                    navigate('/contract');
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error("Error handling notification:", error);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="h5" component="h1">
                    알림 목록
                </Typography>
            </Box>
            <Paper>
                <List>
                    {notifications
                        .filter(notification => notification.type !== 'CONNECTION')
                        .slice()
                        .sort((a, b) => b.id - a.id)
                        .map((notification) => (
                            <ListItem
                                key={notification.id}
                                sx={{
                                    py: 2,
                                    borderBottom: '1px solid rgba(0,0,0,0.06)',
                                    '&:last-child': { borderBottom: 'none' },
                                    bgcolor: notification.isRead ? 'action.hover' : 'transparent',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: notification.isRead ? 'action.selected' : 'action.hover',
                                    },
                                }}
                                onClick={() => handleNotificationNavigation(notification)}
                            >
                                <Box sx={{
                                    width: 4,
                                    height: 40,
                                    borderRadius: '4px',
                                    bgcolor: notification.isRead ? 'grey.400' : getNotificationColor(notification.type),
                                    mr: 2
                                }} />
                                <Box sx={{ width: '100%' }}>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontWeight: notification.isRead ? 400 : 600,
                                            color: notification.isRead ? 'text.disabled' : 'text.primary',
                                            mb: 0.5
                                        }}
                                    >
                                        {notification.content}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography
                                            component="span"
                                            variant="body2"
                                            sx={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                bgcolor: notification.isRead ? 'grey.100' : `${getNotificationColor(notification.type)}15`,
                                                color: notification.isRead ? 'grey.500' : getNotificationColor(notification.type),
                                                py: 0.5,
                                                px: 1,
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 500,
                                            }}
                                        >
                                            {notification.type}
                                        </Typography>
                                        <Typography 
                                            variant="caption" 
                                            sx={{ 
                                                color: 'text.secondary',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            {new Date(notification.createdAt).toLocaleString('ko-KR', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Typography>
                                    </Box>
                                </Box>
                            </ListItem>
                        ))}
                </List>
            </Paper>
        </Container>
    );
};

export default NotificationList;
