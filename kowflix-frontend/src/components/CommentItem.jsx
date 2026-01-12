import React, { useState } from 'react';
import { commentAPI, reviewAPI } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const CommentItem = ({ item, type, userId, onUpdate }) => {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(item.content || item.comment);
    const [submitting, setSubmitting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);


    const isOwner = userId && item.userId?._id === userId;
    const displayName = item.isAnonymous ? 'Ẩn danh' : (item.userId?.username || item.userId?.profile?.name || 'Người dùng chưa đặt tên');
    const avatar = item.isAnonymous ? null : (item.userId?.profile?.avatar || null);

    // Format timestamp
    const getTimeAgo = (date) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
        } catch {
            return 'vừa xong';
        }
    };

    // Determine if this item is a review or a comment
    const isReview = type === 'review' || item.isReview;

    // Handle like
    const handleLike = async () => {
        if (!userId) {
            alert('Vui lòng đăng nhập để thích bình luận');
            return;
        }
        try {
            if (isReview) {
                await reviewAPI.like(item._id);
            } else {
                await commentAPI.like(item._id);
            }
            onUpdate();
        } catch (error) {
            console.error('Error liking:', error);
            alert('Có lỗi xảy ra khi thích');
        }
    };

    // Handle dislike
    const handleDislike = async () => {
        if (!userId) {
            alert('Vui lòng đăng nhập để không thích bình luận');
            return;
        }
        try {
            if (isReview) {
                await reviewAPI.dislike(item._id);
            } else {
                await commentAPI.dislike(item._id);
            }
            onUpdate();
        } catch (error) {
            console.error('Error disliking:', error);
            alert('Có lỗi xảy ra khi không thích');
        }
    };

    // Handle edit
    const handleEdit = async () => {
        if (!editText.trim()) return;
        setSubmitting(true);
        try {
            if (isReview) {
                // Determine if we need to send 'comment' or 'content' field. 
                // Review model usually expects 'comment'. Frontend might use 'content' for generic display.
                // Let's send both or specific based on API. reviewAPI.update needs implementation too in api/reviewAPI.js? 
                // Wait, I implemented updateReview controller, but did I add it to frontend API?
                // I need to check `src/services/api/reviewAPI.js` next. Assuming it exists or I will add it.
                await reviewAPI.update(item._id, { comment: editText });
            } else {
                await commentAPI.update(item._id, { content: editText });
            }
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            console.error('Error editing:', error);
            alert('Không thể chỉnh sửa');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!confirm('Bạn có chắc muốn xóa?')) return;
        try {
            if (isReview) {
                await reviewAPI.delete(item._id);
            } else {
                await commentAPI.delete(item._id);
            }
            onUpdate();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Không thể xóa');
        }
    };

    // Handle reply
    const handleReply = async () => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            await commentAPI.create({
                movieId: item.movieId,
                content: replyText,
                parentId: item._id
            });
            setReplyText('');
            setShowReplyForm(false);
            onUpdate();
        } catch (error) {
            console.error('Error replying:', error);
            alert('Không thể trả lời');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="comment-item">
            <div className="comment-avatar">
                {avatar ? (
                    <img src={avatar} alt={displayName} />
                ) : (
                    <div className={`avatar-placeholder ${item.isAnonymous ? 'anonymous' : ''}`}>
                        {item.isAnonymous ? '🕶️' : displayName.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

            <div className="comment-content">
                <div className="comment-header-info">
                    <div className="header-left">
                        <span className="comment-author">{displayName}</span>
                        {type === 'review' && item.rating && (
                            <span className="comment-rating">⭐ {item.rating}/10</span>
                        )}
                        <span className="comment-time">{getTimeAgo(item.createdAt)}</span>
                    </div>

                    {isOwner && (
                        <div className="comment-menu-container">
                            <button
                                className="menu-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                            >
                                ⋮
                            </button>
                            {showMenu && (
                                <div className="menu-dropdown">
                                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }}>
                                        ✏️ Sửa
                                    </button>
                                    <button onClick={() => { handleDelete(); setShowMenu(false); }}>
                                        🗑️ Xóa
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <div className="edit-form">
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            maxLength={1000}
                        />
                        <div className="edit-actions">
                            <button onClick={handleEdit} disabled={submitting}>Lưu</button>
                            <button onClick={() => setIsEditing(false)}>Hủy</button>
                        </div>
                    </div>
                ) : (
                    <p className="comment-text">{item.content || item.comment}</p>
                )}

                <div className="comment-actions">
                    <button className="action-btn" onClick={handleLike}>
                        👍 {item.likeCount || 0}
                    </button>
                    <button className="action-btn" onClick={handleDislike}>
                        👎 {item.dislikeCount || 0}
                    </button>
                    {type === 'comment' && (
                        <button className="action-btn" onClick={() => setShowReplyForm(!showReplyForm)}>
                            💬 Trả lời
                        </button>
                    )}
                </div>

                {/* Reply form */}
                {showReplyForm && (
                    <div className="reply-form">
                        <textarea
                            placeholder="Viết câu trả lời..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            maxLength={1000}
                        />
                        <div className="reply-actions">
                            <button onClick={handleReply} disabled={submitting}>Gửi</button>
                            <button onClick={() => setShowReplyForm(false)}>Hủy</button>
                        </div>
                    </div>
                )}

                {/* Nested replies */}
                {item.replies && item.replies.length > 0 && (
                    <div className="replies-list">
                        {item.replies.map((reply) => (
                            <CommentItem
                                key={reply._id}
                                item={reply}
                                type="comment"
                                userId={userId}
                                onUpdate={onUpdate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentItem;
