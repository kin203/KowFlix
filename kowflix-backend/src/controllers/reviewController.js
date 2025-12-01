import Review from '../models/Review.js';
import Movie from '../models/Movie.js';

// Get all reviews (admin)
export const getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const skip = (page - 1) * limit;

        // Build query
        let query = {};
        if (search) {
            // Search by comment content
            query.comment = { $regex: search, $options: 'i' };
        }

        const reviews = await Review.find(query)
            .populate('userId', 'profile')
            .populate('movieId', 'title poster')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments(query);

        res.json({
            success: true,
            data: reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('getAllReviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews'
        });
    }
};

// Get reviews for a movie (public)
export const getMovieReviews = async (req, res) => {
    try {
        const { movieId } = req.params;
        const reviews = await Review.find({ movieId })
            .populate('userId', 'profile')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('getMovieReviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch movie reviews'
        });
    }
};

export const createReview = async (req, res) => {
    try {
        const { movieId, rating, comment } = req.body;
        const userId = req.user.id; // Changed from req.user.userId to req.user.id

        // Check if user already reviewed this movie
        const existingReview = await Review.findOne({ userId, movieId });
        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this movie'
            });
        }

        const review = new Review({
            userId,
            movieId,
            rating,
            comment
        });

        await review.save();

        // Update movie average rating (optional but recommended)
        // For now, we just save the review

        res.status(201).json({
            success: true,
            data: review,
            message: 'Review posted successfully'
        });
    } catch (error) {
        console.error('createReview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to post review'
        });
    }
};

// Delete review (admin or owner)
export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check permission: admin or owner
        if (req.user.role !== 'admin' && review.userId.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this review'
            });
        }

        await review.deleteOne();

        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('deleteReview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review'
        });
    }
};

// @desc    Like a review
// @route   POST /api/reviews/:id/like
// @access  Private
export const likeReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Remove from dislikes if present
        review.dislikes = review.dislikes.filter(
            uid => uid.toString() !== userId.toString()
        );

        // Toggle like
        const likeIndex = review.likes.findIndex(
            uid => uid.toString() === userId.toString()
        );

        if (likeIndex > -1) {
            // Unlike
            review.likes.splice(likeIndex, 1);
        } else {
            // Like
            review.likes.push(userId);
        }

        await review.save();

        res.status(200).json({
            success: true,
            data: {
                likeCount: review.likes.length,
                dislikeCount: review.dislikes.length
            }
        });
    } catch (error) {
        console.error('Error liking review:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Dislike a review
// @route   POST /api/reviews/:id/dislike
// @access  Private
export const dislikeReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // Remove from likes if present
        review.likes = review.likes.filter(
            uid => uid.toString() !== userId.toString()
        );

        // Toggle dislike
        const dislikeIndex = review.dislikes.findIndex(
            uid => uid.toString() === userId.toString()
        );

        if (dislikeIndex > -1) {
            // Remove dislike
            review.dislikes.splice(dislikeIndex, 1);
        } else {
            // Dislike
            review.dislikes.push(userId);
        }

        await review.save();

        res.status(200).json({
            success: true,
            data: {
                likeCount: review.likes.length,
                dislikeCount: review.dislikes.length
            }
        });
    } catch (error) {
        console.error('Error disliking review:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

