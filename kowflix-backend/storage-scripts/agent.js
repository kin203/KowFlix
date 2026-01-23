import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for all routes (since frontend is on Render/Vercel)
app.use(cors());
const PORT = process.env.PORT || 3001;
// Adjust this path to point to your actual media root on the storage server
const UPLOAD_ROOT = process.env.UPLOAD_ROOT || '/media/DATA/kowflix';

// Ensure upload directories exist
const uploadDir = path.join(UPLOAD_ROOT, 'uploads');
const posterDir = path.join(UPLOAD_ROOT, 'posters');

[uploadDir, posterDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Configure storage for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine folder based on file type or field name if needed
        // For now, default to 'uploads' for videos, maybe 'posters' if specific param?
        // Let's assume the backend handles destination logic by calling different endpoints 
        // OR we put everything in one place temporarily.

        // Simple logic:
        if (req.path.includes('poster')) {
            cb(null, posterDir);
        } else {
            cb(null, uploadDir);
        }
    },
    filename: function (req, file, cb) {
        // Use the original name sent by the backend
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Middleware to parse JSON bodies
app.use(express.json());

// 1. Upload Video Endpoint
app.post('/api/upload/video', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log(`✅ Video uploaded: ${req.file.path}`);
    res.json({
        success: true,
        message: 'Video uploaded successfully',
        path: `/media/uploads/${req.file.filename}`
    });
});

// 2. Upload Poster Endpoint
app.post('/api/upload/poster', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    console.log(`✅ Poster uploaded: ${req.file.path}`);
    res.json({
        success: true,
        message: 'Poster uploaded successfully',
        path: `/media/posters/${req.file.filename}`
    });
});

// 3. Encode Endpoint (Streams output)
app.post('/api/encode', (req, res) => {
    const { videoPath, slug } = req.body;

    if (!videoPath || !slug) {
        return res.status(400).json({ success: false, message: 'Missing videoPath or slug' });
    }

    // Set headers for streaming response
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    console.log(`🎬 Triggering encode for: ${slug} (Source: ${videoPath})`);
    res.write(`Starting encoding for ${slug}...\n`);

    const INGEST_SCRIPT = '/home/kowflix/scripts/ingest.sh';

    // Check if script exists
    if (!fs.existsSync(INGEST_SCRIPT)) {
        res.write(`❌ Script not found: ${INGEST_SCRIPT}\n`);
        return res.end();
    }

    // Spawn the execute command
    // Pass UPLOAD_ROOT as the 3rd argument to the script
    const ffmpeg = spawn('bash', [INGEST_SCRIPT, videoPath, slug, UPLOAD_ROOT]);

    ffmpeg.stdout.on('data', (data) => {
        res.write(data);
    });

    ffmpeg.stderr.on('data', (data) => {
        res.write(data);
    });

    ffmpeg.on('close', (code) => {
        if (code === 0) {
            res.write(`\n✅ Encode completed successfully.\n`);
            console.log(`✅ Encode success: ${slug}`);
        } else {
            res.write(`\n❌ Encode failed with code ${code}.\n`);
            console.error(`❌ Encode failed: ${slug}`);
        }
        res.end();
    });

    ffmpeg.on('error', (err) => {
        console.error('Failed to start process:', err);
        res.write(`Error starting process: ${err.message}\n`);
        res.end();
    });
});

app.listen(PORT, () => {
    console.log(`🚀 KowFlix Agent running on port ${PORT}`);
    console.log(`📂 Upload Root: ${UPLOAD_ROOT}`);
});
