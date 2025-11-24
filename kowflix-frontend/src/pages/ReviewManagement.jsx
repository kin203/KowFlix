import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../components/admin/DashboardSidebar';
import { reviewAPI } from '../services/api';
import { Search, Trash2, Star, User as UserIcon } from 'lucide-react';
import './ReviewManagement.css';

const ReviewManagement = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchReviews();
    }, [page, debouncedSearch]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await reviewAPI.getAll({
                page,
                limit: 10,
                search: debouncedSearch
            });

            if (response.data.success) {
                setReviews(response.data.data);
                setTotalPages(response.data.pagination.pages);
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            try {
                await reviewAPI.delete(id);
                fetchReviews();
            } catch (error) {
                console.error('Failed to delete review:', error);
                alert('Failed to delete review');
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="review-management-container">
            <DashboardSidebar />
            <div className="review-content">
                <div className="review-header">
                    <h1>Quản lý Đánh giá</h1>
                    <div className="search-box">
                        <Search className="search-icon" size={20} />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Tìm kiếm nội dung đánh giá..."
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
                        <div className="review-table-container">
                            <table className="review-table">
                                <thead>
                                    <tr>
                                        <th>Người dùng</th>
                                        <th>Phim</th>
                                        <th>Đánh giá</th>
                                        <th>Ngày đăng</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reviews.map((review) => (
                                        <tr key={review._id}>
                                            <td>
                                                <div className="review-user-info">
                                                    {review.userId?.profile?.avatar ? (
                                                        <img
                                                            src={review.userId.profile.avatar}
                                                            alt={review.userId.profile.name}
                                                            className="review-avatar"
                                                        />
                                                    ) : (
                                                        <div className="review-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <UserIcon size={16} color="#888" />
                                                        </div>
                                                    )}
                                                    <div className="review-user-details">
                                                        <h4>{review.userId?.profile?.name || 'Unknown User'}</h4>
                                                        <p>{review.userId?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="review-movie-info">
                                                    {review.movieId?.poster && (
                                                        <img
                                                            src={review.movieId.poster}
                                                            alt={review.movieId.title}
                                                            className="review-poster"
                                                        />
                                                    )}
                                                    <span className="review-movie-title">
                                                        {review.movieId?.title || 'Unknown Movie'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="review-rating">
                                                    <Star size={16} fill="#FFD700" />
                                                    <span>{review.rating}/10</span>
                                                </div>
                                                <p className="review-comment">{review.comment}</p>
                                            </td>
                                            <td>
                                                <span className="review-date">
                                                    {formatDate(review.createdAt)}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(review._id)}
                                                    title="Delete Review"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
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

export default ReviewManagement;
