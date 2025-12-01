import React, { useState, useEffect } from 'react';
import { commentAPI, reviewAPI } from '../services/api';
import CommentItem from './CommentItem';
import './CommentSection.css';

const CommentSection = ({ movieId, userId, isAuthenticated }) => {
    const [activeTab, setActiveTab] = useState('comments'); // 'comments' or 'reviews'
    const [comments, setComments] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [reviewText, setReviewText] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Fetch comments
    useEffect(() => {
        if (movieId) {
            fetchComments();
            fetchReviews();
        }
    }, [movieId]);

    const fetchComments = async () => {
        try {
            const { data } = await commentAPI.getByMovie(movieId);
            if (data.success) {
                setComments(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    const fetchReviews = async () => {
        try {
            const { data } = await reviewAPI.getByMovie(movieId);
            if (data.success) {
                setReviews(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert('Vui lòng đăng nhập để bình luận');
            return;
        }
        if (!commentText.trim()) return;

        setSubmitting(true);
        try {
            const { data } = await commentAPI.create({
                movieId,
                content: commentText,
                isAnonymous
            });
            if (data.success) {
                setCommentText('');
                setIsAnonymous(false);
                fetchComments();
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('Không thể gửi bình luận');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            alert('Vui lòng đăng nhập để đánh giá');
            return;
        }
        if (!reviewText.trim() || rating === 0) {
            alert('Vui lòng nhập nội dung và chọn số sao');
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await reviewAPI.create({
                movieId,
                rating,
                comment: reviewText,
                isAnonymous
            });
            if (data.success) {
                setReviewText('');
                setRating(0);
                setIsAnonymous(false);
                fetchReviews();
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert(error.response?.data?.message || 'Không thể gửi đánh giá');
        } finally {
            setSubmitting(false);
        }
    };

    // Helper function to count total comments (including all nested replies)
    const countTotalComments = (commentsList) => {
        let total = 0;
        const countRecursive = (items) => {
            items.forEach(item => {
                total++;
                if (item.replies && item.replies.length > 0) {
                    countRecursive(item.replies);
                }
            });
        };
        countRecursive(commentsList);
        return total;
    };

    const currentText = activeTab === 'comments' ? commentText : reviewText;
    const setCurrentText = activeTab === 'comments' ? setCommentText : setReviewText;
    const maxLength = 1000;

    return (
        <div className="comment-section">
            {/* Header with Tabs */}
            <div className="comment-header">
                <div className="comment-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('comments')}
                    >
                        Bình luận ({countTotalComments(comments)})
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        Đánh giá ({reviews.length})
                    </button>
                </div>
            </div>

            {/* Comment/Review Form */}
            <div className="comment-form-container">
                {isAuthenticated ? (
                    <form onSubmit={activeTab === 'comments' ? handleSubmitComment : handleSubmitReview}>
                        {/* Rating stars for reviews */}
                        {activeTab === 'reviews' && (
                            <div className="rating-input">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        className={`star-btn ${star <= (hoverRating || rating) ? 'active' : ''}`}
                                        onClick={() => setRating(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                    >
                                        ★
                                    </button>
                                ))}
                                {rating > 0 && <span className="rating-value">{rating}/10</span>}
                            </div>
                        )}

                        {/* Text input */}
                        <div className="input-wrapper">
                            <textarea
                                className="comment-input"
                                placeholder={activeTab === 'comments' ? 'Viết bình luận' : 'Viết đánh giá'}
                                value={currentText}
                                onChange={(e) => {
                                    if (e.target.value.length <= maxLength) {
                                        setCurrentText(e.target.value);
                                    }
                                }}
                                maxLength={maxLength}
                            />
                            <div className="input-footer">
                                <div className="anonymous-toggle">
                                    <input
                                        type="checkbox"
                                        id="anonymous"
                                        checked={isAnonymous}
                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                    />
                                    <label htmlFor="anonymous">Ẩn danh?</label>
                                </div>
                                <span className="char-counter">{currentText.length} / {maxLength}</span>
                            </div>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={submitting || !currentText.trim() || (activeTab === 'reviews' && rating === 0)}
                        >
                            {submitting ? 'Đang gửi...' : 'Gửi ▶'}
                        </button>
                    </form>
                ) : (
                    <div className="login-prompt">
                        Vui lòng <span className="login-link">đăng nhập</span> để tham gia bình luận.
                    </div>
                )}
            </div>

            {/* Comments/Reviews List */}
            <div className="comment-list">
                {activeTab === 'comments' ? (
                    comments.length > 0 ? (
                        comments.map((comment) => (
                            <CommentItem
                                key={comment._id}
                                item={comment}
                                type="comment"
                                userId={userId}
                                onUpdate={fetchComments}
                            />
                        ))
                    ) : (
                        <div className="empty-state">Chưa có bình luận nào</div>
                    )
                ) : (
                    reviews.length > 0 ? (
                        reviews.map((review) => (
                            <CommentItem
                                key={review._id}
                                item={review}
                                type="review"
                                userId={userId}
                                onUpdate={fetchReviews}
                            />
                        ))
                    ) : (
                        <div className="empty-state">Chưa có đánh giá nào</div>
                    )
                )}
            </div>
        </div>
    );
};

export default CommentSection;
