import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import StatsCard from '../components/admin/StatsCard';
import EngagementChart from '../components/admin/EngagementChart';
import { Users, Film, Eye, TrendingUp, Clock } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import useDocumentTitle from '../components/useDocumentTitle';
import './AdminDashboard.css';

const AdminDashboard = () => {
    useDocumentTitle('Dashboard - Quản trị KowFlix');
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        onlineUsers: 0,
        totalMovies: 0,
        totalViews: 0,
        trendingCount: 0
    });
    const [weeklyData, setWeeklyData] = useState([]);
    const [topMovies, setTopMovies] = useState([]);
    const [topRatedMovies, setTopRatedMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch all data in parallel
            const [statsRes, weeklyRes, topMoviesRes, topRatedRes] = await Promise.all([
                analyticsAPI.getStats(),
                analyticsAPI.getWeeklyViews(),
                analyticsAPI.getTopMovies(5),
                analyticsAPI.getTopRated(5)
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }

            if (weeklyRes.data.success) {
                setWeeklyData(weeklyRes.data.data);
            }

            if (topMoviesRes.data.success) {
                setTopMovies(topMoviesRes.data.data);
            }

            if (topRatedRes.data.success) {
                setTopRatedMovies(topRatedRes.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="admin-dashboard-container">
                <DashboardSidebar />
                <div className="admin-dashboard-content">
                    <div className="dashboard-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div className="admin-dashboard-container">
            <DashboardSidebar />

            <div className="admin-dashboard-content">
                <div className="dashboard-header">
                    <div>
                        <h1>Dashboard</h1>
                        <p>Chào mừng trở lại, Admin! 👋</p>
                    </div>
                    <div className="dashboard-time">
                        <Clock size={18} />
                        <span>{new Date().toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}</span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <StatsCard
                        icon={Users}
                        title="Tổng người dùng"
                        value={stats.totalUsers.toLocaleString()}
                        trend="up"
                        trendValue="+12% so với tháng trước"
                        color="#FFD700"
                    />
                    <StatsCard
                        icon={Eye}
                        title="Người dùng online"
                        value={stats.onlineUsers}
                        trend="up"
                        trendValue="+5% so với hôm qua"
                        color="#10B981"
                    />
                    <StatsCard
                        icon={Film}
                        title="Tổng số phim"
                        value={stats.totalMovies}
                        trend="up"
                        trendValue="+8 phim mới"
                        color="#E50914"
                    />
                    <StatsCard
                        icon={TrendingUp}
                        title="Lượt xem"
                        value={`${(stats.totalViews / 1000).toFixed(1)}k`}
                        trend="up"
                        trendValue="+15% tuần này"
                        color="#3B82F6"
                    />
                </div>

                {/* Charts Section */}
                <div className="charts-grid">
                    {/* Engagement Trends Chart */}
                    <div className="chart-full-width">
                        <EngagementChart
                            data={weeklyData}
                            title="Thống kê lượt xem"
                            subtitle="Lượt xem theo tuần - 7 ngày qua"
                        />
                    </div>

                    {/* Top Viewed Movies */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Top 5 phim được xem nhiều nhất</h3>
                            <span className="chart-subtitle">Theo lượt xem</span>
                        </div>
                        <div className="top-movies-list">
                            {topMovies.length > 0 ? (
                                topMovies.map((movie, index) => (
                                    <div key={movie._id} className="top-movie-item">
                                        <div className="movie-rank">#{index + 1}</div>
                                        <div className="movie-info">
                                            <h4>{movie.title}</h4>
                                            <p>{movie.views ? movie.views.toLocaleString() : 0} lượt xem</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-data">
                                    <p>Chưa có dữ liệu phim</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Rated Movies */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Top 5 phim có đánh giá cao nhất</h3>
                            <span className="chart-subtitle">Theo rating từ users</span>
                        </div>
                        <div className="top-movies-list">
                            {topRatedMovies.length > 0 ? (
                                topRatedMovies.map((movie, index) => (
                                    <div key={movie._id} className="top-movie-item">
                                        <div className="movie-rank">#{index + 1}</div>
                                        <div className="movie-info">
                                            <h4>{movie.title}</h4>
                                            <p>{movie.views ? movie.views.toLocaleString() : 0} lượt xem</p>
                                        </div>
                                        <div className="movie-rating">
                                            ⭐ {movie.rating}
                                            <span style={{ fontSize: '0.8rem', color: '#888', marginLeft: '0.25rem' }}>
                                                ({movie.reviewCount} đánh giá)
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-data">
                                    <p>Chưa có dữ liệu phim</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                    <h3>Thao tác nhanh</h3>
                    <div className="actions-grid">
                        <button className="action-btn" onClick={() => navigate('/admin/movies')}>
                            <Film size={20} />
                            <span>Thêm phim mới</span>
                        </button>
                        <button className="action-btn" onClick={() => navigate('/admin/users')}>
                            <Users size={20} />
                            <span>Quản lý người dùng</span>
                        </button>
                        <button className="action-btn" onClick={() => navigate('/admin/dashboard')}>
                            <TrendingUp size={20} />
                            <span>Xem báo cáo</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
