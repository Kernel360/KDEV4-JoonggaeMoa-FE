import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

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
}

const NotificationContext = createContext<NotificationContextType>({
    notifications: [],
    unreadCount: 0,
    addNotification: () => {},
    markAsRead: async () => {},
    setupSSEConnection: () => {},
    closeSSEConnection: () => {},
});

export const useNotification = () => useContext(NotificationContext);

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [eventSource, setEventSource] = useState<EventSource | null>(null);
    const navigate = useNavigate();

    const excludedPaths = ['/signup', '/surveys/submit/:surveyId', '/inquiry', '/inquiry/:id', 'login']; 
    const shouldExclude = excludedPaths.includes(location.pathname);

    useEffect(() => {
        if(!shouldExclude) {
           return; 
        }
        const fetchNotifications = async () => {
            try {
                const response = await api.get("/api/notification");
                if (response.data.success) {
                    const allNotifications = response.data.data.map((notification: any) => ({
                        ...notification,
                        isRead: notification.read,
                        createdAt: notification.createdAt
                    }));

                    setNotifications(allNotifications);
                    const unread = allNotifications.filter((n: Notification) => !n.isRead).length;
                    setUnreadCount(unread);
                }
            } catch (err) {
                console.error("Error fetching notifications:", err);
            }
        };

        fetchNotifications();
    }, []);

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
            await api.patch("/api/notification/read", null, {
                params: { notificationId },
            });

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );

            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Error marking notification as read:", err);
            throw err;
        }
    };

    const setupSSEConnection = (agentId: number) => {
        const source = new EventSource(`${api.defaults.baseURL}/api/notification/subscribe?agentId=${agentId}`, {
            withCredentials: true
        });

        source.onopen = () => {
            console.log("SSE connection opened");
        };

        setEventSource(source);

        source.addEventListener("notification", (event: MessageEvent) => {
            try {
                const rawNotification = JSON.parse(event.data);
                const newNotification = {
                    ...rawNotification,
                    isRead: rawNotification.read
                };
                addNotification(newNotification);
            } catch (error) {
                console.error("Error processing notification:", error);
            }
        });

        source.onerror = (err) => {
            console.error("SSE error:", err);
            source.close();
            setTimeout(() => setupSSEConnection(agentId), 30000);
        };

        return () => {
            source.close();
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
                closeSSEConnection
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
