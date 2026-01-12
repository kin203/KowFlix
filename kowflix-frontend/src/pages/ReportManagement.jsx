
import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import { reportAPI } from '../services/api';
import { AlertTriangle, User as UserIcon, CheckCircle, XCircle, Clock } from 'lucide-react';
import './ReportManagement.css';

const ReportManagement = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await reportAPI.getAll();
            if (response.data.success) {
                setReports(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            setError('Không thể tải danh sách báo cáo.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await reportAPI.updateStatus(id, newStatus);
            // Optimistic update
            setReports(reports.map(r => r._id === id ? { ...r, status: newStatus } : r));
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('Không thể cập nhật trạng thái.');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="report-management-container">
            <DashboardSidebar />
            <div className="report-content">
                <div className="report-header">
                    <h1>Quản lý Báo lỗi</h1>
                </div>

                {error && <div className="error-message">{error}</div>}

                {loading ? (
                    <div className="dashboard-loading">
                        <div className="loading-spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <>
                        {reports.length === 0 ? (
                            <div className="empty-state">
                                <p>Chưa có báo cáo nào từ người dùng.</p>
                            </div>
                        ) : (
                            <div className="report-table-container">
                                <table className="report-table">
                                    <thead>
                                        <tr>
                                            <th>Người báo cáo</th>
                                            <th>Phim lỗi</th>
                                            <th>Vấn đề</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày báo</th>
                                            <th>Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map((report) => (
                                            <tr key={report._id}>
                                                <td>
                                                    <div className="report-user-info">
                                                        <div className="report-avatar">
                                                            <UserIcon size={20} style={{ margin: 10 }} color="#ccc" />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 'bold' }}>{report.userId?.username || 'Unknown'}</div>
                                                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{report.userId?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="report-movie-info">
                                                        <div style={{ fontWeight: 'bold' }}>{report.movieId?.title || 'Unknown Movie'}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="report-reason">{report.reason}</div>
                                                    <div className="report-description" title={report.description}>
                                                        {report.description || 'Không có mô tả chi tiết'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${report.status}`}>
                                                        {report.status}
                                                    </span>
                                                </td>
                                                <td>{formatDate(report.createdAt)}</td>
                                                <td>
                                                    <select
                                                        className="action-select"
                                                        value={report.status}
                                                        onChange={(e) => handleStatusChange(report._id, e.target.value)}
                                                    >
                                                        <option value="pending">Chờ xử lý</option>
                                                        <option value="reviewed">Đang kiểm tra</option>
                                                        <option value="resolved">Đã khắc phục</option>
                                                        <option value="rejected">Từ chối</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportManagement;
