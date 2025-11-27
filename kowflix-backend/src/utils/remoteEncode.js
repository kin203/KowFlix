// src/utils/remoteEncode.js
import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const REMOTE_HOST = process.env.REMOTE_HOST || '192.168.100.52';
const REMOTE_USER = process.env.REMOTE_USER || 'kowflix';
const REMOTE_SSH_KEY = process.env.REMOTE_SSH_KEY_PATH || path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'kowflix_backend_key');
const INGEST_SCRIPT = '/home/kowflix/scripts/ingest.sh';

/**
 * Parse FFmpeg progress from output
 * @param {string} line - FFmpeg output line
 * @returns {number|null} Progress percentage (0-100) or null
 */
function parseFFmpegProgress(line) {
    // FFmpeg outputs progress like: "frame= 1234 fps=30 q=28.0 size=   12345kB time=00:01:23.45 bitrate=1234.5kbits/s speed=1.23x"
    const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    const durationMatch = line.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);

    if (timeMatch && global.videoDuration) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const seconds = parseFloat(timeMatch[3]);
        const currentTime = hours * 3600 + minutes * 60 + seconds;

        const progress = Math.min(Math.round((currentTime / global.videoDuration) * 100), 100);
        return progress;
    }

    if (durationMatch) {
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2]);
        const seconds = parseFloat(durationMatch[3]);
        global.videoDuration = hours * 3600 + minutes * 60 + seconds;
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
        global.videoDuration = null; // Reset duration

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
                        // Parse FFmpeg progress
                        const progress = parseFFmpegProgress(line);
                        if (progress !== null && progress > lastProgress) {
                            lastProgress = progress;
                            console.log(`📊 Encode progress: ${progress}%`);
                            if (onProgress) onProgress(progress);
                        }
                    }
                });

                stream.stderr.on('data', (data) => {
                    stderr += data.toString();
                    const lines = data.toString().split('\n');

                    for (const line of lines) {
                        // FFmpeg outputs to stderr, so also parse progress here
                        const progress = parseFFmpegProgress(line);
                        if (progress !== null && progress > lastProgress) {
                            lastProgress = progress;
                            console.log(`📊 Encode progress: ${progress}%`);
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
            privateKey: fs.readFileSync(REMOTE_SSH_KEY)
        });
    });
}
