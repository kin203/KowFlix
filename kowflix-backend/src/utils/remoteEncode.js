import axios from 'axios';
import { Client } from 'ssh2';
import fs from 'fs';
import config from '../config/config.js';

const AGENT_URL = config.remote.agentUrl;
const SFTP_CONFIG = config.remote.sftp;

/**
 * Configure SSH Client
 */
function getSshConfig() {
    let privateKey = SFTP_CONFIG.privateKey;
    if (privateKey && typeof privateKey === 'string' && !privateKey.includes('BEGIN')) {
        if (fs.existsSync(privateKey)) {
            privateKey = fs.readFileSync(privateKey);
        }
    }
    return {
        host: SFTP_CONFIG.host,
        port: SFTP_CONFIG.port || 22,
        username: SFTP_CONFIG.username,
        privateKey: privateKey,
        password: SFTP_CONFIG.password
    };
}

/**
 * Trigger encode via SSH Command
 */
async function triggerEncodeViaSSH(videoPath, slug, onProgress) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        const INGEST_SCRIPT = '/home/kowflix/scripts/ingest.sh';
        const UPLOAD_ROOT = '/media/DATA/kowflix';

        // Command to run ingest script
        const command = `bash ${INGEST_SCRIPT} "${videoPath}" "${slug}" "${UPLOAD_ROOT}"`;

        console.log(`🔧 Triggering encode via SSH: ${command}`);

        conn.on('ready', () => {
            conn.exec(command, (err, stream) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }

                const state = { videoDuration: null, currentResolution: '1080p' };
                let lastProgress = 0;

                stream.on('close', (code, signal) => {
                    conn.end();
                    if (code === 0) {
                        if (onProgress) onProgress(100);
                        resolve();
                    } else {
                        reject(new Error(`Encode process exited with code ${code}`));
                    }
                }).on('data', (data) => {
                    const lines = data.toString().split('\n');
                    for (const line of lines) {
                        const progress = parseFFmpegProgress(line, state);
                        if (progress !== null && progress > lastProgress) {
                            lastProgress = progress;
                            console.log(`📊 SSH Encode Progress: ${progress}%`);
                            if (onProgress) onProgress(progress);
                        }
                    }
                }).stderr.on('data', (data) => {
                    const text = data.toString();
                    // FFmpeg sends progress to stderr
                    const lines = text.split('\n');
                    for (const line of lines) {
                        const progress = parseFFmpegProgress(line, state);
                        if (progress !== null && progress > lastProgress) {
                            lastProgress = progress;
                            console.log(`📊 SSH Encode Progress: ${progress}%`);
                            if (onProgress) onProgress(progress);
                        }
                    }
                });
            });
        }).on('error', (err) => {
            console.error('SSH Connection Error:', err);
            reject(err);
        }).connect(getSshConfig());
    });
}

/**
 * Parse FFmpeg progress from output
 * Same logic as before, just reused
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

        const resolutionProgress = Math.min(Math.round((currentTime / state.videoDuration) * 100), 100);

        if (!state.encodingPass) {
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

        let overallProgress = 0;
        if (state.currentResolution === '1080p' || state.encodingPass === 1) {
            overallProgress = Math.round(resolutionProgress / 3);
        } else if (state.currentResolution === '720p' || state.encodingPass === 2) {
            overallProgress = 33 + Math.round(resolutionProgress / 3);
        } else if (state.currentResolution === '480p' || state.encodingPass === 3) {
            overallProgress = 66 + Math.round(resolutionProgress / 3);
        }

        state.totalProgressSoFar = overallProgress;
        return Math.min(overallProgress, 100);
    }
    return null;
}

/**
 * Trigger encode on remote agent via API
 * @param {string} videoPath - Remote video path
 * @param {string} slug - Movie slug
 * @param {function} onProgress - Callback
 * @returns {Promise<void>}
 */
export async function triggerEncode(videoPath, slug, onProgress = null) {
    // Route via SSH if configured
    if (config.remote?.mode === 'ssh') {
        return triggerEncodeViaSSH(videoPath, slug, onProgress);
    }

    // Default HTTP Agent logic
    return new Promise(async (resolve, reject) => {
        try {
            console.log(`🔧 Triggering encode for: ${slug} via Agent`);

            const response = await axios.post(`${AGENT_URL}/api/encode`, {
                videoPath,
                slug
            }, {
                responseType: 'stream',
                timeout: 3600000 * 5 // 5 hours timeout for encoding
            });

            const stream = response.data;
            const state = {
                videoDuration: null,
                currentResolution: '1080p'
            };
            let lastProgress = 0;

            stream.on('data', (chunk) => {
                const text = chunk.toString();
                const lines = text.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;

                    // console.log(`[Agent Stream] ${line}`); // Debug raw stream

                    const progress = parseFFmpegProgress(line, state);
                    if (progress !== null && progress > lastProgress) {
                        lastProgress = progress;
                        const resLabel = state.currentResolution || 'unknown';
                        console.log(`📊 Encode progress (${resLabel}): ${progress}%`);
                        if (onProgress) onProgress(progress);
                    }

                    if (line.includes('Encode completed successfully')) {
                        console.log('✅ Agent signal: Encode Success');
                    }
                    if (line.includes('Encode failed')) {
                        console.error('❌ Agent signal: Encode Failed');
                    }
                }
            });

            stream.on('end', () => {
                console.log('✅ Agent connection closed (Encode Finished)');
                if (onProgress) onProgress(100);
                resolve();
            });

            stream.on('error', (err) => {
                console.error('❌ Stream error:', err);
                reject(err);
            });

        } catch (error) {
            console.error('❌ Trigger triggerEncode failed:', error.message);
            reject(error);
        }
    });
}
