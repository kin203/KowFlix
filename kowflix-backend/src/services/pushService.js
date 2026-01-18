import axios from 'axios';
import User from '../models/User.js';

export const sendPushNotification = async (targetUserIds, title, message, data = {}) => {
    try {
        if (!targetUserIds || targetUserIds.length === 0) return;

        // 1. Fetch tokens for target users, respecting their settings
        const users = await User.find({ _id: { $in: targetUserIds } }, 'pushTokens mobileSettings');

        let tokens = [];
        users.forEach(u => {
            // Check if user has explicitly disabled push notifications
            if (u.mobileSettings && u.mobileSettings.pushEnabled === false) {
                return; // Skip this user
            }

            if (u.pushTokens && u.pushTokens.length > 0) {
                tokens.push(...u.pushTokens);
            }
        });

        if (tokens.length === 0) return;

        // 2. Construct messages
        const messages = tokens.map(token => ({
            to: token,
            sound: 'default',
            title: title,
            body: message,
            data: data,
        }));

        // 3. Send to Expo
        // Simple chunking is handled by Expo backend usually, but for large batches we might need chunking.
        // For now, sending all at once is fine for < 100 recips.
        await axios.post('https://exp.host/--/api/v2/push/send', messages, {
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            }
        });

        console.log(`Sent ${messages.length} push notifications for: ${title}`);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
};
