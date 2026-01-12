
import mongoose from "mongoose";

const ReportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    movieId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Movie",
        required: true
    },
    reason: {
        type: String,
        enum: [
            "Video không chạy",
            "Sai nội dung/tên phim",
            "Phụ đề lỗi/không khớp",
            "Âm thanh lỗi",
            "Khác"
        ],
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["pending", "reviewed", "resolved", "rejected"],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Report || mongoose.model("Report", ReportSchema);
