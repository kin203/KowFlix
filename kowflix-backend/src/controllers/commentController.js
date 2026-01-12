import Comment from '../models/Comment.js';
import Review from '../models/Review.js'; // Import Review model
import Notification from '../models/Notification.js';

// Get comments for a movie (including legacy reviews)
export const getMovieComments = async (req, res) => {
    try {
        const { movieId } = req.params;

        // Fetch new comments
        const comments = await Comment.find({ movieId })
            .populate('userId', 'username email profile')
            .sort({ createdAt: -1 }) // Newest first
            .lean();

        // Fetch legacy reviews
        const reviews = await Review.find({ movieId })
            .populate('userId', 'username email profile')
            .lean();

        // Process comments: Add counts and structure threads
        const commentMap = {};
        const rootComments = [];

        // Process reviews and add to map
        const formattedReviews = reviews.map(review => {
            const formatted = {
                ...review,
                _id: review._id.toString(), // Ensure ID is string for map key
                content: review.comment,
                isReview: true,
                rating: review.rating,
                likeCount: review.likes ? review.likes.length : 0,
                dislikeCount: review.dislikes ? review.dislikes.length : 0,
                replies: [],
                createdAt: review.createdAt
            };
            commentMap[formatted._id] = formatted; // Add to map for linking
            return formatted;
        });

        // First pass: Prepare comments and map them
        comments.forEach(comment => {
            comment.likeCount = comment.likes ? comment.likes.length : 0;
            comment.dislikeCount = comment.dislikes ? comment.dislikes.length : 0;
            comment.replies = [];
            comment.isReview = false;
            commentMap[comment._id.toString()] = comment;
        });

        // Second pass: Link replies to parents (Comments or Reviews)
        comments.forEach(comment => {
            if (comment.parentId) {
                const parent = commentMap[comment.parentId.toString()];
                if (parent) {
                    parent.replies.push(comment);
                    // Sort replies oldest to newest
                    parent.replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                } else {
                    // Orphaned reply (parent deleted?) -> Treat as root
                    rootComments.push(comment);
                }
            } else {
                rootComments.push(comment);
            }
        });

        // Merge roots and reviews (reviews are always roots)
        const allContent = [...rootComments, ...formattedReviews].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json({
            success: true,
            data: allContent
        });
    } catch (error) {
        console.error('getMovieComments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch comments'
        });
    }
};

// Create a new comment
// Create a new comment
export const createComment = async (req, res) => {
    try {
        const { movieId, content, parentId } = req.body;
        const userId = req.user.id;

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Comment content is required'
            });
        }

        const comment = new Comment({
            userId,
            movieId,
            content,
            parentId: parentId || null
        });

        await comment.save();

        // Notify parent comment owner if this is a reply
        if (parentId) {
            try {
                const parentComment = await Comment.findById(parentId); // Only reply to Comments for now? Or Reviews?
                // If parentId refers to a Review, Comment.findById might return null depending on if IDs collision or logic.
                // Assuming replies are only to Comments for this flow or parentId is valid for Comment model.
                // Ideally, if we allow replying to Reviews, we should check Review model if Comment not found,
                // BUT the schema for Comment usually stores parentId. If reviews are in Review model, we might need a unified way.
                // Current frontend passes parentId from comment._id.
                // If comment was a Review mapped to comment structure, its _id is passed.

                let receiverId = null;
                if (parentComment) {
                    receiverId = parentComment.userId;
                } else {
                    const parentReview = await Review.findById(parentId);
                    if (parentReview) {
                        receiverId = parentReview.userId;
                    }
                }

                if (receiverId && receiverId.toString() !== userId) {
                    const notification = new Notification({
                        userId: receiverId,
                        type: 'comment',
                        title: 'Phản hồi mới',
                        message: `${req.user.username || 'Một người dùng'} đã trả lời bình luận của bạn: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
                        link: `/watch/${movieId}`,
                        targetUsers: [userId]
                    });
                    await notification.save();
                    console.log(`Notification created for reply to user ${receiverId}`);
                }
            } catch (notifyError) {
                console.error('Notification creation failed:', notifyError);
                // Don't fail the request if notification fails
            }
        }

        // Populate user info for immediate display
        await comment.populate('userId', 'username profile');

        res.status(201).json({
            success: true,
            data: comment,
            message: 'Comment posted successfully'
        });
    } catch (error) {
        console.error('createComment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to post comment'
        });
    }
};

// Delete a comment
export const deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // Check permission: admin or owner
        if (req.user.role !== 'admin' && comment.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this comment'
            });
        }

        await comment.deleteOne();

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('deleteComment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete comment'
        });
    }
};

// Toggle Like
// Toggle Like
// Toggle Like
export const likeComment = async (req, res) => {
    try {
        let comment = await Comment.findById(req.params.id);
        let isReview = false;

        if (!comment) {
            comment = await Review.findById(req.params.id);
            isReview = true;
        }

        if (!comment) return res.status(404).json({ success: false, message: 'Comment or Review not found' });

        const userId = req.user.id;

        // Use proper string comparison for ObjectIds
        const isLiked = comment.likes.some(id => id.toString() === userId);
        const isDisliked = comment.dislikes ? comment.dislikes.some(id => id.toString() === userId) : false;

        if (isLiked) {
            // Unlike
            comment.likes = comment.likes.filter(id => id.toString() !== userId);
        } else {
            // Like
            comment.likes.push(userId);
            if (isDisliked) {
                comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId);
            }

            // Notification only for Comment (Review usually doesn't need detailed like notification or same logic applies)
            if (comment.userId.toString() !== userId) {
                try {
                    const notification = new Notification({
                        userId: comment.userId,
                        type: 'like',
                        title: 'Lượt thích mới',
                        message: `${req.user.username || 'Một người dùng'} đã thích ${isReview ? 'đánh giá' : 'bình luận'} của bạn: "${comment.content && comment.content.length > 0 ? comment.content.substring(0, 30) + '...' : (isReview ? 'đánh giá phim' : 'bình luận')}"`,
                        link: `/watch/${comment.movieId || comment.movie}`,
                        targetUsers: [userId]
                    });
                    await notification.save();
                } catch (notifyError) {
                    console.error('Notification creation failed:', notifyError);
                }
            }
        }

        await comment.save();
        res.json({ success: true, data: comment });
    } catch (error) {
        console.error('likeComment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Toggle Dislike
// Toggle Dislike
export const dislikeComment = async (req, res) => {
    try {
        let comment = await Comment.findById(req.params.id);
        if (!comment) {
            comment = await Review.findById(req.params.id);
        }

        if (!comment) return res.status(404).json({ success: false, message: 'Comment or Review not found' });

        const userId = req.user.id;

        // Use proper string comparison
        const isDisliked = comment.dislikes ? comment.dislikes.some(id => id.toString() === userId) : false;
        const isLiked = comment.likes.some(id => id.toString() === userId);

        if (isDisliked) {
            // Undislike
            comment.dislikes = comment.dislikes.filter(id => id.toString() !== userId);
        } else {
            // Dislike
            comment.dislikes.push(userId);
            if (isLiked) {
                comment.likes = comment.likes.filter(id => id.toString() !== userId);
            }
        }

        await comment.save();
        res.json({ success: true, data: comment });
    } catch (error) {
        console.error('dislikeComment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Report Comment
export const reportComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

        const { reason } = req.body;
        const userId = req.user.id;

        // Check if already reported
        const existingReport = comment.reports.find(r => r.userId.toString() === userId);
        if (existingReport) {
            return res.status(400).json({ success: false, message: 'You have already reported this comment' });
        }

        comment.reports.push({ userId, reason });
        await comment.save();

        res.json({ success: true, message: 'Report submitted successfully' });
    } catch (error) {
        console.error('reportComment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
// Update a comment
export const updateComment = async (req, res) => {
    try {
        const { content } = req.body;
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        if (comment.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this comment'
            });
        }

        comment.content = content;
        await comment.save();

        res.json({
            success: true,
            data: comment,
            message: 'Comment updated successfully'
        });
    } catch (error) {
        console.error('updateComment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update comment'
        });
    }
};
