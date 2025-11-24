import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Film,
    Users,
    Grid,
    Star,
    Image,
    Bell,
    LogOut,
    Settings
} from 'lucide-react';
import './DashboardSidebar.css';

const DashboardSidebar = () => {
    const location = useLocation();

    const menuItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/movies', icon: Film, label: 'Quản lý Phim' },
        { path: '/admin/categories', icon: Grid, label: 'Danh mục' },
        { path: '/admin/users', icon: Users, label: 'Người dùng' },
        { path: '/admin/reviews', icon: Star, label: 'Đánh giá' },
        { path: '/admin/hero', icon: Image, label: 'Hero Banner' },
        { path: '/admin/notifications', icon: Bell, label: 'Thông báo' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <div className="dashboard-sidebar">
            <div className="sidebar-header">
                <h2 className="sidebar-logo">KowFlix</h2>
                <p className="sidebar-subtitle">Admin Panel</p>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <Link to="/admin/settings" className="sidebar-item">
                    <Settings size={20} />
                    <span>Cài đặt</span>
                </Link>
                <Link to="/" className="sidebar-item">
                    <LogOut size={20} />
                    <span>Thoát</span>
                </Link>
            </div>
        </div>
    );
};

export default DashboardSidebar;
