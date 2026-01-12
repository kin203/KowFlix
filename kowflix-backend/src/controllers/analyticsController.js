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
        // 1. Total User Stats & Growth
        const totalUsers = await User.countDocuments();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const lastMonthUsers = await User.countDocuments({ createdAt: { $lt: thirtyDaysAgo } });

        let userGrowth = 0;
        if (lastMonthUsers > 0) {
            userGrowth = ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100;
        } else if (totalUsers > 0) {
            userGrowth = 100; // If previously 0, growth is 100%
        }

        // 2. Total Movie Stats & Growth
        const totalMovies = await Movie.countDocuments();
        const lastMonthMovies = await Movie.countDocuments({ createdAt: { $lt: thirtyDaysAgo } });

        let movieGrowth = 0;
        if (lastMonthMovies > 0) {
            movieGrowth = ((totalMovies - lastMonthMovies) / lastMonthMovies) * 100;
        } else if (totalMovies > 0) {
            movieGrowth = 100;
        }
        const newMoviesCount = totalMovies - lastMonthMovies;

        // 3. Online/Active Users (Last 5 mins)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const onlineUsers = await User.countDocuments({
            lastActive: { $gte: fiveMinutesAgo }
        });
        // Note: We don't have historical data for online users for accurate "vs yesterday" comparison yet.

        // 4. Total Views & Weekly Growth
        const viewsResult = await Movie.aggregate([
            { $group: { _id: null, totalViews: { $sum: '$views' } } }
        ]);
        const totalViews = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;

        // Calculate view growth (This week vs Last week) based on DailyStat
        const today = new Date();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

        // Get total views for last 7 days (including today)
        const currentWeekStats = await DailyStat.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);
        const currentWeekViews = currentWeekStats.length > 0 ? currentWeekStats[0].total : 0;

        // Get total views for previous 7 days
        const lastWeekStats = await DailyStat.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: fourteenDaysAgo,
                        $lt: sevenDaysAgo
                    }
                }
            },
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);
        const lastWeekViews = lastWeekStats.length > 0 ? lastWeekStats[0].total : 0;

        let viewGrowth = 0;
        if (lastWeekViews > 0) {
            viewGrowth = ((currentWeekViews - lastWeekViews) / lastWeekViews) * 100;
        } else if (currentWeekViews > 0) {
            viewGrowth = 100;
        }

        // Get trending count (Updated in last 7 days)
        const trendingCount = await Movie.countDocuments({
            updatedAt: { $gte: sevenDaysAgo }
        });

        res.json({
            success: true,
            data: {
                totalUsers: {
                    value: totalUsers,
                    percent: parseFloat(userGrowth.toFixed(1)),
                    trend: userGrowth >= 0 ? 'up' : 'down',
                    label: 'so với tháng trước'
                },
                onlineUsers: {
                    value: onlineUsers,
                    percent: 0, // Not tracking history for this yet
                    trend: 'neutral',
                    label: 'so với hôm qua'
                },
                totalMovies: {
                    value: totalMovies,
                    percent: newMoviesCount, // Using count instead of percent for movies as per design preference or switch to percent
                    isCount: true, // Flag to frontend
                    trend: 'up',
                    label: 'phim mới'
                },
                totalViews: {
                    value: totalViews,
                    percent: parseFloat(viewGrowth.toFixed(1)),
                    trend: viewGrowth >= 0 ? 'up' : 'down',
                    label: 'tuần này'
                },
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
