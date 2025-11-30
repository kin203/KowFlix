// src/middleware/streamLimiter.js
// Limit concurrent streams per user/IP

const activeStreams = new Map(); // Map<userId|IP, Set<streamId>>
const MAX_CONCURRENT_STREAMS = 4; // Maximum 4 streams per user

export const streamLimiter = (req, res, next) => {
    const userId = req.user?.id || req.ip; // Use user ID if authenticated, else IP
    const streamId = `${req.params.id}-${Date.now()}`;

    // Get or create user's stream set
    if (!activeStreams.has(userId)) {
        activeStreams.set(userId, new Set());
    }

    const userStreams = activeStreams.get(userId);

    // Check if user has reached limit
    if (userStreams.size >= MAX_CONCURRENT_STREAMS) {
        console.log(`⚠️ Stream limit reached for ${userId} (${userStreams.size}/${MAX_CONCURRENT_STREAMS})`);
        return res.status(429).json({
            success: false,
            message: `Maximum ${MAX_CONCURRENT_STREAMS} concurrent streams allowed`
        });
    }

    // Add stream to active set
    userStreams.add(streamId);
    console.log(`▶️ Stream started: ${streamId} for ${userId} (${userStreams.size}/${MAX_CONCURRENT_STREAMS})`);

    // Store streamId in request for cleanup
    req.streamId = streamId;
    req.userId = userId;

    // Cleanup on response finish
    res.on('finish', () => {
        cleanupStream(userId, streamId);
    });

    res.on('close', () => {
        cleanupStream(userId, streamId);
    });

    res.on('error', () => {
        cleanupStream(userId, streamId);
    });

    next();
};

function cleanupStream(userId, streamId) {
    const userStreams = activeStreams.get(userId);
    if (userStreams) {
        userStreams.delete(streamId);
        console.log(`⏹️ Stream stopped: ${streamId} for ${userId} (${userStreams.size}/${MAX_CONCURRENT_STREAMS})`);

        // Remove user entry if no active streams
        if (userStreams.size === 0) {
            activeStreams.delete(userId);
        }
    }
}

// Get current stream stats
export const getStreamStats = () => {
    const stats = {
        totalUsers: activeStreams.size,
        totalStreams: 0,
        users: []
    };

    activeStreams.forEach((streams, userId) => {
        stats.totalStreams += streams.size;
        stats.users.push({
            userId,
            streamCount: streams.size,
            streams: Array.from(streams)
        });
    });

    return stats;
};

// Admin endpoint to view stream stats
export const streamStatsHandler = (req, res) => {
    const stats = getStreamStats();
    res.json({
        success: true,
        data: stats
    });
};
