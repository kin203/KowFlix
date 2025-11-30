import NavMenuItem from '../models/NavMenuItem.js';

// Get all active menu items (public - for navbar display)
export const getAllMenuItems = async (req, res) => {
    try {
        const menuItems = await NavMenuItem.find({ isActive: true })
            .sort({ order: 1 })
            .lean();

        // Build hierarchical structure
        const mainItems = menuItems.filter(item => !item.parentId);
        const result = mainItems.map(item => ({
            ...item,
            subItems: menuItems.filter(sub => sub.parentId && sub.parentId.toString() === item._id.toString())
        }));

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Get menu items error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch menu items'
        });
    }
};

// Get all menu items (admin)
export const getMenuItemsAdmin = async (req, res) => {
    try {
        const menuItems = await NavMenuItem.find()
            .sort({ order: 1 })
            .lean();

        // Build hierarchical structure
        const mainItems = menuItems.filter(item => !item.parentId);
        const result = mainItems.map(item => ({
            ...item,
            subItems: menuItems.filter(sub => sub.parentId && sub.parentId.toString() === item._id.toString())
        }));

        res.json({
            success: true,
            data: result,
            flatData: menuItems // Also send flat data for easier management
        });
    } catch (error) {
        console.error('Get menu items admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch menu items'
        });
    }
};

// Create menu item
export const createMenuItem = async (req, res) => {
    try {
        const menuItem = new NavMenuItem(req.body);
        await menuItem.save();

        res.status(201).json({
            success: true,
            message: 'Menu item created successfully',
            data: menuItem
        });
    } catch (error) {
        console.error('Create menu item error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create menu item'
        });
    }
};

// Update menu item
export const updateMenuItem = async (req, res) => {
    try {
        const menuItem = await NavMenuItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        res.json({
            success: true,
            message: 'Menu item updated successfully',
            data: menuItem
        });
    } catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update menu item'
        });
    }
};

// Delete menu item
export const deleteMenuItem = async (req, res) => {
    try {
        const menuItem = await NavMenuItem.findById(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        // Delete all child items if this is a parent
        await NavMenuItem.deleteMany({ parentId: req.params.id });

        // Delete the item itself
        await NavMenuItem.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Menu item deleted successfully'
        });
    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete menu item'
        });
    }
};

// Reorder menu items
export const reorderMenuItems = async (req, res) => {
    try {
        const { items } = req.body; // Array of { id, order }

        const updatePromises = items.map(item =>
            NavMenuItem.findByIdAndUpdate(item.id, { order: item.order })
        );

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: 'Menu items reordered successfully'
        });
    } catch (error) {
        console.error('Reorder menu items error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reorder menu items'
        });
    }
};
