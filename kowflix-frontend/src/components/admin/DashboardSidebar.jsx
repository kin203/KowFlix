import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import {
    LayoutDashboard,
    Film,
    Users,
    Grid,
    Star,
    Image,
    Bell,
    Briefcase,
    LogOut,
    Settings,
    Menu,
    AlertTriangle
} from 'lucide-react';
import './DashboardSidebar.css';

const DashboardSidebar = () => {
    const { t } = useTranslation(); // Init hook
    const location = useLocation();

    // Mapping keys to labels would be ideal, but for now I'll use direct t() calls in the array or render
    const menuItems = [
        { path: '/admin/dashboard', icon: LayoutDashboard, label: t('admin.dashboard') || 'Dashboard' },
        { path: '/admin/movies', icon: Film, label: t('admin.movies') || 'Quản lý Phim' },
        { path: '/admin/categories', icon: Grid, label: t('admin.categories') || 'Danh mục' },
        { path: '/admin/nav-menu', icon: Menu, label: t('admin.nav_menu') || 'Nav Menu' },
        { path: '/admin/jobs', icon: Briefcase, label: t('admin.jobs') || 'Công việc' },
        { path: '/admin/users', icon: Users, label: t('admin.users') || 'Người dùng' },
        { path: '/admin/reports', icon: AlertTriangle, label: 'Báo lỗi' },
        { path: '/admin/reviews', icon: Star, label: t('admin.reviews') || 'Đánh giá' },
        { path: '/admin/hero', icon: Image, label: t('admin.hero') || 'Hero Banner' },
        { path: '/admin/notifications', icon: Bell, label: t('admin.notifications') || 'Thông báo' },
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
                    <span>{t('settings.title_short') || 'Cài đặt'}</span>
                </Link>
                <Link to="/" className="sidebar-item">
                    <LogOut size={20} />
                    <span>{t('admin.logout') || 'Thoát'}</span>
                </Link>
            </div>
        </div>
    );
};

export default DashboardSidebar;
