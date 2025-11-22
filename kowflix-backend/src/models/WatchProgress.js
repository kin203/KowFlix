// src/models/WatchProgress.js
import mongoose from 'mongoose';

const WatchProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true,
        index: true
    },
    currentTime: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    duration: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lastWatched: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for fast user+movie lookups
WatchProgressSchema.index({ userId: 1, movieId: 1 }, { unique: true });

// Auto-calculate percentage before save
WatchProgressSchema.pre('save', function (next) {
    if (this.duration > 0) {
        this.percentage = Math.min(100, (this.currentTime / this.duration) * 100);
    }
    this.lastWatched = new Date();
    next();
});

export default mongoose.model('WatchProgress', WatchProgressSchema);
