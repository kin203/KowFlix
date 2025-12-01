import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Bookmark, Share2, Star, Play } from 'lucide-react';
import { movieAPI, progressAPI, reviewAPI } from '../services/api';
import VideoPlayerWrapper from '../components/VideoPlayerWrapper';
import Navbar from '../components/Navbar';
import './Watch.css';
import './VideoError.css';

const Watch = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [hlsUrl, setHlsUrl] = useState(null);
    const [initialTime, setInitialTime] = useState(0);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(null);
    const [recommendedMovies, setRecommendedMovies] = useState([]);
    const [userRating, setUserRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { data } = await movieAPI.play(id);

                // Always set movie data if available, even if video is missing
                if (data.data) {
                    setMovie(data.data);
                }

                if (data.success && data.data && data.data.master) {
                    setHlsUrl(data.data.master);
                    setError(null);

                    try {
                        const progressRes = await progressAPI.get(id);
                        if (progressRes.data.success && progressRes.data.data) {
                            setInitialTime(progressRes.data.data.currentTime || 0);
                        }
                    } catch (err) {
                        console.log('No previous progress found');
                    }

                    fetchReviews();

                    if (data.data.genres && data.data.genres.length > 0) {
                        fetchRecommendedMovies(data.data.genres[0]);
                    }
                } else {
                    // Specific error for missing encode
                    setError({
                        code: 'ERR_01',
                        message: 'Video chưa được encode. Vui lòng quay lại sau!'
                    });
                }
            } catch (err) {
                console.error("Play error", err);
                setError({
                    code: 'ERR_02',
                    message: err.response?.data?.message || "Không thể tải dữ liệu phim"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const fetchReviews = async () => {
        try {
            const response = await reviewAPI.getMovieReviews(id);
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
        }
    };

    const fetchRecommendedMovies = async (genre) => {
        try {
            const response = await movieAPI.getAll({ genres: genre, limit: 6 });
            if (response.data.success) {
                const filtered = response.data.data.filter(m => m._id !== id);
                setRecommendedMovies(filtered.slice(0, 5));
            }
        } catch (error) {
            console.error('Failed to fetch recommended movies:', error);
        }
    };

    const handleProgress = async ({ currentTime, duration }) => {
        try {
            await progressAPI.save(id, { currentTime, duration });
        } catch (err) {
            console.error('Failed to save progress:', err);
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
                movieId: id,
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
            const errorMsg = error.response?.data?.message || 'Không thể gửi đánh giá';
            setSubmitError(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="watch-page">
                    <div className="loading">Đang tải...</div>
                </div>
            </>
        );
    }

    const year = movie?.releaseYear || (movie?.releaseDate ? new Date(movie.releaseDate).getFullYear() : '2024');

    return (
        <>
            <Navbar />
            <div className="watch-page">
                {/* Back Button / Breadcrumb */}
                <div className="watch-breadcrumb">
                    <Link to="/" className="back-button">
                        <ArrowLeft size={20} />
                        <span>Xem phim {movie?.title || ''}</span>
                    </Link>
                </div>

                {/* Video Player Area - Rendered independently of movie details */}
                <div className="video-wrapper">
                    {error ? (
                        <div className="video-error-container">
                            <div className="error-icon">⚠️</div>
                            <div className="error-code">{error.code}</div>
                            <div className="error-message">{error.message}</div>
                        </div>
                    ) : hlsUrl ? (
                        <VideoPlayerWrapper
                            src={hlsUrl}
                            poster={movie?.backdrop || movie?.poster}
                            onProgress={handleProgress}
                            initialTime={initialTime}
                            movieId={id}
                            subtitles={Array.isArray(movie?.subtitles) ? movie.subtitles : []}
                        />
                    ) : (
                        <div className="video-placeholder">
                            <div className="loading-spinner"></div>
                        </div>
                    )}

                    {/* Action Buttons Under Video */}
                    <div className="video-actions">
                        <button className="action-btn">
                            <Heart size={18} /> Thích
                        </button>
                        <button className="action-btn">
                            <Bookmark size={18} /> Lưu
                        </button>
                        <button className="action-btn">
                            <Share2 size={18} /> Chia sẻ
                        </button>
                    </div>
                </div>

                {movie && (
                    <div className="content-wrapper">
                        <div className="main-section">
                            {/* Movie Header with Poster */}
                            <div className="movie-header-section">
                                <img
                                    src={movie?.poster || ''}
                                    alt={movie?.title || 'Movie Poster'}
                                    className="movie-poster-thumb"
                                />
                                <div className="movie-header-info">
                                    <h1 className="movie-title">{movie?.title}</h1>
                                    <div className="movie-meta-badges">
                                        <span className="meta-badge year">{year}</span>
                                        {movie?.runtime && (
                                            <span className="meta-badge duration">
                                                {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                                            </span>
                                        )}
                                        {movie?.imdbRating && !isNaN(parseFloat(movie.imdbRating)) && (
                                            <span className="meta-badge imdb">
                                                <Star size={14} fill="#F5C518" stroke="#F5C518" />
                                                {Number(movie.imdbRating).toFixed(1)}
                                            </span>
                                        )}
                                        {avgRating && (
                                            <span className="meta-badge user-rating">
                                                👥 {avgRating} ({reviews.length})
                                            </span>
                                        )}
                                    </div>

                                    {/* Genre Tags */}
                                    {Array.isArray(movie?.genres) && movie.genres.length > 0 && (
                                        <div className="genre-tags">
                                            {movie.genres.map((genre, index) => (
                                                <span key={index} className="genre-tag">{genre}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Movie Description */}
                            {movie?.description && (
                                <div className="content-block">
                                    <h3 className="block-title">Nội dung phim</h3>
                                    <p className="movie-description">{movie.description}</p>

                                    {/* Director and Cast Info */}
                                    <div className="movie-credits">
                                        {movie?.director && (
                                            <div className="credit-item">
                                                <span className="credit-label">Đạo diễn:</span>
                                                <span className="credit-value">{movie.director}</span>
                                            </div>
                                        )}
                                        {Array.isArray(movie?.cast) && movie.cast.length > 0 && (
                                            <div className="credit-item">
                                                <span className="credit-label">Diễn viên:</span>
                                                <span className="credit-value">
                                                    {movie.cast.slice(0, 5).map(actor => {
                                                        if (!actor) return '';
                                                        return typeof actor === 'string' ? actor : (actor.name || '');
                                                    }).filter(Boolean).join(', ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Cast Section */}
                            {movie.cast && movie.cast.length > 0 && (
                                <div className="content-block">
                                    <h3 className="block-title">Diễn viên</h3>
                                    <div className="cast-grid">
                                        {movie.cast.slice(0, 6).map((actor, index) => {
                                            // Handle both old format (string) and new format (object)
                                            const actorName = typeof actor === 'string' ? actor : actor.name;
                                            const actorPhoto = typeof actor === 'object' ? actor.profile_path : null;

                                            return (
                                                <div key={index} className="cast-item">
                                                    {actorPhoto ? (
                                                        <img
                                                            src={actorPhoto}
                                                            alt={actorName}
                                                            className="cast-photo"
                                                        />
                                                    ) : (
                                                        <div className="cast-avatar">
                                                            {actorName?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="cast-name">{actorName}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Reviews Section */}
                            <div className="content-block reviews-block">
                                <h3 className="block-title">Bình luận ({reviews.length})</h3>

                                {/* Review Form */}
                                <div className="review-form-card">
                                    <form onSubmit={handleSubmitReview}>
                                        <div className="form-group">
                                            <label>Đánh giá của bạn</label>
                                            <div className="stars-input">
                                                {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
                                                    <Star
                                                        key={star}
                                                        size={22}
                                                        className="star-btn"
                                                        fill={star <= (hoverRating || userRating) ? '#FFD700' : 'none'}
                                                        stroke={star <= (hoverRating || userRating) ? '#FFD700' : '#666'}
                                                        onClick={() => setUserRating(star)}
                                                        onMouseEnter={() => setHoverRating(star)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                    />
                                                ))}
                                                {userRating > 0 && <span className="rating-value">{userRating}/10</span>}
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <textarea
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                onKeyDown={(e) => e.stopPropagation()} // Prevent VideoPlayer shortcuts
                                                placeholder="Viết bình luận của bạn..."
                                                rows={3}
                                                maxLength={1000}
                                            />
                                            <div className="textarea-footer">
                                                <span className="char-count">{comment.length}/1000</span>
                                                <button type="submit" className="submit-btn" disabled={submitting}>
                                                    {submitting ? 'Đang gửi...' : 'Gửi'}
                                                </button>
                                            </div>
                                        </div>

                                        {submitError && <div className="alert alert-error">{submitError}</div>}
                                        {submitSuccess && <div className="alert alert-success">✓ Đã gửi!</div>}
                                    </form>
                                </div>

                                {/* Reviews List */}
                                <div className="reviews-list">
                                    {reviews.length > 0 ? (
                                        reviews.map((review) => (
                                            <div key={review._id} className="review-card">
                                                <div className="review-header">
                                                    <div className="reviewer">
                                                        <div className="reviewer-avatar">
                                                            {review.userId?.username?.charAt(0).toUpperCase() || 'U'}
                                                        </div>
                                                        <div className="reviewer-info">
                                                            <div className="reviewer-name">{review.userId?.username || 'Anonymous'}</div>
                                                            <div className="review-date">
                                                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="review-score">
                                                        <Star size={16} fill="#FFD700" stroke="#FFD700" />
                                                        <span>{review.rating}/10</span>
                                                    </div>
                                                </div>
                                                <p className="review-text">{review.comment}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-reviews">Chưa có bình luận nào</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside className="sidebar-section">
                            <h3 className="sidebar-title">Đề xuất cho bạn</h3>
                            <div className="recommended-list">
                                {recommendedMovies.map((recMovie) => (
                                    <div
                                        key={recMovie._id}
                                        className="recommended-card"
                                        onClick={() => navigate(`/watch/${recMovie._id}`)}
                                    >
                                        <div className="rec-poster-wrapper">
                                            <img
                                                src={recMovie.poster}
                                                alt={recMovie.title}
                                                className="rec-poster"
                                            />
                                            <div className="play-icon">
                                                <Play size={28} fill="white" />
                                            </div>
                                        </div>
                                        <div className="rec-info">
                                            <h4 className="rec-title">{recMovie.title}</h4>
                                            <div className="rec-meta">
                                                <span>{recMovie.releaseYear || (recMovie.releaseDate ? new Date(recMovie.releaseDate).getFullYear() : '2024')}</span>
                                                {recMovie.imdbRating && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="rec-rating">
                                                            <Star size={12} fill="#FFD700" stroke="#FFD700" />
                                                            {recMovie.imdbRating.toFixed(1)}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </>
    );
};

export default Watch;
