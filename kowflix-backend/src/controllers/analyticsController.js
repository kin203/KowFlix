import Movie from '../models/Movie.js';
import User from '../models/User.js';
import DailyStat from '../models/DailyStat.js';

// Track movie view
export const trackView = async (req, res) => {
    try {
        const { movieId } = req.params;

        // 1. Increment total views for the movie
        await Movie.findByIdAndUpdate(movieId, { $inc: { views: 1 } });

        // 2. Increment daily stats
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        await DailyStat.findOneAndUpdate(
            { date: today },
            { $inc: { views: 1 } },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: 'View tracked' });
    } catch (error) {
        console.error('trackView error:', error);
        res.status(500).json({ success: false, message: 'Failed to track view' });
    }
};

// Get overall dashboard statistics
export const getDashboardStats = async (req, res) => {
    try {
        // Get total counts
        const totalUsers = await User.countDocuments();
        const totalMovies = await Movie.countDocuments();

        // Get online users (active in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const onlineUsers = await User.countDocuments({
            lastActive: { $gte: fiveMinutesAgo }
        });

        // Calculate total views (sum of all movie views)
        const viewsResult = await Movie.aggregate([
            { $group: { _id: null, totalViews: { $sum: '$views' } } }
        ]);
        const totalViews = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;

        // Get trending movies count (movies with views in last 7 days) - APPROXIMATION
        // ideally we track this in a separate collection, but for now using updatedAt or just Movie count
        // Let's use UpdatedAt as proxy or just return 0 if not tracked
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const trendingCount = await Movie.countDocuments({
            updatedAt: { $gte: sevenDaysAgo }
        });

        res.json({
            success: true,
            data: {
                totalUsers,
                onlineUsers,
                totalMovies,
                totalViews,
                trendingCount
            }
        });
    } catch (error) {
        console.error('getDashboardStats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard stats'
        });
    }
};

// Get weekly views data for chart
export const getWeeklyViews = async (req, res) => {
    try {
        // Get last 7 days
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }

        const stats = await DailyStat.find({
            date: { $in: dates }
        });

        // Map to format required by chart (day name + views)
        const weeklyData = dates.map(dateStr => {
            const stat = stats.find(s => s.date === dateStr);
            const dateObj = new Date(dateStr);
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return {
                day: days[dateObj.getDay()],
                views: stat ? stat.views : 0,
                fullDate: dateStr
            };
        });

        res.json({
            success: true,
            data: weeklyData
        });
    } catch (error) {
        console.error('getWeeklyViews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weekly views'
        });
    }
};

// Get top movies by views
export const getTopMovies = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;

        const topMovies = await Movie.find()
            .sort({ views: -1 })
            .limit(limit)
            .select('title views rating');

        res.json({
            success: true,
            data: topMovies
        });
    } catch (error) {
        console.error('getTopMovies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top movies'
        });
    }
};

// Get top rated movies by average rating from reviews
export const getTopRatedMovies = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const Review = (await import('../models/Review.js')).default;

        // Get all movies with at least one review
        const allReviews = await Review.aggregate([
            {
                $group: {
                    _id: '$movieId',
                    avgRating: { $avg: '$rating' },
                    reviewCount: { $sum: 1 }
                }
            },
            { $sort: { avgRating: -1 } },
            { $limit: limit }
        ]);

        // Get movie details for top rated movies
        const topRatedMovies = await Promise.all(
            allReviews.map(async (item) => {
                const movie = await Movie.findById(item._id).select('title views');
                return {
                    _id: item._id,
                    title: movie?.title || 'Unknown',
                    views: movie?.views || 0,
                    rating: item.avgRating.toFixed(1),
                    reviewCount: item.reviewCount
                };
            })
        );

        res.json({
            success: true,
            data: topRatedMovies
        });
    } catch (error) {
        console.error('getTopRatedMovies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top rated movies'
        });
    }
};

// Get most active users
export const getActiveUsers = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const activeUsers = await User.find()
            .sort({ lastActive: -1 })
            .limit(limit)
            .select('username email lastActive loginCount');

        res.json({
            success: true,
            data: activeUsers
        });
    } catch (error) {
        console.error('getActiveUsers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active users'
        });
    }
};

// Get user growth data
export const getUserGrowth = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const userGrowth = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: userGrowth
        });
    } catch (error) {
        console.error('getUserGrowth error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user growth data'
        });
    }
};
