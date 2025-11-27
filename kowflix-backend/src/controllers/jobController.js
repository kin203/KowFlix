import Job from '../models/Job.js';
import Movie from '../models/Movie.js';

// Get all jobs
export const getAllJobs = async (req, res) => {
    try {
        const { status, type, limit = 50 } = req.query;
        const query = {};

        if (status) query.status = status;
        if (type) query.type = type;

        const jobs = await Job.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        res.json({
            success: true,
            data: jobs
        });
    } catch (error) {
        console.error('getAllJobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobs'
        });
    }
};

// Get job by ID
export const getJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        res.json({
            success: true,
            data: job
        });
    } catch (error) {
        console.error('getJob error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch job'
        });
    }
};

// Create job
export const createJob = async (req, res) => {
    try {
        const { type, movieId, movieTitle, fileSize } = req.body;

        const job = await Job.create({
            type,
            movieId,
            movieTitle,
            fileSize,
            status: type === 'upload' ? 'uploading' : 'pending'
        });

        res.status(201).json({
            success: true,
            data: job
        });
    } catch (error) {
        console.error('createJob error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create job'
        });
    }
};

// Update job progress
export const updateJobProgress = async (req, res) => {
    try {
        const { progress, status, error, metadata } = req.body;
        const updateData = {};

        if (progress !== undefined) updateData.progress = progress;
        if (status) updateData.status = status;
        if (error) updateData.error = error;
        if (metadata) updateData.metadata = metadata;

        // Set completedTime if status is completed or failed
        if (status === 'completed' || status === 'failed') {
            updateData.completedTime = new Date();
        }

        const job = await Job.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        res.json({
            success: true,
            data: job
        });
    } catch (error) {
        console.error('updateJobProgress error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update job'
        });
    }
};

// Delete job
export const deleteJob = async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        res.json({
            success: true,
            message: 'Job deleted successfully'
        });
    } catch (error) {
        console.error('deleteJob error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete job'
        });
    }
};

// Clean up old completed jobs (older than 24 hours)
export const cleanupOldJobs = async (req, res) => {
    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const result = await Job.deleteMany({
            status: { $in: ['completed', 'failed'] },
            completedTime: { $lt: oneDayAgo }
        });

        res.json({
            success: true,
            message: `Cleaned up ${result.deletedCount} old jobs`
        });
    } catch (error) {
        console.error('cleanupOldJobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup jobs'
        });
    }
};
