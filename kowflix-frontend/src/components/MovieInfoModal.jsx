import React, { useEffect, useState } from 'react';
import { X, Play, Heart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reviewAPI, wishlistAPI } from '../services/api';
import './MovieInfoModal.css';
import './MovieInfoModalReviews.css';

const MovieInfoModal = ({ movie, onClose }) => {
    const { t, i18n } = useTranslation();
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
    const [inWishlist, setInWishlist] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        fetchReviews();
        checkWishlist();

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

    const checkWishlist = async () => {
        try {
            const { data } = await wishlistAPI.check(movie._id);
            setInWishlist(data.data.inWishlist);
        } catch (error) {
            console.error('Error checking wishlist:', error);
        }
    };

    const handleToggleWishlist = async () => {
        if (wishlistLoading) return;
        setWishlistLoading(true);
        try {
            if (inWishlist) {
                await wishlistAPI.remove(movie._id);
                setInWishlist(false);
            } else {
                await wishlistAPI.add(movie._id);
                setInWishlist(true);
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            alert(error.response?.data?.message || t('auth.login_required')); // translated
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            setSubmitError(t('auth.login_required'));
            return;
        }

        if (userRating === 0) {
            setSubmitError(t('modal.select_rating'));
            return;
        }

        if (comment.trim().length < 10) {
            setSubmitError(t('modal.placeholder_comment'));
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
            const errorMsg = error.response?.data?.message || t('modal.submit_error') || 'Error submitting review';
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

    const isEnglish = i18n.language === 'en';
    const displayTitle = (isEnglish && movie.title_en) ? movie.title_en : movie.title;
    const displayDescription = (isEnglish && movie.description_en) ? movie.description_en : movie.description;

    return (
        <div className="movie-info-modal-backdrop" onClick={handleBackdropClick}>
            <div className="movie-info-modal">
                <button className="modal-close-btn" onClick={onClose}>
                    <X size={28} />
                </button>

                <div className="modal-hero" style={{ backgroundImage: `url(${movie.backdrop || movie.background || movie.poster || ''})` }}>
                    <div className="modal-hero-overlay">
                        <div className="modal-hero-content">
                            <h1 className="modal-title">{displayTitle}</h1>
                            <div className="modal-actions">
                                <button className="modal-play-btn" onClick={handlePlayClick}>
                                    <Play size={24} fill="black" />
                                    {t('common.watch_now')}
                                </button>
                                <button
                                    className={`modal-icon-btn ${inWishlist ? 'active' : ''}`}
                                    onClick={handleToggleWishlist}
                                    disabled={wishlistLoading}
                                >
                                    <Heart size={24} fill={inWishlist ? 'currentColor' : 'none'} />
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
                            {displayDescription || t('common.no_description') || 'No description available.'}
                        </p>
                    </div>

                    <div className="modal-secondary-info">
                        <div className="modal-info-row">
                            <span className="modal-label">{t('common.cast')}:</span>
                            <span className="modal-value">
                                {(() => {
                                    if (!movie.cast || movie.cast.length === 0) return 'N/A';

                                    return movie.cast.map(c => {
                                        // Handle string format
                                        if (typeof c === 'string') {
                                            if (c.includes('[object Object]')) return null;
                                            return c.trim();
                                        }
                                        // Handle object format
                                        if (c && typeof c === 'object') return c.name || null;
                                        return null;
                                    })
                                        .filter(Boolean)
                                        .join(', ') || 'N/A';
                                })()}
                            </span>
                        </div>
                        <div className="modal-info-row">
                            <span className="modal-label">{t('common.genres')}:</span>
                            <span className="modal-value">
                                {movie.genres?.map(g => {
                                    const key = `genres.${g.toLowerCase().replace(/\s+/g, '_')}`;
                                    const translated = t(key);
                                    return translated !== key ? translated : g;
                                }).join(', ') || 'N/A'}
                            </span>
                        </div>
                        <div className="modal-info-row">
                            <span className="modal-label">{t('common.director')}:</span>
                            <span className="modal-value">{movie.director || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="modal-reviews">
                    <div className="reviews-header">
                        <h3>{t('modal.reviews_title')}</h3>
                        {avgRating && (
                            <div className="average-rating">
                                <span className="rating-number">{avgRating}</span>
                                <div className="rating-stars">{renderStars(Math.round(avgRating))}</div>
                                <span className="rating-count">({reviews.length} đánh giá)</span>
                            </div>
                        )}
                    </div>

                    <form className="review-form" onSubmit={handleSubmitReview}>
                        <h4>{t('modal.write_review')}</h4>

                        <div className="rating-selector">
                            <label>{t('modal.select_rating')}</label>
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
                            <label>{t('modal.your_comment')}</label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={t('modal.placeholder_comment')}
                                rows={4}
                                maxLength={1000}
                            />
                            <span className="char-count">{comment.length}/1000</span>
                        </div>

                        {submitError && <div className="submit-error">{submitError}</div>}
                        {submitSuccess && <div className="submit-success">{t('modal.success_review')}</div>}

                        <button type="submit" className="submit-review-btn" disabled={submitting}>
                            {submitting ? t('modal.submitting') : t('modal.submit_review')}
                        </button>
                    </form>

                    <div className="reviews-list">
                        {loading ? (
                            <div className="reviews-loading">{t('modal.loading_reviews')}</div>
                        ) : reviews.length > 0 ? (
                            reviews.map((review) => {
                                const displayName = review.userId?.profile?.name || review.userId?.username || 'User';
                                const avatarInitial = displayName.charAt(0).toUpperCase();

                                return (
                                    <div key={review._id} className="review-item">
                                        <div className="review-header">
                                            <div className="review-user">
                                                <div className="user-avatar">
                                                    {review.userId?.profile?.avatar ? (
                                                        <img
                                                            src={review.userId.profile.avatar}
                                                            alt={displayName}
                                                            className="avatar-img"
                                                        />
                                                    ) : (
                                                        avatarInitial
                                                    )}
                                                </div>
                                                <div className="user-info">
                                                    <span className="user-name">
                                                        {displayName}
                                                    </span>
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
                                );
                            })
                        ) : (
                            <div className="no-reviews">
                                <p>{t('modal.no_reviews')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovieInfoModal;
