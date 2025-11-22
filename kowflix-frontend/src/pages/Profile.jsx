import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Camera, X, LogOut, Save } from 'lucide-react';
import { authAPI } from '../services/api';
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

    useEffect(() => {
        fetchProfile();
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
            setMessage({ type: 'error', text: 'Failed to load profile' });
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
                setMessage({ type: 'error', text: 'File size must be less than 5MB' });
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
            setMessage({ type: 'success', text: 'Avatar uploaded successfully!' });
            setAvatarFile(null);
            setAvatarPreview(null);
            fetchProfile();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Upload failed' });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAvatar = async () => {
        if (!window.confirm('Are you sure you want to delete your avatar?')) return;

        try {
            await authAPI.deleteAvatar();
            setMessage({ type: 'success', text: 'Avatar deleted successfully!' });
            fetchProfile();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete avatar' });
        }
    };

    const handleUpdateProfile = async () => {
        setMessage({ type: '', text: '' });

        try {
            await authAPI.updateProfile(formData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            setEditing(false);
            fetchProfile();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Update failed' });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (loading) {
        return <div className="profile-loading">Loading profile...</div>;
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <h1>My Profile</h1>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>

                {message.text && (
                    <div className={`profile-message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* Avatar Section */}
                <div className="avatar-section">
                    <div className="avatar-container">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="avatar-image" />
                        ) : profile?.profile?.avatar ? (
                            <img src={profile.profile.avatar} alt="Avatar" className="avatar-image" />
                        ) : (
                            <div className="avatar-placeholder">
                                <User size={80} />
                            </div>
                        )}

                        <label className="avatar-upload-btn">
                            <Camera size={20} />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                hidden
                            />
                        </label>
                    </div>

                    {avatarPreview && (
                        <div className="avatar-actions">
                            <button
                                className="btn-primary"
                                onClick={handleUploadAvatar}
                                disabled={uploading}
                            >
                                {uploading ? 'Uploading...' : 'Save Avatar'}
                            </button>
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    setAvatarFile(null);
                                    setAvatarPreview(null);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {profile?.profile?.avatar && !avatarPreview && (
                        <button className="btn-delete" onClick={handleDeleteAvatar}>
                            <X size={16} />
                            Delete Avatar
                        </button>
                    )}
                </div>

                {/* Profile Information */}
                <div className="profile-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={profile?.email || ''}
                            disabled
                            className="input-disabled"
                        />
                    </div>

                    <div className="form-group">
                        <label>Display Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            disabled={!editing}
                            placeholder="Enter your name"
                        />
                    </div>

                    <div className="form-group">
                        <label>Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            disabled={!editing}
                            placeholder="Tell us about yourself..."
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label>Member Since</label>
                        <input
                            type="text"
                            value={new Date(profile?.createdAt).toLocaleDateString()}
                            disabled
                            className="input-disabled"
                        />
                    </div>

                    <div className="form-actions">
                        {editing ? (
                            <>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={handleUpdateProfile}
                                >
                                    <Save size={20} />
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => {
                                        setEditing(false);
                                        setFormData({
                                            name: profile?.profile?.name || '',
                                            bio: profile?.profile?.bio || ''
                                        });
                                    }}
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => setEditing(true)}
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
