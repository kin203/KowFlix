import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['upload', 'encode'],
        required: true
    },
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    movieTitle: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'uploading', 'processing', 'encoding', 'completed', 'failed'],
        default: 'pending'
    },
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    fileSize: {
        type: String
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    completedTime: {
        type: Date
    },
    error: {
        type: String
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Index for efficient queries
JobSchema.index({ status: 1, createdAt: -1 });
JobSchema.index({ movieId: 1 });

export default mongoose.model('Job', JobSchema);
