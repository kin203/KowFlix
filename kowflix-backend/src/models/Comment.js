import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 1000,
        trim: true
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isReported: {
        type: Boolean,
        default: false
    },
    reportCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for faster queries
commentSchema.index({ movieId: 1, createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: 1 });

// Virtual for like count
commentSchema.virtual('likeCount').get(function () {
    return this.likes ? this.likes.length : 0;
});

// Virtual for dislike count
commentSchema.virtual('dislikeCount').get(function () {
    return this.dislikes ? this.dislikes.length : 0;
});

// Virtual for reply count
commentSchema.virtual('replyCount', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'parentId',
    count: true
});

// Ensure virtuals are included in JSON
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
