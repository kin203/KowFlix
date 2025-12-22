import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { notificationAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await notificationAPI.getAll();
            setNotifications(response.data.data || []);
            setUnreadCount(response.data.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            if (!notification.isRead) {
                // Optimistic update
                setNotifications(prev =>
                    prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));

                await notificationAPI.markAsRead(notification._id);
            }
            if (notification.link) {
                navigate(notification.link);
            }
            setIsOpen(false);
        } catch (error) {
            console.error('Error marking as read:', error);
            fetchNotifications(); // Revert on error
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);

            await notificationAPI.markAllAsRead();
        } catch (error) {
            console.error('Error marking all as read:', error);
            fetchNotifications(); // Revert on error
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diff = Math.floor((now - notifDate) / 1000);

        if (diff < 60) return 'Vừa xong';
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
        return notifDate.toLocaleDateString('vi-VN');
    };

    return (
        <div className="noti-dropdown" ref={dropdownRef}>
            <button className="noti-btn" onClick={() => setIsOpen(!isOpen)}>
                <Bell size={22} />
                {unreadCount > 0 && <span className="noti-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="noti-panel">
                    <div className="noti-header">
                        <h3>Thông báo</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllAsRead} className="mark-read-btn">
                                Đánh dấu đã đọc
                            </button>
                        )}
                    </div>

                    <div className="noti-list">
                        {notifications.length === 0 ? (
                            <div className="noti-empty">
                                <Bell size={40} />
                                <p>Không có thông báo</p>
                            </div>
                        ) : (
                            notifications.map((noti) => (
                                <div
                                    key={noti._id}
                                    className={`noti-item ${!noti.isRead ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(noti)}
                                >
                                    <div className="noti-body">
                                        <h4>{noti.title}</h4>
                                        <p>{noti.message}</p>
                                        <span className="noti-time">{formatTime(noti.createdAt)}</span>
                                    </div>
                                    {!noti.isRead && <div className="noti-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;