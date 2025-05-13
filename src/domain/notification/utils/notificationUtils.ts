export const getNotificationColor = (type: string): string => {
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