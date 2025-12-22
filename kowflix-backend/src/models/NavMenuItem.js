import mongoose from 'mongoose';

const navMenuItemSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
        trim: true
    },
    path: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        default: null,
        trim: true
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'NavMenuItem',
        default: null
    },
    requiresAuth: {
        type: Boolean,
        default: false
    },
    requiresAdmin: {
        type: Boolean,
        default: false
    },
    isExternal: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for faster queries
navMenuItemSchema.index({ order: 1 });
navMenuItemSchema.index({ parentId: 1 });
navMenuItemSchema.index({ isActive: 1 });

const NavMenuItem = mongoose.model('NavMenuItem', navMenuItemSchema);

export default NavMenuItem;
