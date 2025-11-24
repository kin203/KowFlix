import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import { notificationAPI } from '../services/api';
import {
    Plus, Trash2, X, Bell, Info, CheckCircle, AlertTriangle, AlertCircle, Users
} from 'lucide-react';
import './NotificationManagement.css';

const NotificationManagement = () => {
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState({ total: 0, byType: {} });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'info',
        targetUsers: [], // Empty for broadcast
        expiresIn: 7 // Days
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [listRes, statsRes] = await Promise.all([
                notificationAPI.getAll(),
                notificationAPI.getStats()
            ]);

            if (listRes.data.success) {
                setNotifications(listRes.data.data);
            }
            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({
            title: '',
            message: '',
            type: 'info',
            targetUsers: [],
            expiresIn: 7
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Calculate expiration date
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + parseInt(formData.expiresIn));

            await notificationAPI.create({
                ...formData,
                expiresAt
            });

            fetchData();
            handleCloseModal();
        } catch (error) {
            console.error('Failed to create notification:', error);
            alert('Failed to create notification');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this notification?')) {
            try {
                await notificationAPI.delete(id);
                fetchData();
            } catch (error) {
                console.error('Failed to delete notification:', error);
                alert('Failed to delete notification');
            }
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} />;
            case 'warning': return <AlertTriangle size={20} />;
            case 'error': return <AlertCircle size={20} />;
            default: return <Info size={20} />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="notification-management-container">
            <DashboardSidebar />
            <div className="notification-content">
                <div className="notification-header">
                    <h1>Quản lý Thông báo</h1>
                    <button className="btn-add" onClick={handleOpenModal}>
                        <Plus size={20} />
                        Tạo Thông báo
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="notification-stats">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                            <Bell />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.total}</h3>
                            <p>Tổng thông báo</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                            <CheckCircle />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.byType?.success || 0}</h3>
                            <p>Success</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                            <AlertTriangle />
                        </div>
                        <div className="stat-info">
                            <h3>{stats.byType?.warning || 0}</h3>
                            <p>Warning</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="dashboard-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
                                Chưa có thông báo nào
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div key={notif._id} className="notification-item">
                                    <div className={`notification-icon ${notif.type}`}>
                                        {getTypeIcon(notif.type)}
                                    </div>
                                    <div className="notification-details">
                                        <div className="notification-title-row">
                                            <h4>{notif.title}</h4>
                                            <span className="notification-time">{formatDate(notif.createdAt)}</span>
                                        </div>
                                        <p className="notification-message">{notif.message}</p>
                                        <div className="notification-meta">
                                            <span>
                                                <Users size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                {notif.targetUsers.length > 0
                                                    ? `${notif.targetUsers.length} người dùng cụ thể`
                                                    : 'Tất cả người dùng (Broadcast)'}
                                            </span>
                                            <span>•</span>
                                            <span>Đã xem: {notif.readBy?.length || 0}</span>
                                        </div>
                                    </div>
                                    <div className="notification-actions">
                                        <button
                                            className="btn-icon delete"
                                            onClick={() => handleDelete(notif._id)}
                                            title="Xóa thông báo"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Create Modal */}
                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Tạo Thông báo mới</h2>
                                <button className="btn-close" onClick={handleCloseModal}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Tiêu đề</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        placeholder="Nhập tiêu đề thông báo"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nội dung</label>
                                    <textarea
                                        className="form-input"
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                        placeholder="Nhập nội dung thông báo..."
                                        rows="3"
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Loại thông báo</label>
                                    <div className="type-selector">
                                        {['info', 'success', 'warning', 'error'].map(type => (
                                            <div
                                                key={type}
                                                className={`type-option ${formData.type === type ? 'selected' : ''}`}
                                                onClick={() => setFormData({ ...formData, type })}
                                            >
                                                {type.charAt(0).toUpperCase() + type.slice(1)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Thời hạn (ngày)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.expiresIn}
                                        onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                                        min="1"
                                        max="30"
                                    />
                                    <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
                                        Thông báo sẽ tự động xóa sau số ngày này
                                    </small>
                                </div>

                                <div className="notification-modal-actions">
                                    <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn-submit">
                                        Gửi Thông báo
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationManagement;
