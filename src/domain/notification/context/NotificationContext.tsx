import React, {createContext, ReactNode, useCallback, useContext, useEffect, useState} from 'react';
import api from '@/global/api/services/api';
import {toast} from 'react-toastify';
import {useNavigate} from 'react-router-dom';

interface Notification {
    id: number;
    type: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Notification) => void;
    markAsRead: (notificationId: number) => Promise<void>;
    setupSSEConnection: (agentId: number) => void;
    closeSSEConnection: () => void;
    fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    addNotification: () => {
    },
    markAsRead: async () => {
    },
    setupSSEConnection: () => {
    },
    closeSSEConnection: () => {
    },
    fetchNotifications: async () => {
    },
});

export const useNotification = () => useContext(NotificationContext);

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({children}) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [eventSource, setEventSource] = useState<EventSource | null>(null);
    const navigate = useNavigate();

    const excludedPaths = ['/', '/signup', '/surveys/submit/:surveyId', '/inquiry', '/inquiry/:id', 'login'];
    const shouldExclude = excludedPaths.includes(location.pathname);

    const fetchNotifications = useCallback(async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token || shouldExclude) return;

            const response = await api.get("/api/notifications");
            if (response.data.success) {
                const allNotifications = response.data.data.map((notification: any) => ({
                    id: notification.id,
                    type: notification.type,
                    content: notification.content,
                    isRead: notification.isRead,
                    createdAt: notification.createdAt
                }));

                console.log('Transformed Notifications:', {
                    original: response.data.data,
                    transformed: allNotifications,
                });

                setNotifications(allNotifications);
                const unread = allNotifications.filter((n: Notification) => !n.isRead).length;
                setUnreadCount(unread);
            }
        } catch (err) {
            console.error("Error fetching notifications:", err);
        }
    }, [shouldExclude]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const agentId = localStorage.getItem('agentId');

        if (token && agentId && !shouldExclude) {
            setupSSEConnection(Number(agentId));
        }

        return () => {
            closeSSEConnection();
        };
    }, [shouldExclude]);

    const addNotification = (notification: Notification) => {
        if (notification.type !== 'CONNECTION') {
            setNotifications(prev => [...prev, notification]);

            if (!notification.isRead) {
                setUnreadCount(prev => prev + 1);
                toast.info(notification.content, {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "light",
                    onClick: async () => {
                        try {
                            if (!notification.isRead) {
                                await markAsRead(notification.id);
                            }

                            toast.dismiss();

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
                    }
                });
            }
        }
    };

    const markAsRead = async (notificationId: number) => {
        try {
            // API 엔드포인트 변경
            await api.patch(`/api/notifications/${notificationId}`);

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? {...n, isRead: true} : n)
            );

            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Error marking notification as read:", err);
            throw err;
        }
    };

    const getClientId = (): string => {
        const key = 'sse-client-id';
        let clientId = localStorage.getItem(key);
        if (!clientId) {
            clientId = window.crypto.randomUUID();
            localStorage.setItem(key, clientId);
        }
        return clientId;
    };

    const setupSSEConnection = (agentId: number) => {
        const clientId = getClientId();
        const source = new EventSource(
            `${api.defaults.baseURL}/api/notifications/subscribe?agentId=${agentId}&clientId=${clientId}`
        );

        source.onopen = () => {
            console.log("SSE connection opened");
        };

        setEventSource(source);

        source.addEventListener("notification", (event: MessageEvent) => {
            const data = event.data;

            if (typeof data === 'string' && !data.trim().startsWith('{') && data === 'connection') {
                // toast.success("로그인 성공", {
                //     position: "top-right",
                //     autoClose: 3000,
                //     hideProgressBar: false,
                //     closeOnClick: true,
                //     pauseOnHover: true,
                //     draggable: true,
                //     theme: "colored"
                // });
                return;
            }

            try {
                const rawNotification = JSON.parse(data);
                console.log("Raw Notification:", rawNotification);
                const newNotification = {
                    id: rawNotification.id,
                    type: rawNotification.type,
                    content: rawNotification.content,
                    isRead: rawNotification.read ?? false,  // 명시적으로 false로 설정
                    createdAt: rawNotification.createdAt
                };
                console.log("New Notification:", newNotification);
                addNotification(newNotification);
            } catch (error) {
                console.error("Error processing notification:", error);
            }
        });

        source.onerror = (err) => {
            console.error("SSE error:", err);
            if (source.readyState === EventSource.CLOSED) {
                console.log("SSE closed, reconnecting...");
                setTimeout(() => setupSSEConnection(agentId), 30000);
            } else {
                source.close(); // 네트워크 오류 등 대응
            }
        };

        return () => {
            source.close();
            console.log("SSE connection closed");
        };
    };

    const closeSSEConnection = () => {
        console.log("Close SSE");
        if (eventSource) {
            eventSource.close();
            setEventSource(null);
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                setupSSEConnection,
                closeSSEConnection,
                fetchNotifications
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
