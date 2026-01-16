// src/controllers/progressController.js
import WatchProgress from '../models/WatchProgress.js';
import Movie from '../models/Movie.js';

// Save or update watch progress
export const saveProgress = async (req, res) => {
    try {
        const { movieId } = req.params;
        const { currentTime, duration } = req.body;
        const userId = req.user.id;

        if (currentTime === undefined || currentTime === null || !duration) {
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

        // Calculate percentage
        const percentage = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

        // Update or create progress
        const progress = await WatchProgress.findOneAndUpdate(
            { userId, movieId },
            {
                currentTime,
                duration,
                percentage,
                lastWatched: new Date() // Force update timestamp to bubble to top
            },
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
        const userId = req.user.id;

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
        const userId = req.user.id;
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
        const userId = req.user.id;

        await WatchProgress.findOneAndDelete({ userId, movieId });

        res.json({ success: true, message: 'Progress deleted' });
    } catch (err) {
        console.error('deleteProgress error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get watch history (all movies watched, including completed)
export const getWatchHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50 } = req.query;

        const historyList = await WatchProgress.find({ userId })
            .populate('movieId', 'title slug poster backdrop duration status genres releaseYear imdbRating')
            .sort({ lastWatched: -1 })
            .limit(Number(limit));

        // Filter out movies that don't exist anymore
        const filtered = historyList.filter(p => p.movieId);

        // Add PUBLIC_MEDIA_URL to poster paths
        const PUBLIC_MEDIA_URL = process.env.PUBLIC_MEDIA_URL || (process.env.NODE_ENV === 'production' ? "https://nk203.id.vn/media" : "http://localhost:5000/media");

        const formattedHistory = filtered.map(progress => {
            const movie = progress.movieId.toObject();

            // Fix poster URL
            if (movie.poster && movie.poster.startsWith('/media/')) {
                movie.poster = `${PUBLIC_MEDIA_URL}${movie.poster.replace('/media', '')}`;
            }

            return {
                _id: progress._id,
                movie: movie,
                currentTime: progress.currentTime,
                duration: progress.duration,
                percentage: progress.percentage,
                lastWatched: progress.lastWatched
            };
        });

        res.json({ success: true, data: formattedHistory });
    } catch (err) {
        console.error('getWatchHistory error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
