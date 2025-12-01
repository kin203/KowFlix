import Comment from '../models/Comment.js';
import Movie from '../models/Movie.js';

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Private
export const createComment = async (req, res) => {
    try {
        const { movieId, content, isAnonymous, parentId } = req.body;
        const userId = req.user._id;

        // Validate movie exists
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        // If parentId provided, validate parent comment exists
        if (parentId) {
            const parentComment = await Comment.findById(parentId);
            if (!parentComment) {
                return res.status(404).json({ message: 'Parent comment not found' });
            }
        }

        const comment = await Comment.create({
            movieId,
            userId,
            content,
            isAnonymous: isAnonymous || false,
            parentId: parentId || null
        });

        // Populate user info
        await comment.populate('userId', 'username avatar');

        res.status(201).json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all comments for a movie
// @route   GET /api/comments/movie/:movieId
// @access  Public
export const getCommentsByMovie = async (req, res) => {
    try {
        const { movieId } = req.params;

        // Get top-level comments (no parent)
        const comments = await Comment.find({ movieId, parentId: null })
            .populate('userId', 'username avatar')
            .sort({ createdAt: -1 })
            .lean();

        // Get replies for each comment
        for (let comment of comments) {
            const replies = await Comment.find({ parentId: comment._id })
                .populate('userId', 'username avatar')
                .sort({ createdAt: 1 })
                .lean();
            comment.replies = replies;
        }

        res.status(200).json({
            success: true,
            count: comments.length,
            data: comments
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Like a comment
// @route   POST /api/comments/:id/like
// @access  Private
export const likeComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Remove from dislikes if present
        comment.dislikes = comment.dislikes.filter(
            uid => uid.toString() !== userId.toString()
        );

        // Toggle like
        const likeIndex = comment.likes.findIndex(
            uid => uid.toString() === userId.toString()
        );

        if (likeIndex > -1) {
            // Unlike
            comment.likes.splice(likeIndex, 1);
        } else {
            // Like
            comment.likes.push(userId);
        }

        await comment.save();

        res.status(200).json({
            success: true,
            data: {
                likeCount: comment.likes.length,
                dislikeCount: comment.dislikes.length
            }
        });
    } catch (error) {
        console.error('Error liking comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Dislike a comment
// @route   POST /api/comments/:id/dislike
// @access  Private
export const dislikeComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Remove from likes if present
        comment.likes = comment.likes.filter(
            uid => uid.toString() !== userId.toString()
        );

        // Toggle dislike
        const dislikeIndex = comment.dislikes.findIndex(
            uid => uid.toString() === userId.toString()
        );

        if (dislikeIndex > -1) {
            // Remove dislike
            comment.dislikes.splice(dislikeIndex, 1);
        } else {
            // Dislike
            comment.dislikes.push(userId);
        }

        await comment.save();

        res.status(200).json({
            success: true,
            data: {
                likeCount: comment.likes.length,
                dislikeCount: comment.dislikes.length
            }
        });
    } catch (error) {
        console.error('Error disliking comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private
export const updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user owns the comment
        if (comment.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this comment' });
        }

        comment.content = content;
        await comment.save();

        await comment.populate('userId', 'username avatar');

        res.status(200).json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user owns the comment or is admin
        if (comment.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        // Delete all replies to this comment
        await Comment.deleteMany({ parentId: id });

        // Delete the comment
        await Comment.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Report a comment
// @route   POST /api/comments/:id/report
// @access  Private
export const reportComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        comment.isReported = true;
        comment.reportCount += 1;
        await comment.save();

        // TODO: Send notification to admin or create a Report document

        res.status(200).json({
            success: true,
            message: 'Comment reported successfully'
        });
    } catch (error) {
        console.error('Error reporting comment:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
