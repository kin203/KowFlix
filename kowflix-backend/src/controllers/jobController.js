import Job from '../models/Job.js';
import Movie from '../models/Movie.js';
import * as jobQueue from '../services/jobQueue.js';

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

// Get encoding queue status
export const getQueueStatus = async (req, res) => {
    try {
        const queueStatus = await jobQueue.getQueueStatus();

        res.json({
            success: true,
            data: queueStatus
        });
    } catch (error) {
        console.error('getQueueStatus error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get queue status'
        });
    }
};

// Cancel a stuck job and process next in queue
export const cancelJob = async (req, res) => {
    try {
        const { id } = req.params;

        const job = await Job.findById(id);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }

        // Mark job as failed
        await Job.findByIdAndUpdate(id, {
            status: 'failed',
            error: 'Cancelled by admin',
            completedTime: new Date()
        });

        // Update movie status to error
        if (job.movieId) {
            await Movie.findByIdAndUpdate(job.movieId, {
                status: 'error'
            });
        }

        console.log(`❌ Job cancelled: ${job.movieTitle} (${id})`);

        // Trigger next job in queue
        await jobQueue.processQueue();

        res.json({
            success: true,
            message: 'Job cancelled and next job started'
        });
    } catch (error) {
        console.error('cancelJob error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel job'
        });
    }
};

// Cancel all jobs (encoding + pending)
export const cancelAllJobs = async (req, res) => {
    try {
        // Find all encoding and pending jobs
        const jobs = await Job.find({
            type: 'encode',
            status: { $in: ['encoding', 'pending'] }
        });

        if (jobs.length === 0) {
            return res.json({
                success: true,
                message: 'No jobs to cancel',
                cancelledCount: 0
            });
        }

        // Cancel all jobs
        const cancelledIds = [];
        for (const job of jobs) {
            await Job.findByIdAndUpdate(job._id, {
                status: 'failed',
                error: 'Cancelled by admin (bulk cancel)',
                completedTime: new Date()
            });

            // Update movie status
            if (job.movieId) {
                await Movie.findByIdAndUpdate(job.movieId, {
                    status: 'error'
                });
            }

            cancelledIds.push(job._id);
            console.log(`❌ Job cancelled: ${job.movieTitle} (${job._id})`);
        }

        res.json({
            success: true,
            message: `Cancelled ${jobs.length} job(s)`,
            cancelledCount: jobs.length,
            cancelledIds: cancelledIds
        });
    } catch (error) {
        console.error('cancelAllJobs error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel jobs'
        });
    }
};
