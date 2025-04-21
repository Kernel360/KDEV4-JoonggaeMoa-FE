import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface Notification {
    id: number;
    type: string;
    content: string;
    isRead: boolean;
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
    const [eventSource, setEventSource] = useState<EventSource | null>(null);  // 추가

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await api.get("/api/notification");
                if (response.data.success) {
                    const allNotifications = response.data.data.map((notification: any) => ({
                        ...notification,
                        isRead: notification.read
                    }));
                    
                    setNotifications(allNotifications);
                    const unreadCount = allNotifications.filter((n: Notification) => !n.isRead).length;
                    setUnreadCount(unreadCount);
                }
            } catch (err) {
                console.error("Error fetching notifications:", err);
            }
        };

        fetchNotifications();
    }, []);

    const addNotification = (notification: Notification) => {
        setNotifications(prev => {
            const newNotifications = [notification, ...prev].sort((a, b) => b.id - a.id);
            return newNotifications;
        });
        if (!notification.isRead) {
            setUnreadCount(prev => prev + 1);
        }
    };

    const markAsRead = async (notificationId: number) => {
        try {
            await api.patch("/api/notification/read", null, {
                params: {
                    notificationId,
                },
            });
            
            setNotifications(prev => 
                prev.map(n => 
                    n.id === notificationId ? { ...n, isRead: true } : n
                )
            );
            
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error("Error marking notification as read:", err);
            throw err;
        }
    };

    const setupSSEConnection = (agentId: number) => {
        const eventSource = new EventSource(`${api.defaults.baseURL}/api/notification/subscribe?agentId=${agentId}`, {
            withCredentials: true
        });

        eventSource.onopen = () => {
            console.log("SSE connection opened");
        };

        setEventSource(eventSource);

        if(eventSource!=null){


            eventSource.addEventListener("notification", (event: MessageEvent) => {
                console.log("Received notification:", event.data);
                const rawNotification = JSON.parse(event.data);
                const newNotification = {
                    ...rawNotification,
                    isRead: rawNotification.read
                };
                addNotification(newNotification);
            });

            eventSource.onerror = (err) => {
                console.error("SSE error:", err);
                eventSource.close();
                // Attempt to reconnect after 30 seconds
                setTimeout(() => setupSSEConnection(agentId), 30000);
            };
        }
        
        // Cleanup on unmount
        return () => {
            eventSource.close();
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
                closeSSEConnection  // 추가
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationContext;
