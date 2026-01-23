import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import Client from 'ssh2-sftp-client';
import config from '../config/config.js';

// Get Agent URL from config
const AGENT_URL = config.remote?.agentUrl;
const SFTP_CONFIG = config.remote?.sftp;

/**
 * Upload file via SFTP
 * @param {string} localPath - Path to local file
 * @param {string} remoteFName - Remote filename
 * @param {string} type - 'video' or 'poster'
 */
async function uploadViaSSH(localPath, remoteFName, type = 'video') {
    if (!SFTP_CONFIG || !SFTP_CONFIG.host) {
        throw new Error('SFTP Configuration missing');
    }

    const sftp = new Client();
    const remoteDir = type === 'video' ?
        '/media/DATA/kowflix/uploads' :
        '/media/DATA/kowflix/posters';

    try {
        console.log(`🔌 Connecting to SFTP: ${SFTP_CONFIG.host}:${SFTP_CONFIG.port || 22}...`);

        let privateKey = SFTP_CONFIG.privateKey;
        // If privateKey is a path string without "BEGIN ... KEY", try to read it
        if (privateKey && typeof privateKey === 'string' && !privateKey.includes('BEGIN')) {
            // Normalize path (handle Windows backslashes if needed, though node fs handles / fine)
            if (fs.existsSync(privateKey)) {
                console.log(`🔑 Reading Private Key from: ${privateKey}`);
                privateKey = fs.readFileSync(privateKey);
            }
        }

        await sftp.connect({
            host: SFTP_CONFIG.host,
            port: SFTP_CONFIG.port || 22,
            username: SFTP_CONFIG.username,
            privateKey: privateKey,
            password: SFTP_CONFIG.password
        });

        // Ensure directory exists
        const exists = await sftp.exists(remoteDir);
        if (!exists) {
            console.log(`Creating remote directory: ${remoteDir}`);
            await sftp.mkdir(remoteDir, true);
        }

        const remotePath = `${remoteDir}/${remoteFName}`;
        console.log(`📤 SFTP Uploading: ${localPath} -> ${remotePath}...`);

        await sftp.put(localPath, remotePath);

        console.log(`✅ SFTP Upload Success!`);
        return {
            success: true,
            path: type === 'video' ? `/media/uploads/${remoteFName}` : `/media/posters/${remoteFName}`
        };
    } catch (err) {
        console.error('❌ SFTP Error:', err.message);
        throw err;
    } finally {
        await sftp.end();
    }
}

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

    // Agent logic remains...
    const form = new FormData();
    form.append('file', fs.createReadStream(localPath));

    try {
        console.log(`📤 Uploading to Agent: ${endpoint} ...`);
        const response = await axios.post(`${AGENT_URL}${endpoint}`, form, {
            headers: {
                ...form.getHeaders(),
                'MaxContentLength': 5 * 1024 * 1024 * 1024,
                'MaxBodyLength': 5 * 1024 * 1024 * 1024
            },
            timeout: 3600000 // 1 hour
        });
        return response.data;
    } catch (error) {
        console.error('❌ Agent Upload failed:', error.message);
        throw error;
    }
}

/**
 * Upload poster to remote server
 */
export async function uploadPoster(localPath, movieId) {
    const ext = path.extname(localPath);
    const tempName = `${movieId}${ext}`;
    const tempPath = path.join(path.dirname(localPath), tempName);

    await fs.promises.copyFile(localPath, tempPath);

    try {
        // Try SFTP first if configured
        if (config.remote?.mode === 'ssh' || (SFTP_CONFIG && SFTP_CONFIG.host)) {
            const result = await uploadViaSSH(tempPath, tempName, 'poster');
            return result.path;
        }

        const result = await uploadToAgent(tempPath, '/api/upload/poster');
        return result.path;
    } finally {
        try { await fs.promises.unlink(tempPath); } catch (e) { }
    }
}

/**
 * Upload video to remote server
 */
export async function uploadVideo(localPath, movieId) {
    const ext = path.extname(localPath);
    const tempName = `${movieId}${ext}`;
    const tempPath = path.join(path.dirname(localPath), tempName);

    await fs.promises.copyFile(localPath, tempPath);

    try {
        console.log(`PLEASE WAIT: Uploading video ${tempName} to storage server...`);

        // Try SFTP first if configured
        if (config.remote?.mode === 'ssh' || (SFTP_CONFIG && SFTP_CONFIG.host)) {
            const result = await uploadViaSSH(tempPath, tempName, 'video');
            return result.path;
        }

        const result = await uploadToAgent(tempPath, '/api/upload/video');
        console.log(`✅ Uploaded video: ${result.path}`);
        return result.path;
    } finally {
        try { await fs.promises.unlink(tempPath); } catch (e) { }
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
