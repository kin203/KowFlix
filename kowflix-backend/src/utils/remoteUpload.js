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

/**
 * Delete file from remote server
 * @param {string} remotePath - Remote file path (e.g., /media/DATA/kowflix/uploads/xxx.mp4)
 * @returns {Promise<boolean>} Success status
 */
export async function deleteRemoteFile(remotePath) {
    const sftp = new SftpClient();

    try {
        await sftp.connect({
            host: REMOTE_HOST,
            port: 22,
            username: REMOTE_USER,
            privateKey: fs.readFileSync(REMOTE_SSH_KEY)
        });

        const exists = await sftp.exists(remotePath);
        if (exists) {
            await sftp.delete(remotePath);
            console.log(`✅ Deleted file: ${remotePath}`);
            return true;
        } else {
            console.log(`⚠️ File not found: ${remotePath}`);
            return false;
        }
    } catch (err) {
        console.error('❌ File deletion failed:', err);
        return false;
    } finally {
        await sftp.end();
    }
}

/**
 * Delete directory from remote server (recursive)
 * @param {string} remotePath - Remote directory path
 * @returns {Promise<boolean>} Success status
 */
export async function deleteRemoteDirectory(remotePath) {
    const sftp = new SftpClient();

    try {
        await sftp.connect({
            host: REMOTE_HOST,
            port: 22,
            username: REMOTE_USER,
            privateKey: fs.readFileSync(REMOTE_SSH_KEY)
        });

        const exists = await sftp.exists(remotePath);
        if (exists) {
            await sftp.rmdir(remotePath, true); // recursive delete
            console.log(`✅ Deleted directory: ${remotePath}`);
            return true;
        } else {
            console.log(`⚠️ Directory not found: ${remotePath}`);
            return false;
        }
    } catch (err) {
        console.error('❌ Directory deletion failed:', err);
        return false;
    } finally {
        await sftp.end();
    }
}

/**
 * Delete all movie files (video, poster, HLS folder)
 * @param {string} movieId - Movie ID
 * @param {object} movie - Movie object with file paths
 * @returns {Promise<void>}
 */
export async function deleteMovieFiles(movieId, movie) {
    const deletionPromises = [];

    // Delete video file
    if (movie.contentFiles && movie.contentFiles.length > 0) {
        const videoFile = movie.contentFiles.find(f => f.type === 'mp4');
        if (videoFile && videoFile.path) {
            const videoPath = `${REMOTE_MEDIA_ROOT}${videoFile.path.replace('/media', '')}`;
            deletionPromises.push(deleteRemoteFile(videoPath));
        }
    }

    // Delete poster (if not from TMDb)
    if (movie.poster && !movie.poster.startsWith('http')) {
        const posterPath = `${REMOTE_MEDIA_ROOT}${movie.poster.replace('/media', '')}`;
        deletionPromises.push(deleteRemoteFile(posterPath));
    }

    // Delete HLS folder
    if (movie.hlsFolder) {
        const hlsPath = `${REMOTE_MEDIA_ROOT}${movie.hlsFolder.replace('/media', '')}`;
        deletionPromises.push(deleteRemoteDirectory(hlsPath));
    }

    // Execute all deletions
    await Promise.allSettled(deletionPromises);
    console.log(`✅ Cleaned up files for movie: ${movieId}`);
}
