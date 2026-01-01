// src/controllers/wishlistController.js
import User from '../models/User.js';
import Movie from '../models/Movie.js';

// Add movie to wishlist
export const addToWishlist = async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user.id;



        // Check if movie exists
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }

        // Get user - if doesn't exist, user might be deleted but token still valid
        let user = await User.findById(userId);



        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please log out and log in again.'
            });
        }

        // Check if already in wishlist
        if (user.wishlist && user.wishlist.includes(movieId)) {
            return res.status(400).json({ success: false, message: 'Already in wishlist' });
        }

        // Add to wishlist - MongoDB will create the array if it doesn't exist
        await User.findByIdAndUpdate(userId, {
            $addToSet: { wishlist: movieId }
        });

        res.json({ success: true, message: 'Added to wishlist' });
    } catch (err) {
        console.error('addToWishlist error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Remove movie from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user.id;

        await User.findByIdAndUpdate(userId, {
            $pull: { wishlist: movieId }
        });

        res.json({ success: true, message: 'Removed from wishlist' });
    } catch (err) {
        console.error('removeFromWishlist error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get user's wishlist
export const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId)
            .populate('wishlist', 'title slug poster backdrop genres releaseYear imdbRating status');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Filter out movies that don't exist anymore and add PUBLIC_MEDIA_URL
        const PUBLIC_MEDIA_URL = process.env.PUBLIC_MEDIA_URL || (process.env.NODE_ENV === 'production' ? "https://nk203.id.vn/media" : "http://localhost:5000/media");

        const formattedWishlist = user.wishlist
            .filter(movie => movie) // Remove null movies
            .map(movie => {
                const movieObj = movie.toObject();

                // Fix poster URL
                if (movieObj.poster && movieObj.poster.startsWith('/media/')) {
                    movieObj.poster = `${PUBLIC_MEDIA_URL}${movieObj.poster.replace('/media', '')}`;
                }

                return movieObj;
            });

        res.json({ success: true, data: formattedWishlist });
    } catch (err) {
        console.error('getWishlist error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Check if movie is in wishlist
export const checkInWishlist = async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user.id;

        const user = await User.findById(userId);

        // If user doesn't exist or has no wishlist, return false
        const inWishlist = user && user.wishlist && user.wishlist.includes(movieId);

        res.json({ success: true, data: { inWishlist: !!inWishlist } });
    } catch (err) {
        console.error('checkInWishlist error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
