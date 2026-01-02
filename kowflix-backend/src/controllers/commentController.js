import Comment from '../models/Comment.js';
import Review from '../models/Review.js'; // Import Review model

// Get comments for a movie (including legacy reviews)
export const getMovieComments = async (req, res) => {
    try {
        const { movieId } = req.params;

        // Fetch new comments
        const commentsPromise = Comment.find({ movieId })
            .populate('userId', 'username email profile')
            .lean();

        // Fetch legacy reviews
        const reviewsPromise = Review.find({ movieId })
            .populate('userId', 'username email profile')
            .lean();

        const [comments, reviews] = await Promise.all([commentsPromise, reviewsPromise]);

        // Format reviews to look like comments
        const formattedReviews = reviews.map(review => ({
            ...review,
            content: review.comment, // Map comment field
            isReview: true, // Flag to identify origin
            rating: review.rating // Keep rating info
        }));

        // Merge and sort by date (newest first)
        const allComments = [...comments, ...formattedReviews].sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.json({
            success: true,
            data: allComments
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
        const { movieId, content } = req.body;
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
            content
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
