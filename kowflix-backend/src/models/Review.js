import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxLength: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent multiple reviews from same user for same movie
ReviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
