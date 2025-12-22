// src/utils/remoteEncode.js
import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const REMOTE_HOST = process.env.REMOTE_HOST || '192.168.100.52';
const REMOTE_USER = process.env.REMOTE_USER || 'kowflix';
const INGEST_SCRIPT = '/home/kowflix/scripts/ingest.sh';

/**
 * Get SSH private key from environment variable or file path
 * Priority: REMOTE_SSH_KEY (direct key) > REMOTE_SSH_KEY_PATH (file path)
 */
const getSSHKey = () => {
    // Priority 1: Direct key from env (Render deployment)
    if (process.env.REMOTE_SSH_KEY) {
        console.log('🔑 Using SSH key from REMOTE_SSH_KEY environment variable');
        return process.env.REMOTE_SSH_KEY;
    }

    // Priority 2: Key file path (local development)
    if (process.env.REMOTE_SSH_KEY_PATH) {
        console.log(`🔑 Reading SSH key from file: ${process.env.REMOTE_SSH_KEY_PATH}`);
        return fs.readFileSync(process.env.REMOTE_SSH_KEY_PATH, 'utf8');
    }

    throw new Error('SSH key not configured. Set REMOTE_SSH_KEY or REMOTE_SSH_KEY_PATH environment variable.');
};

/**
 * Parse FFmpeg progress from output with multi-resolution tracking
 * @param {string} line - FFmpeg output line
 * @param {object} state - Encoding state (currentResolution, videoDuration)
 * @returns {number|null} Progress percentage (0-100) or null
 */
function parseFFmpegProgress(line, state) {
    // Detect which resolution is being encoded based on FFmpeg command patterns
    if (line.includes('1080p/index.m3u8') || line.includes('scale=-2:1080') || line.includes('1080p.m3u8')) {
        if (state.currentResolution !== '1080p') {
            state.currentResolution = '1080p';
            state.encodingPass = 1;
            console.log('🎬 Encoding 1080p...');
        }
    } else if (line.includes('720p/index.m3u8') || line.includes('scale=-2:720') || line.includes('720p.m3u8')) {
        if (state.currentResolution !== '720p') {
            state.currentResolution = '720p';
            state.encodingPass = 2;
            console.log('🎬 Encoding 720p...');
        }
    } else if (line.includes('480p/index.m3u8') || line.includes('scale=-2:480') || line.includes('480p.m3u8')) {
        if (state.currentResolution !== '480p') {
            state.currentResolution = '480p';
            state.encodingPass = 3;
            console.log('🎬 Encoding 480p...');
        }
    }

    // FFmpeg outputs progress like: "frame= 1234 fps=30 q=28.0 size=   12345kB time=00:01:23.45 bitrate=1234.5kbits/s speed=1.23x"
    const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2}\.?\d*)/);
    const durationMatch = line.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.?\d*)/);

    if (durationMatch) {
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2]);
        const seconds = parseFloat(durationMatch[3]);
        state.videoDuration = hours * 3600 + minutes * 60 + seconds;
    }

    if (timeMatch && state.videoDuration) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseFloat(timeMatch[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;

        // Calculate progress for current resolution (0-100)
        const resolutionProgress = Math.min(Math.round((currentTime / state.videoDuration) * 100), 100);

        // Auto-detect resolution based on encoding pass if not detected by pattern
        if (!state.encodingPass) {
            // If we haven't detected resolution yet, assume sequential encoding
            // First 33% of total progress = 1080p, next 33% = 720p, last 33% = 480p
            if (!state.totalProgressSoFar) state.totalProgressSoFar = 0;

            if (state.totalProgressSoFar < 33) {
                state.currentResolution = '1080p';
                state.encodingPass = 1;
            } else if (state.totalProgressSoFar < 66) {
                state.currentResolution = '720p';
                state.encodingPass = 2;
            } else {
                state.currentResolution = '480p';
                state.encodingPass = 3;
            }
        }

        // Calculate overall progress based on which resolution is being encoded
        // 1080p: 0-33%, 720p: 33-66%, 480p: 66-100%
        let overallProgress = 0;
        if (state.currentResolution === '1080p' || state.encodingPass === 1) {
            overallProgress = Math.round(resolutionProgress / 3); // 0-33%
        } else if (state.currentResolution === '720p' || state.encodingPass === 2) {
            overallProgress = 33 + Math.round(resolutionProgress / 3); // 33-66%
        } else if (state.currentResolution === '480p' || state.encodingPass === 3) {
            overallProgress = 66 + Math.round(resolutionProgress / 3); // 66-100%
        }

        state.totalProgressSoFar = overallProgress;
        return Math.min(overallProgress, 100);
    }

    return null;
}

/**
 * Trigger encode on remote server with progress tracking
 * @param {string} videoPath - Remote video path (e.g., /media/DATA/kowflix/uploads/xxx.mp4)
 * @param {string} slug - Movie slug for HLS output folder
 * @param {function} onProgress - Optional callback for progress updates (progress: number)
 * @returns {Promise<void>}
 */
export async function triggerEncode(videoPath, slug, onProgress = null) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const state = {
            videoDuration: null,
            currentResolution: '1080p' // Start with 1080p
        };

        conn.on('ready', () => {
            console.log(`🔧 Triggering encode for: ${slug}`);

            const command = `sudo -u kowflix ${INGEST_SCRIPT} ${videoPath} ${slug}`;

            conn.exec(command, (err, stream) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }

                let stdout = '';
                let stderr = '';
                let lastProgress = 0;

                stream.on('close', (code, signal) => {
                    conn.end();

                    if (code === 0) {
                        console.log(`✅ Encode completed successfully for: ${slug}`);
                        if (onProgress) onProgress(100);
                        resolve();
                    } else {
                        console.error(`❌ Encode failed with code ${code}`);
                        console.error('STDERR:', stderr);
                        reject(new Error(`Encode failed with code ${code}: ${stderr}`));
                    }
                });

                stream.on('data', (data) => {
                    stdout += data.toString();
                    const lines = data.toString().split('\n');

                    for (const line of lines) {
                        // Parse FFmpeg progress with multi-resolution tracking
                        const progress = parseFFmpegProgress(line, state);
                        if (progress !== null && progress > lastProgress) {
                            lastProgress = progress;
                            const resLabel = state.currentResolution || 'unknown';
                            console.log(`📊 Encode progress (${resLabel}): ${progress}%`);
                            if (onProgress) onProgress(progress);
                        }
                    }
                });

                stream.stderr.on('data', (data) => {
                    stderr += data.toString();
                    const lines = data.toString().split('\n');

                    for (const line of lines) {
                        // Debug: log all stderr lines to see FFmpeg output
                        if (line.trim()) {
                            console.log('[FFmpeg]', line.trim());
                        }

                        // FFmpeg outputs progress info to stderr
                        const progress = parseFFmpegProgress(line, state);
                        if (progress !== null && progress > lastProgress) {
                            lastProgress = progress;
                            const resLabel = state.currentResolution || 'unknown';
                            console.log(`📊 Encode progress (${resLabel}): ${progress}%`);
                            if (onProgress) onProgress(progress);
                        }
                    }
                });
            });
        });

        conn.on('error', (err) => {
            console.error('❌ SSH connection error:', err);
            reject(err);
        });

        conn.connect({
            host: REMOTE_HOST,
            port: 22,
            username: REMOTE_USER,
            privateKey: getSSHKey()
        });
    });
};
