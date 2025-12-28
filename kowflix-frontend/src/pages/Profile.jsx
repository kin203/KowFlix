import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, X, LogOut, Save, ArrowLeft, Clock, Play } from 'lucide-react';
import { authAPI, progressAPI } from '../services/api';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', bio: '' });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [watchHistory, setWatchHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        fetchProfile();
        fetchWatchHistory();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await authAPI.getProfile();
            setProfile(data.data);
            setFormData({
                name: data.data.profile?.name || '',
                bio: data.data.profile?.bio || ''
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            setMessage({ type: 'error', text: 'Không thể tải profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setMessage({ type: 'error', text: 'Kích thước file phải nhỏ hơn 5MB' });
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleUploadAvatar = async () => {
        if (!avatarFile) return;

        setUploading(true);
        setMessage({ type: '', text: '' });

        try {
            const data = new FormData();
            data.append('avatar', avatarFile);

            await authAPI.uploadAvatar(data);
            setMessage({ type: 'success', text: 'Cập nhật avatar thành công!' });
            setAvatarFile(null);
            setAvatarPreview(null);
            fetchProfile();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Upload thất bại' });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!window.confirm('Bạn có chắc muốn xóa avatar?')) return;

        try {
            await authAPI.deleteAvatar();
            setMessage({ type: 'success', text: 'Đã xóa avatar!' });
            fetchProfile();
        } catch (error) {
            setMessage({ type: 'error', text: 'Không thể xóa avatar' });
        }
    };

    const handleUpdateProfile = async () => {
        setMessage({ type: '', text: '' });

        try {
            await authAPI.updateProfile(formData);
            setMessage({ type: 'success', text: 'Cập nhật profile thành công!' });
            setEditing(false);
            fetchProfile();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Cập nhật thất bại' });
        }
    };

    const fetchWatchHistory = async () => {
        setLoadingHistory(true);
        try {
            const { data } = await progressAPI.getHistory();
            setWatchHistory(data.data || []);
        } catch (error) {
            console.error('Failed to fetch watch history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hrs > 0) return `${hrs}h ${mins}m`;
        return `${mins}m`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hôm nay';
        if (diffDays === 1) return 'Hôm qua';
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải profile...</p>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* Floating Back Button */}
            <button className="floating-back-btn" onClick={() => navigate('/')}>
                <ArrowLeft size={20} />
                <span>Trang chủ</span>
            </button>

            <div className="profile-content">
                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* Avatar Section with Info */}
                <div className="avatar-section">
                    <div className="avatar-box">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="avatar" />
                        ) : profile?.profile?.avatar ? (
                            <img src={profile.profile.avatar} alt="Avatar" className="avatar" />
                        ) : (
                            <div className="avatar-placeholder">
                                <User size={60} />
                            </div>
                        )}
                        <label className="avatar-upload">
                            <Camera size={18} />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                hidden
                            />
                        </label>
                    </div>

                    <div className="avatar-info">
                        <h2>{formData.name || profile?.email?.split('@')[0] || 'User'}</h2>
                        <p className="email">{profile?.email}</p>
                        <p className="member-date">
                            Thành viên từ {new Date(profile?.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                        <button className="logout-btn" onClick={handleLogout}>
                            <LogOut size={18} />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>

                {avatarPreview && (
                    <div className="avatar-actions">
                        <button className="btn-primary" onClick={handleUploadAvatar} disabled={uploading}>
                            {uploading ? 'Đang upload...' : 'Lưu Avatar'}
                        </button>
                        <button className="btn-secondary" onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview(null);
                        }}>
                            Hủy
                        </button>
                    </div>
                )}

                {/* Profile Info */}
                <div className="info-card">
                    <div className="info-header">
                        <h2>Thông tin cá nhân</h2>
                        {!editing && (
                            <button className="btn-edit" onClick={() => setEditing(true)}>
                                Chỉnh sửa
                            </button>
                        )}
                    </div>

                    <div className="info-body">
                        <div className="field">
                            <label>Tên hiển thị</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                disabled={!editing}
                                placeholder="Nhập tên của bạn"
                            />
                        </div>

                        <div className="field">
                            <label>Giới thiệu</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                disabled={!editing}
                                placeholder="Giới thiệu về bạn..."
                                rows={4}
                            />
                        </div>

                        {editing && (
                            <div className="actions">
                                <button className="btn-primary" onClick={handleUpdateProfile}>
                                    <Save size={18} />
                                    Lưu thay đổi
                                </button>
                                <button className="btn-secondary" onClick={() => {
                                    setEditing(false);
                                    setFormData({
                                        name: profile?.profile?.name || '',
                                        bio: profile?.profile?.bio || ''
                                    });
                                }}>
                                    Hủy
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Watch History Section */}
                <div className="info-card history-section">
                    <div className="info-header">
                        <h2>
                            <Clock size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                            Lịch sử xem
                        </h2>
                    </div>

                    <div className="history-body">
                        {loadingHistory ? (
                            <div className="history-loading">
                                <div className="loading-spinner"></div>
                                <p>Đang tải lịch sử...</p>
                            </div>
                        ) : watchHistory.length === 0 ? (
                            <div className="history-empty">
                                <Play size={48} />
                                <p>Bạn chưa xem phim nào</p>
                            </div>
                        ) : (
                            <div className="history-grid">
                                {watchHistory.map((item) => (
                                    <div
                                        key={item._id}
                                        className="history-card"
                                        onClick={() => navigate(`/watch/${item.movie._id}`)}
                                    >
                                        <div className="history-poster">
                                            <img
                                                src={item.movie.poster || '/placeholder.jpg'}
                                                alt={item.movie.title}
                                                onError={(e) => {
                                                    e.target.src = '/placeholder.jpg';
                                                }}
                                            />
                                            <div className="play-overlay">
                                                <Play size={32} />
                                            </div>
                                        </div>
                                        <div className="history-info">
                                            <h3>{item.movie.title}</h3>
                                            <div className="history-meta">
                                                <span className="watch-time">{formatDate(item.lastWatched)}</span>
                                                {item.movie.releaseYear && (
                                                    <span className="year">{item.movie.releaseYear}</span>
                                                )}
                                            </div>
                                            <div className="progress-bar-container">
                                                <div
                                                    className="progress-bar-fill"
                                                    style={{ width: `${item.percentage}%` }}
                                                ></div>
                                            </div>
                                            <div className="progress-text">
                                                {item.percentage >= 90 ? (
                                                    <span className="completed">✓ Đã xem</span>
                                                ) : (
                                                    <span>{Math.round(item.percentage)}% · {formatTime(item.currentTime)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
