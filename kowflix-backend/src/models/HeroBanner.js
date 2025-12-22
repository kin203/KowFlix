import mongoose from 'mongoose';

const HeroBannerSchema = new mongoose.Schema({
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
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
HeroBannerSchema.index({ order: 1, createdAt: -1 });

export default mongoose.models.HeroBanner || mongoose.model('HeroBanner', HeroBannerSchema);
