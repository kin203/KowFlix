// src/services/jobQueue.js
import Job from '../models/Job.js';
import Movie from '../models/Movie.js';
import { triggerEncode } from '../utils/remoteEncode.js';

/**
 * Job Queue Service - Manages encoding jobs in FIFO order
 * Ensures only one encoding job runs at a time to prevent server overload
 */

let isProcessing = false; // Flag to prevent concurrent queue processing

/**
 * Check if any encoding job is currently running
 * @returns {Promise<boolean>}
 */
export async function isEncodingRunning() {
    const runningJob = await Job.findOne({
        type: 'encode',
        status: 'encoding'
    });
    return !!runningJob;
}

/**
 * Get queue status
 * @returns {Promise<object>} Queue status with running and pending jobs
 */
export async function getQueueStatus() {
    const runningJob = await Job.findOne({
        type: 'encode',
        status: 'encoding'
    }).populate('movieId', 'title');

    const pendingJobs = await Job.find({
        type: 'encode',
        status: 'pending'
    })
        .sort({ createdAt: 1 })
        .populate('movieId', 'title');

    return {
        running: runningJob ? {
            jobId: runningJob._id,
            movieTitle: runningJob.movieTitle,
            progress: runningJob.progress,
            startTime: runningJob.startTime
        } : null,
        pending: pendingJobs.map((job, index) => ({
            jobId: job._id,
            movieTitle: job.movieTitle,
            position: index + 1,
            createdAt: job.createdAt
        })),
        queueLength: pendingJobs.length
    };
}

/**
 * Start encoding for a specific job
 * @param {object} job - Job document
 * @returns {Promise<void>}
 */
async function startEncoding(job) {
    try {
        console.log(`🎬 Starting encoding job: ${job.movieTitle} (${job._id})`);

        // Status already set to 'encoding' by processQueue atomically
        // No need to update again here

        // Get movie and video path
        const movie = await Movie.findById(job.movieId);
        if (!movie) {
            throw new Error('Movie not found');
        }

        const videoPath = job.metadata?.videoPath;
        if (!videoPath) {
            throw new Error('Video path not found in job metadata');
        }

        const movieId = movie._id.toString();

        // Trigger encoding with progress callback
        await triggerEncode(videoPath, movieId, async (progress) => {
            try {
                await Job.findByIdAndUpdate(job._id, {
                    progress: progress,
                    status: progress >= 100 ? 'completed' : 'encoding'
                });
                console.log(`📊 Encode progress for ${movie.title}: ${progress}%`);
            } catch (err) {
                console.error('Failed to update job progress:', err);
            }
        });

        // Encoding completed successfully
        console.log(`✅ Auto-encode completed for: ${movie.title} (${movieId})`);

        await Job.findByIdAndUpdate(job._id, {
            status: 'completed',
            progress: 100,
            completedTime: new Date()
        });

        // Update movie with HLS paths
        const hlsBasePath = `/hls/${movieId}`;
        await Movie.findByIdAndUpdate(movieId, {
            status: 'ready',
            hlsFolder: `/hls/${movieId}`,
            contentFiles: [
                ...movie.contentFiles.filter(f => f.type !== 'hls'),
                { type: 'hls', path: `${hlsBasePath}/master.m3u8`, quality: 'master' },
                { type: 'hls', path: `${hlsBasePath}/1080p/index.m3u8`, quality: '1080p' },
                { type: 'hls', path: `${hlsBasePath}/720p/index.m3u8`, quality: '720p' },
                { type: 'hls', path: `${hlsBasePath}/480p/index.m3u8`, quality: '480p' }
            ]
        });

        console.log(`✅ Movie ready: ${movie.title} (${movieId})`);

    } catch (err) {
        console.error(`❌ Auto-encode failed for ${job.movieTitle} (${job._id}):`, err);

        await Job.findByIdAndUpdate(job._id, {
            status: 'failed',
            error: err.message,
            completedTime: new Date()
        });

        await Movie.findByIdAndUpdate(job.movieId, { status: 'error' });
    }
}

/**
 * Process the job queue - start all pending jobs (allow concurrent encoding)
 * @returns {Promise<void>}
 */
export async function processQueue() {
    // Prevent concurrent queue processing
    if (isProcessing) {
        console.log('⏸️  Queue already being processed, skipping...');
        return;
    }

    isProcessing = true;

    try {
        // Get ALL pending jobs (not just one)
        const pendingJobs = await Job.find({
            type: 'encode',
            status: 'pending'
        }).sort({ createdAt: 1 });

        if (pendingJobs.length === 0) {
            console.log('✅ No pending encoding jobs in queue');
            return;
        }

        console.log(`🚀 Starting ${pendingJobs.length} pending encoding job(s)`);

        // Start all pending jobs concurrently
        const encodingPromises = pendingJobs.map(job => {
            // Update to encoding status first
            return Job.findByIdAndUpdate(job._id, {
                status: 'encoding',
                progress: 0,
                startTime: new Date()
            }).then(() => {
                console.log(`🎬 Starting encoding: ${job.movieTitle}`);
                // Start encoding in background (don't await)
                startEncoding(job).catch(err => {
                    console.error(`Encoding error for ${job.movieTitle}:`, err);
                });
            });
        });

        // Wait for all jobs to be marked as 'encoding'
        await Promise.all(encodingPromises);

    } catch (err) {
        console.error('❌ Error processing queue:', err);
    } finally {
        isProcessing = false;
    }
}

/**
 * Add a job to the queue and trigger processing
 * @param {string} jobId - Job ID to add to queue
 * @returns {Promise<void>}
 */
export async function addJob(jobId) {
    const job = await Job.findById(jobId);
    if (!job) {
        throw new Error('Job not found');
    }

    console.log(`➕ Added job to queue: ${job.movieTitle} (${jobId})`);

    // Trigger queue processing immediately (await to prevent race condition)
    try {
        await processQueue();
    } catch (err) {
        console.error('Error processing queue:', err);
    }
}
