import React, { useEffect, useState } from 'react';
import { X, Play, Plus, ThumbsUp, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { reviewAPI } from '../services/api';
import './MovieInfoModal.css';
import './MovieInfoModalReviews.css';

const MovieInfoModal = ({ movie, onClose }) => {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRating, setUserRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        fetchReviews();

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [movie._id]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await reviewAPI.getMovieReviews(movie._id);
            if (response.data.success) {
                const reviewsData = response.data.data;
                setReviews(reviewsData);

                if (reviewsData.length > 0) {
                    const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
                    setAvgRating(avg.toFixed(1));
                }
            }
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            setSubmitError('Vui lòng đăng nhập để đánh giá phim');
            return;
        }

        if (userRating === 0) {
            setSubmitError('Vui lòng chọn rating');
            return;
        }

        if (comment.trim().length < 10) {
            setSubmitError('Comment phải có ít nhất 10 ký tự');
            return;
        }

        try {
            setSubmitting(true);
            setSubmitError('');

            await reviewAPI.create({
                movieId: movie._id,
                rating: userRating,
                comment: comment.trim()
            });

            setSubmitSuccess(true);
            setUserRating(0);
            setComment('');

            await fetchReviews();

            setTimeout(() => setSubmitSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to submit review:', error);
            const errorMsg = error.response?.data?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.';
            setSubmitError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (rating) => {
        return Array.from({ length: 10 }, (_, i) => (
            <Star
                key={i}
                size={16}
                fill={i < rating ? '#FFD700' : 'none'}
                stroke={i < rating ? '#FFD700' : '#666'}
            />
        ));
    };

    const handlePlayClick = () => {
        navigate(`/watch/${movie._id}`);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!movie) return null;

    return (
        <div className="movie-info-modal-backdrop" onClick={handleBackdropClick}>
            <div className="movie-info-modal">
                <button className="modal-close-btn" onClick={onClose}>
                    <X size={28} />
                </button>

                <div className="modal-hero" style={{ backgroundImage: `url(${movie.backdrop || movie.background || movie.poster || ''})` }}>
                    <div className="modal-hero-overlay">
                        <div className="modal-hero-content">
                            <h1 className="modal-title">{movie.title}</h1>
                            <div className="modal-actions">
                                <button className="modal-play-btn" onClick={handlePlayClick}>
                                    <Play size={24} fill="black" />
                                    Xem ngay
                                </button>
                                <button className="modal-icon-btn">
                                    <Plus size={24} />
                                </button>
                                <button className="modal-icon-btn">
                                    <ThumbsUp size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-details">
                    <div className="modal-main-info">
                        <div className="modal-meta">
                            <span className="modal-year">{movie.releaseYear || new Date(movie.releaseDate).getFullYear() || '2024'}</span>
                            {movie.imdbRating && (
                                <span className="modal-rating">⭐ {movie.imdbRating.toFixed(1)}</span>
                            )}
                            {movie.runtime && (
                                <span className="modal-duration">{Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>
                            )}
                            <span className="modal-quality">HD</span>
                        </div>

                        <p className="modal-description">
                            {movie.description || 'No description available.'}
                        </p>
                    </div>

                    <div className="modal-secondary-info">
                        <div className="modal-info-row">
                            <span className="modal-label">Cast:</span>
                            <span className="modal-value">
                                {(() => {
                                    console.log('🎭 Cast data:', movie.cast);
                                    console.log('🎭 First cast item:', movie.cast?.[0]);
                                    return movie.cast?.map(c => {
                                        if (typeof c === 'string') return c;
                                        if (c && typeof c === 'object') return c.name || JSON.stringify(c);
                                        return 'Unknown';
                                    }).filter(Boolean).join(', ') || 'N/A';
                                })()}
                            </span>
                        </div>
                        <div className="modal-info-row">
                            <span className="modal-label">Genres:</span>
                            <span className="modal-value">{movie.genres?.join(', ') || 'N/A'}</span>
                        </div>
                        <div className="modal-info-row">
                            <span className="modal-label">Director:</span>
                            <span className="modal-value">{movie.director || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="modal-reviews">
                    <div className="reviews-header">
                        <h3>Đánh giá từ người xem</h3>
                        {avgRating && (
                            <div className="average-rating">
                                <span className="rating-number">{avgRating}</span>
                                <div className="rating-stars">{renderStars(Math.round(avgRating))}</div>
                                <span className="rating-count">({reviews.length} đánh giá)</span>
                            </div>
                        )}
                    </div>

                    <form className="review-form" onSubmit={handleSubmitReview}>
                        <h4>Viết đánh giá của bạn</h4>

                        <div className="rating-selector">
                            <label>Chọn rating (1-10):</label>
                            <div className="stars-selector">
                                {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
                                    <Star
                                        key={star}
                                        size={28}
                                        className="star-selectable"
                                        fill={star <= (hoverRating || userRating) ? '#FFD700' : 'none'}
                                        stroke={star <= (hoverRating || userRating) ? '#FFD700' : '#666'}
                                        onClick={() => setUserRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                    />
                                ))}
                                {userRating > 0 && <span className="selected-rating">{userRating}/10</span>}
                            </div>
                        </div>

                        <div className="comment-field">
                            <label>Nhận xét của bạn:</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Chia sẻ suy nghĩ của bạn về bộ phim này... (tối thiểu 10 ký tự)"
                                rows={4}
                                maxLength={1000}
                            />
                            <span className="char-count">{comment.length}/1000</span>
                        </div>

                        {submitError && <div className="submit-error">{submitError}</div>}
                        {submitSuccess && <div className="submit-success">✓ Đánh giá của bạn đã được gửi!</div>}

                        <button type="submit" className="submit-review-btn" disabled={submitting}>
                            {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                    </form>

                    <div className="reviews-list">
                        {loading ? (
                            <div className="reviews-loading">Đang tải đánh giá...</div>
                        ) : reviews.length > 0 ? (
                            reviews.map((review) => (
                                <div key={review._id} className="review-item">
                                    <div className="review-header">
                                        <div className="review-user">
                                            <div className="user-avatar">
                                                {review.userId?.username?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div className="user-info">
                                                <span className="user-name">{review.userId?.username || 'Anonymous'}</span>
                                                <span className="review-date">
                                                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="review-rating">
                                            {renderStars(review.rating)}
                                            <span className="rating-text">{review.rating}/10</span>
                                        </div>
                                    </div>
                                    <p className="review-comment">{review.comment}</p>
                                </div>
                            ))
                        ) : (
                            <div className="no-reviews">
                                <p>Chưa có đánh giá nào cho phim này</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieInfoModal;
