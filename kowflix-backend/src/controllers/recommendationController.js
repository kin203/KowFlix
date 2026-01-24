// src/controllers/recommendationController.js
import WatchProgress from '../models/WatchProgress.js';
import Movie from '../models/Movie.js';
import { generateMovieKeywords } from '../services/geminiService.js';
import { parseSearchQuery } from '../utils/searchParser.js';

export const getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get User's Watch History (Last 10 movies watched > 10% progress)
        const history = await WatchProgress.find({
            userId,
            percentage: { $gt: 10 } // Only consider movies watched significantly
        })
            .sort({ lastWatched: -1 })
            .limit(10)
            .populate('movieId', 'title');

        // Fallback: If no history, return trending
        if (!history || history.length < 3) {
            console.log("Not enough history for AI, returning trending.");
            // Reuse logic or redirect (simplified here by returning empty specialized list to let frontend handle, 
            // OR we can correct it to return trending directly if we want backend to handle fallback fully.)
            // Let's return a specific flag or just trending movies directly.

            const trending = await Movie.find().sort({ views: -1 }).limit(10);
            return res.json({
                success: true,
                data: trending,
                source: 'trending',
                message: "Watch more movies to get AI recommendations!"
            });
        }

        // Extract titles
        // Filter out null movieIds (deleted movies)
        const titles = history
            .filter(h => h.movieId)
            .map(h => h.movieId.title);

        console.log("Analyzing history:", titles);

        // 2. Call AI to get keywords
        const keywords = await generateMovieKeywords(titles);
        // keywords example: ["Hành động", "Mỹ", "Kịch tính"]

        if (keywords.length === 0) {
            // Fallback if AI fails or no key
            const trending = await Movie.find().sort({ views: -1 }).limit(10);
            return res.json({ success: true, data: trending, source: 'trending' });
        }

        // 3. Search Database using these keywords
        // We construct a query string from keywords and use our searchParser logic specifically?
        // Actually searchParser is good for raw text. Here we have structured keywords.
        // But `parseSearchQuery` is robust. Let's just join them.
        const fakeQuery = keywords.join(" "); // "Hành động Mỹ Kịch tính"
        const { genres, countries } = parseSearchQuery(fakeQuery);

        console.log("AI Filters Cleaned:", { genres, countries });

        const query = { _id: { $nin: history.map(h => h.movieId._id) } }; // Exclude watched
        const conditions = [];

        if (genres.length > 0) {
            conditions.push({ genres: { $in: genres } });
        }
        if (countries.length > 0) {
            conditions.push({ countries: { $in: countries } });
        }

        if (conditions.length > 0) {
            query.$or = conditions;
        }

        // IMPROVED QUERY LOGIC:
        // Use regex for partial matching if exact match fails, but since we updated parser, exact match should work.
        // Let's stick to the $or logic but log the query for debugging if empty.

        // 4. Fetch movies (randomized sort for freshness)
        // MongoDB sample is good for random but expensive on large datasets. 
        // For small dataset it is fine. Or just sort by rating/views.
        const recommendations = await Movie.find(query)
            .sort({ views: -1, imdbRating: -1 })
            .limit(12);

        // Map URL for frontend
        const PUBLIC_MEDIA_URL = process.env.PUBLIC_MEDIA_URL || (process.env.NODE_ENV === 'production' ? "https://nk203.id.vn/media" : "http://localhost:5000/media");
        const formattedRecs = recommendations.map(movie => {
            const movieObj = movie.toObject();
            if (movieObj.poster && movieObj.poster.startsWith('/media/')) {
                movieObj.poster = `${PUBLIC_MEDIA_URL}${movieObj.poster.replace('/media', '')}`;
            }
            if (movieObj.background && movieObj.background.startsWith('/media/')) {
                movieObj.background = `${PUBLIC_MEDIA_URL}${movieObj.background.replace('/media', '')}`;
            }
            return movieObj;
        });

        res.json({
            success: true,
            data: formattedRecs,
            source: 'ai',
            keywords: keywords
        });

    } catch (error) {
        console.error("Recommendation Error:", error);
        res.status(500).json({ success: false, message: "Recommendation failed" });
    }
};
