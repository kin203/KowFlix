import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name_en: {
        type: String,
        default: '',
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    color: {
        type: String,
        required: true,
        default: '#FFD700'
    },
    link: {
        type: String,
        required: true,
        trim: true
    },
    icon: {
        type: String,
        default: '🎬'
    },
    backgroundImage: {
        type: String,
        default: ''
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

// Virtual for movie count
CategorySchema.virtual('movieCount', {
    ref: 'Movie',
    localField: '_id',
    foreignField: 'categories',
    count: true
});

// Ensure virtuals are included in JSON
CategorySchema.set('toJSON', { virtuals: true });
CategorySchema.set('toObject', { virtuals: true });

// Index for sorting and queries
CategorySchema.index({ order: 1, createdAt: 1 });
CategorySchema.index({ slug: 1 });
CategorySchema.index({ isActive: 1 });

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
