// src/controllers/progressController.js
import WatchProgress from '../models/WatchProgress.js';
import Movie from '../models/Movie.js';

// Save or update watch progress
export const saveProgress = async (req, res) => {
    try {
        const { movieId } = req.params;
        const { currentTime, duration } = req.body;
        const userId = req.user._id;

        if (!currentTime || !duration) {
            return res.status(400).json({
                success: false,
                message: 'currentTime and duration are required'
            });
        }

        // Check if movie exists
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }

        // Update or create progress
        const progress = await WatchProgress.findOneAndUpdate(
            { userId, movieId },
            { currentTime, duration },
            { upsert: true, new: true }
        );

        res.json({ success: true, data: progress });
    } catch (err) {
        console.error('saveProgress error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get progress for a specific movie
export const getProgress = async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user._id;

        const progress = await WatchProgress.findOne({ userId, movieId });

        if (!progress) {
            return res.json({ success: true, data: null });
        }

        res.json({ success: true, data: progress });
    } catch (err) {
        console.error('getProgress error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get all user's watch progress (for Continue Watching)
export const getAllProgress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 10 } = req.query;

        const progressList = await WatchProgress.find({ userId })
            .populate('movieId', 'title slug poster duration status')
            .sort({ lastWatched: -1 })
            .limit(Number(limit));

        // Filter out completed movies (>90% watched) and movies that don't exist
        const filtered = progressList.filter(p =>
            p.movieId && p.percentage < 90
        );

        res.json({ success: true, data: filtered });
    } catch (err) {
        console.error('getAllProgress error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete progress (mark as completed or remove)
export const deleteProgress = async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user._id;

        await WatchProgress.findOneAndDelete({ userId, movieId });

        res.json({ success: true, message: 'Progress deleted' });
    } catch (err) {
        console.error('deleteProgress error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
