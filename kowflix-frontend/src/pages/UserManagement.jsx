import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import { userAPI } from '../services/api';
import { Search, Trash2, Shield, ShieldOff, User as UserIcon } from 'lucide-react';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchUsers();
    }, [page, debouncedSearch]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getAll({
                page,
                limit: 10,
                search: debouncedSearch
            });

            if (response.data.success) {
                setUsers(response.data.data);
                setTotalPages(response.data.pagination.pages);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleToggle = async (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        const action = newRole === 'admin' ? 'promote to Admin' : 'demote to User';

        if (window.confirm(`Are you sure you want to ${action} for ${user.email}?`)) {
            try {
                await userAPI.updateRole(user._id, newRole);
                fetchUsers(); // Refresh list
            } catch (error) {
                console.error('Failed to update role:', error);
                alert('Failed to update user role');
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            try {
                await userAPI.delete(id);
                fetchUsers();
            } catch (error) {
                console.error('Failed to delete user:', error);
                alert('Failed to delete user');
            }
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="user-management-container">
            <DashboardSidebar />
            <div className="user-content">
                <div className="user-header">
                    <h1>Quản lý Người dùng</h1>
                    <div className="search-box">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Tìm kiếm theo tên hoặc email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="dashboard-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        <div className="user-table-container">
                            <table className="user-table">
                                <thead>
                                    <tr>
                                        <th>Người dùng</th>
                                        <th>Vai trò</th>
                                        <th>Hoạt động gần nhất</th>
                                        <th>Ngày tham gia</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user._id}>
                                            <td>
                                                <div className="user-info">
                                                    {user.profile?.avatar ? (
                                                        <img
                                                            src={user.profile.avatar}
                                                            alt={user.profile.name}
                                                            className="user-avatar"
                                                        />
                                                    ) : (
                                                        <div className="user-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <UserIcon size={20} color="#888" />
                                                        </div>
                                                    )}
                                                    <div className="user-details">
                                                        <h4>{user.profile?.name || 'Unnamed User'}</h4>
                                                        <p>{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`role-badge ${user.role}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td>
                                                {formatDate(user.lastActive)}
                                            </td>
                                            <td>
                                                {formatDate(user.createdAt)}
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="action-btn"
                                                        onClick={() => handleRoleToggle(user)}
                                                        title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                                    >
                                                        {user.role === 'admin' ? <ShieldOff size={18} /> : <Shield size={18} />}
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        onClick={() => handleDelete(user._id)}
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="pagination">
                                <button
                                    className="page-btn"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    Previous
                                </button>
                                <span style={{ color: '#888' }}>
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    className="page-btn"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
