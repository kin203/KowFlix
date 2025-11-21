// src/utils/remoteUpload.js
import SftpClient from 'ssh2-sftp-client';
import fs from 'fs';
import path from 'path';

const REMOTE_HOST = process.env.REMOTE_HOST || '192.168.100.52';
const REMOTE_USER = process.env.REMOTE_USER || 'kowflix';
// Temporarily hardcoded to bypass .env issue
const REMOTE_SSH_KEY = 'C:\\Users\\Admin\\.ssh\\kowflix_backend_key_nopass';
const REMOTE_MEDIA_ROOT = process.env.REMOTE_MEDIA_ROOT || '/media/DATA/kowflix';

console.log('🔑 SSH Key Path:', REMOTE_SSH_KEY);

/**
 * Upload poster to remote server
 * @param {string} localPath - Local file path
 * @param {string} movieId - Movie ID for filename
 * @returns {Promise<string>} Remote file path
 */
export async function uploadPoster(localPath, movieId) {
    const sftp = new SftpClient();

    try {
        await sftp.connect({
            host: REMOTE_HOST,
            port: 22,
            username: REMOTE_USER,
            privateKey: fs.readFileSync(REMOTE_SSH_KEY)
        });

        const ext = path.extname(localPath);
        const remoteFilename = `${movieId}${ext}`;
        const remotePath = `${REMOTE_MEDIA_ROOT}/posters/${remoteFilename}`;

        await sftp.put(localPath, remotePath);

        console.log(`✅ Uploaded poster: ${remotePath}`);
        return `/media/posters/${remoteFilename}`;
    } catch (err) {
        console.error('❌ Poster upload failed:', err);
        throw err;
    } finally {
        await sftp.end();
    }
}

/**
 * Upload video to remote server
 * @param {string} localPath - Local file path
 * @param {string} movieId - Movie ID for filename
 * @returns {Promise<string>} Remote file path
 */
export async function uploadVideo(localPath, movieId) {
    const sftp = new SftpClient();

    try {
        await sftp.connect({
            host: REMOTE_HOST,
            port: 22,
            username: REMOTE_USER,
            privateKey: fs.readFileSync(REMOTE_SSH_KEY)
        });

        const ext = path.extname(localPath);
        const remoteFilename = `${movieId}${ext}`;
        const remotePath = `${REMOTE_MEDIA_ROOT}/uploads/${remoteFilename}`;

        console.log(`📤 Uploading video: ${path.basename(localPath)} (this may take a while)...`);
        await sftp.put(localPath, remotePath);

        console.log(`✅ Uploaded video: ${remotePath}`);
        return `/media/uploads/${remoteFilename}`;
    } catch (err) {
        console.error('❌ Video upload failed:', err);
        throw err;
    } finally {
        await sftp.end();
    }
}
