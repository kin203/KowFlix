import HeroBanner from '../models/HeroBanner.js';
import Movie from '../models/Movie.js';

// Get all hero banners (public)
export const getHeroBanners = async (req, res) => {
    try {
        const query = req.query.active === 'true' ? { isActive: true } : {};

        const banners = await HeroBanner.find(query)
            .populate('movieId') // Populate all fields
            .sort({ order: 1, createdAt: -1 });

        res.json({
            success: true,
            data: banners
        });
    } catch (error) {
        console.error('getHeroBanners error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hero banners'
        });
    }
};

// Create hero banner
export const createHeroBanner = async (req, res) => {
    try {
        const { movieId, title, description, imageUrl, order, isActive } = req.body;

        // Verify movie exists
        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        const banner = new HeroBanner({
            movieId,
            title: title || movie.title, // Default to movie title if not provided
            description: description || movie.description, // Default to movie desc
            imageUrl: imageUrl || movie.poster, // Default to movie poster
            order,
            isActive
        });

        await banner.save();

        res.status(201).json({
            success: true,
            data: banner,
            message: 'Hero banner created successfully'
        });
    } catch (error) {
        console.error('createHeroBanner error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create hero banner'
        });
    }
};

// Update hero banner
export const updateHeroBanner = async (req, res) => {
    try {
        const { title, description, imageUrl, order, isActive } = req.body;

        const banner = await HeroBanner.findByIdAndUpdate(
            req.params.id,
            { title, description, imageUrl, order, isActive },
            { new: true, runValidators: true }
        );

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Hero banner not found'
            });
        }

        res.json({
            success: true,
            data: banner,
            message: 'Hero banner updated successfully'
        });
    } catch (error) {
        console.error('updateHeroBanner error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update hero banner'
        });
    }
};

// Delete hero banner
export const deleteHeroBanner = async (req, res) => {
    try {
        const banner = await HeroBanner.findByIdAndDelete(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Hero banner not found'
            });
        }

        res.json({
            success: true,
            message: 'Hero banner deleted successfully'
        });
    } catch (error) {
        console.error('deleteHeroBanner error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete hero banner'
        });
    }
};

// Reorder banners
export const reorderHeroBanners = async (req, res) => {
    try {
        const { banners } = req.body; // Array of { id, order }

        const updatePromises = banners.map(({ id, order }) =>
            HeroBanner.findByIdAndUpdate(id, { order })
        );

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: 'Hero banners reordered successfully'
        });
    } catch (error) {
        console.error('reorderHeroBanners error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reorder hero banners'
        });
    }
};
