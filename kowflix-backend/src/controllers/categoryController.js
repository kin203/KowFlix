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
        const { name, color, link, icon, order, isActive } = req.body;

        // Check if category name already exists
        const existing = await Category.findOne({ name });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Category name already exists'
            });
        }

        const category = new Category({
            name,
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
        const { name, color, link, icon, order, isActive } = req.body;

        // Check if new name conflicts with existing category
        if (name) {
            const existing = await Category.findOne({
                name,
                _id: { $ne: req.params.id }
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name already exists'
                });
            }
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, color, link, icon, order, isActive },
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
