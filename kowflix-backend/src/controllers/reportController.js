
import Report from "../models/Report.js";

// Create a new report
export const createReport = async (req, res) => {
    try {
        const { movieId, reason, description } = req.body;
        const userId = req.user.id || req.user._id;

        if (!movieId || !reason) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const report = await Report.create({
            userId,
            movieId,
            reason,
            description
        });

        res.status(201).json({ success: true, data: report });
    } catch (err) {
        console.error("Create report error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Get all reports (Admin only)
export const getAllReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate("userId", "username email")
            .populate("movieId", "title slug")
            .sort({ createdAt: -1 });

        res.json({ success: true, data: reports });
    } catch (err) {
        console.error("Get reports error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Update report status (Admin only)
export const updateReportStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!report) return res.status(404).json({ success: false, message: "Report not found" });

        res.json({ success: true, data: report });
    } catch (err) {
        console.error("Update report status error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
