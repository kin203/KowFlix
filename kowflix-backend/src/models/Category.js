import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    color: {
        type: String,
        required: true,
        default: '#FFD700' // Yellow default
    },
    link: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        default: '🎬' // Default emoji icon
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for sorting
CategorySchema.index({ order: 1, createdAt: 1 });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
