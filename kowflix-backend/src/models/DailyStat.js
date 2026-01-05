import mongoose from 'mongoose';

const DailyStatSchema = new mongoose.Schema({
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true,
        unique: true,
        index: true
    },
    views: {
        type: Number,
        default: 0
    },
    // Can include other metrics here later (e.g., loginCount, newUsers)
    activeUsers: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.models.DailyStat || mongoose.model('DailyStat', DailyStatSchema);
