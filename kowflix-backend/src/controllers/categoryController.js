import Category from '../models/Category.js';

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find()
            .sort({ order: 1, createdAt: 1 });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('getAllCategories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
};

// Get active categories only (for public display)
export const getActiveCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true })
            .sort({ order: 1, createdAt: 1 });

        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('getActiveCategories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active categories'
        });
    }
};

// Get single category
export const getCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('getCategory error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category'
        });
    }
};

// Create category
export const createCategory = async (req, res) => {
    try {
        const { name, slug, description, color, link, icon, order, isActive } = req.body;

        // Check if category name or slug already exists
        const existing = await Category.findOne({
            $or: [{ name }, { slug }]
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Category name or slug already exists'
            });
        }

        const category = new Category({
            name,
            slug,
            description,
            color,
            link,
            icon,
            order,
            isActive
        });

        await category.save();

        res.status(201).json({
            success: true,
            data: category,
            message: 'Category created successfully'
        });
    } catch (error) {
        console.error('createCategory error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create category'
        });
    }
};

// Update category
export const updateCategory = async (req, res) => {
    try {
        const { name, slug, description, color, link, icon, order, isActive } = req.body;

        // Check if new name or slug conflicts with existing category
        if (name || slug) {
            const existing = await Category.findOne({
                _id: { $ne: req.params.id },
                $or: [
                    ...(name ? [{ name }] : []),
                    ...(slug ? [{ slug }] : [])
                ]
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name or slug already exists'
                });
            }
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, slug, description, color, link, icon, order, isActive },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            data: category,
            message: 'Category updated successfully'
        });
    } catch (error) {
        console.error('updateCategory error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update category'
        });
    }
};

// Delete category
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('deleteCategory error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete category'
        });
    }
};

// Reorder categories
export const reorderCategories = async (req, res) => {
    try {
        const { categories } = req.body; // Array of { id, order }

        const updatePromises = categories.map(({ id, order }) =>
            Category.findByIdAndUpdate(id, { order })
        );

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: 'Categories reordered successfully'
        });
    } catch (error) {
        console.error('reorderCategories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reorder categories'
        });
    }
};

// Get movies by category slug
export const getCategoryMovies = async (req, res) => {
    try {
        const { slug } = req.params;
        const category = await Category.findOne({ slug, isActive: true });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // Import Movie model dynamically to avoid circular dependency
        const Movie = (await import('../models/Movie.js')).default;

        const movies = await Movie.find({
            categories: category._id,
            status: 'ready'
        })
            .select('title poster backdrop releaseYear genres imdbRating')
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            data: {
                category,
                movies
            }
        });
    } catch (error) {
        console.error('getCategoryMovies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category movies'
        });
    }
};
