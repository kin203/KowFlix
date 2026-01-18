import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { notificationAPI } from '../services/api/notificationAPI';

const PushNotificationManager = () => {
    const { user } = useAuth();
    const { expoPushToken } = usePushNotifications();

    useEffect(() => {
        if (user && expoPushToken) {
            notificationAPI.registerPushToken(expoPushToken).catch(err => {
                // console.error("Failed to sync push token", err);
            });
        }
    }, [user, expoPushToken]);

    return null;
};

export default PushNotificationManager;
