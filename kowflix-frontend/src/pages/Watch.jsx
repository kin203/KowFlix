import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Bookmark, Share2, Star, Play } from 'lucide-react';
import { movieAPI, progressAPI, reviewAPI } from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import './Watch.css';

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

                if (data.success && data.data && data.data.master) {
                    setMovie(data.data);
                    setHlsUrl(data.data.master);

                    // Debug: Check movie data
                    console.log('🎬 Movie Full Data:', data.data);
                    console.log('📊 Genres:', data.data.genres);
                    console.log('⭐ IMDb Rating:', data.data.imdbRating);
                    console.log('📅 Year:', data.data.releaseYear, data.data.releaseDate);

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
                    setError(data.message || "Video chưa được encode!");
                }
            } catch (err) {
                console.error("Play error", err);
                setError(err.response?.data?.message || "Failed to load video");
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
            <div className="watch-page">
                <div className="loading">Đang tải...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="watch-page">
                <Link to="/" className="back-button">
                    <ArrowLeft size={24} /> Quay lại
                </Link>
                <div className="error-message">{error}</div>
            </div>
        );
    }

    const year = movie.releaseYear || (movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '2024');

    return (
        <div className="watch-page">
            <Link to="/" className="back-button">
                <ArrowLeft size={24} /> Quay lại
            </Link>

            {movie && hlsUrl && (
                <>
                    {/* Video Player */}
                    <div className="video-wrapper">
                        <VideoPlayer
                            src={hlsUrl}
                            poster={movie.backdrop || movie.poster}
                            onProgress={handleProgress}
                            initialTime={initialTime}
                            movieId={id}
                            subtitles={movie.subtitles || []}
                        />

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

                    {/* Main Content Area */}
                    <div className="content-wrapper">
                        <div className="main-section">
                            {/* Movie Header with Poster */}
                            <div className="movie-header-section">
                                <img
                                    src={movie.poster}
                                    alt={movie.title}
                                    className="movie-poster-thumb"
                                />
                                <div className="movie-header-info">
                                    <h1 className="movie-title">{movie.title}</h1>
                                    <div className="movie-meta-badges">
                                        <span className="meta-badge year">{year}</span>
                                        {movie.runtime && (
                                            <span className="meta-badge duration">
                                                {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                                            </span>
                                        )}
                                        {movie.imdbRating && (
                                            <span className="meta-badge imdb">
                                                <Star size={14} fill="#F5C518" stroke="#F5C518" />
                                                {movie.imdbRating.toFixed(1)}
                                            </span>
                                        )}
                                        {avgRating && (
                                            <span className="meta-badge user-rating">
                                                👥 {avgRating} ({reviews.length})
                                            </span>
                                        )}
                                    </div>

                                    {/* Genre Tags */}
                                    {movie.genres && movie.genres.length > 0 && (
                                        <div className="genre-tags">
                                            {movie.genres.map((genre, index) => (
                                                <span key={index} className="genre-tag">{genre}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Movie Description */}
                            {movie.description && (
                                <div className="content-block">
                                    <h3 className="block-title">Nội dung phim</h3>
                                    <p className="movie-description">{movie.description}</p>

                                    {/* Director and Cast Info */}
                                    <div className="movie-credits">
                                        {movie.director && (
                                            <div className="credit-item">
                                                <span className="credit-label">Đạo diễn:</span>
                                                <span className="credit-value">{movie.director}</span>
                                            </div>
                                        )}
                                        {movie.cast && movie.cast.length > 0 && (
                                            <div className="credit-item">
                                                <span className="credit-label">Diễn viên:</span>
                                                <span className="credit-value">{movie.cast.slice(0, 5).join(', ')}</span>
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
                                        {movie.cast.slice(0, 6).map((actor, index) => (
                                            <div key={index} className="cast-item">
                                                <div className="cast-avatar">
                                                    {actor.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="cast-name">{actor}</span>
                                            </div>
                                        ))}
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
                </>
            )}
        </div>
    );
};

export default Watch;
