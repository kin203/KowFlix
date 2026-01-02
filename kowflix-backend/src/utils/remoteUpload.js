import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import config from '../config/config.js';

// Get Agent URL from config (default to local tunnel if not set)
const AGENT_URL = config.remote.agentUrl;

/**
 * Upload file to remote agent via API
 * @param {string} localPath - Path to local file
 * @param {string} endpoint - API endpoint (e.g., '/api/upload/video')
 * @returns {Promise<object>} Response data
 */
async function uploadToAgent(localPath, endpoint) {
    if (!fs.existsSync(localPath)) {
        throw new Error(`File not found: ${localPath}`);
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(localPath));

    try {
        console.log(`📤 Uploading to Agent: ${endpoint} ...`);

        const response = await axios.post(`${AGENT_URL}${endpoint}`, form, {
            headers: {
                ...form.getHeaders(),
                // Increase max body length for large files (5GB)
                'MaxContentLength': 5 * 1024 * 1024 * 1024,
                'MaxBodyLength': 5 * 1024 * 1024 * 1024
            },
            // Long timeout for uploads
            timeout: 3600000 // 1 hour
        });

        return response.data;
    } catch (error) {
        console.error('❌ Upload failed:', error.message);
        if (error.response) {
            console.error('Agent Response:', error.response.data);
        }
        throw error;
    }
}

/**
 * Upload poster to remote server
 * @param {string} localPath - Local file path
 * @param {string} movieId - Movie ID for filename (will be used by agent to name file)
 * @returns {Promise<string>} Remote file path
 */
export async function uploadPoster(localPath, movieId) {
    // We rename the local file temporarily to the desired remote name
    // because FormData uses the filename from the stream
    const ext = path.extname(localPath);
    const tempName = `${movieId}${ext}`;
    const tempPath = path.join(path.dirname(localPath), tempName);

    // Copy to temp path with new name
    await fs.promises.copyFile(localPath, tempPath);

    try {
        const result = await uploadToAgent(tempPath, '/api/upload/poster');
        console.log(`✅ Uploaded poster: ${result.path}`);
        return result.path;
    } finally {
        // Clean up temp file
        try {
            await fs.promises.unlink(tempPath);
        } catch (e) { /* ignore */ }
    }
}

/**
 * Upload video to remote server
 * @param {string} localPath - Local file path
 * @param {string} movieId - Movie ID for filename
 * @returns {Promise<string>} Remote file path
 */
export async function uploadVideo(localPath, movieId) {
    const ext = path.extname(localPath);
    const tempName = `${movieId}${ext}`;
    const tempPath = path.join(path.dirname(localPath), tempName);

    // Copy to temp path with new name
    await fs.promises.copyFile(localPath, tempPath);

    try {
        console.log(`PLEASE WAIT: Uploading video ${tempName} to storage server...`);
        const result = await uploadToAgent(tempPath, '/api/upload/video');
        console.log(`✅ Uploaded video: ${result.path}`);
        return result.path;
    } finally {
        // Clean up temp file
        try {
            await fs.promises.unlink(tempPath);
        } catch (e) { /* ignore */ }
    }
}

/**
 * Delete file from remote server (Agent API stub)
 * @param {string} remotePath - Remote file path
 * @returns {Promise<boolean>} Success status
 */
export async function deleteRemoteFile(remotePath) {
    // TODO: Implement delete API in agent
    console.warn(`⚠️ Delete requested for ${remotePath} but Agent API does not support deletion yet.`);
    return true; // Pretend success
}

export async function deleteRemoteDirectory(remotePath) {
    // TODO: Implement delete API in agent
    console.warn(`⚠️ Delete directory requested for ${remotePath} but Agent API does not support deletion yet.`);
    return true;
}

export async function deleteMovieFiles(movieId, movie) {
    console.log(`⚠️ Helper: deleteMovieFiles called for ${movieId} (No-op in Agent mode)`);
}
