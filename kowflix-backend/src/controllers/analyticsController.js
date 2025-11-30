import Movie from '../models/Movie.js';
import User from '../models/User.js';

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

        // Get trending movies count (movies with views in last 7 days)
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
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Mock data for now - in production, you'd track daily views
        const weeklyData = [
            { day: 'Mon', views: 420 },
            { day: 'Tue', views: 380 },
            { day: 'Wed', views: 510 },
            { day: 'Thu', views: 390 },
            { day: 'Fri', views: 620 },
            { day: 'Sat', views: 780 },
            { day: 'Sun', views: 650 }
        ];

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
