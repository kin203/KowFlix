// src/utils/remoteEncode.js
import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const REMOTE_HOST = process.env.REMOTE_HOST || '192.168.100.52';
const REMOTE_USER = process.env.REMOTE_USER || 'kowflix';
const REMOTE_SSH_KEY = process.env.REMOTE_SSH_KEY_PATH || path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'kowflix_backend_key');
const INGEST_SCRIPT = '/home/kowflix/scripts/ingest.sh';

/**
 * Trigger encode on remote server
 * @param {string} videoPath - Remote video path (e.g., /media/DATA/kowflix/uploads/xxx.mp4)
 * @param {string} slug - Movie slug for HLS output folder
 * @returns {Promise<void>}
 */
export async function triggerEncode(videoPath, slug) {
    return new Promise((resolve, reject) => {
        const conn = new Client();

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

                stream.on('close', (code, signal) => {
                    conn.end();

                    if (code === 0) {
                        console.log(`✅ Encode triggered successfully for: ${slug}`);
                        resolve();
                    } else {
                        console.error(`❌ Encode failed with code ${code}`);
                        console.error('STDERR:', stderr);
                        reject(new Error(`Encode failed with code ${code}: ${stderr}`));
                    }
                });

                stream.on('data', (data) => {
                    stdout += data.toString();
                    console.log('STDOUT:', data.toString());
                });

                stream.stderr.on('data', (data) => {
                    stderr += data.toString();
                    console.error('STDERR:', data.toString());
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
