import Comment from '../models/Comment.js';
import Review from '../models/Review.js'; // Import Review model

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

        // First pass: Prepare comments and map them
        comments.forEach(comment => {
            comment.likeCount = comment.likes ? comment.likes.length : 0;
            comment.dislikeCount = comment.dislikes ? comment.dislikes.length : 0;
            comment.replies = [];
            comment.isReview = false;
            commentMap[comment._id] = comment;
        });

        // Second pass: Link replies to parents
        comments.forEach(comment => {
            if (comment.parentId) {
                const parent = commentMap[comment.parentId];
                if (parent) {
                    parent.replies.push(comment);
                    // Sort replies oldest to newest
                    parent.replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                }
            } else {
                rootComments.push(comment);
            }
        });

        // Process reviews
        const formattedReviews = reviews.map(review => ({
            ...review,
            content: review.comment,
            isReview: true,
            rating: review.rating,
            likeCount: review.likes ? review.likes.length : 0,
            dislikeCount: review.dislikes ? review.dislikes.length : 0,
            replies: [] // Reviews don't have threaded replies in this legacy structure usually, or handled differently
        }));

        // Merge roots and reviews
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
export const likeComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

        const userId = req.user.id;

        // Check if already liked
        if (comment.likes.includes(userId)) {
            // Unlike
            comment.likes.pull(userId);
        } else {
            // Like (and remove dislike if exists)
            comment.likes.push(userId);
            comment.dislikes.pull(userId);
        }

        await comment.save();
        res.json({ success: true, data: comment });
    } catch (error) {
        console.error('likeComment error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Toggle Dislike
export const dislikeComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

        const userId = req.user.id;

        // Check if already disliked
        if (comment.dislikes.includes(userId)) {
            // Undislike
            comment.dislikes.pull(userId);
        } else {
            // Dislike (and remove like if exists)
            comment.dislikes.push(userId);
            comment.likes.pull(userId);
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
