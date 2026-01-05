import path from 'path';

export const uploadVideo = (req, res) => {
    if (!req.files || !req.files.video) {
        return res.status(400).json({ success: false, message: "No video file uploaded" });
    }

    const file = req.files.video[0];

    // Construct the path relative to media root
    // Multer saves to 'uploads/' or defined dir.
    // We want to return the path that can be stored in DB and used by file serving.
    // Based on multer.js, it saves to process.env.UPLOAD_DIR or 'uploads'

    // We return '/media/uploads/filename' format 
    // This assumes the server serves '/uploads' at '/media/uploads' or similar.
    // In server.js: app.use('/uploads', express.static(...));
    // And config.js: publicUrl: .../media

    // Let's standardise on returning a relative path starting with /media/uploads/
    const relativePath = `/media/uploads/${file.filename}`;

    res.json({
        success: true,
        message: "Video uploaded successfully",
        path: relativePath,
        filename: file.filename,
        size: file.size
    });
};

export const uploadPoster = (req, res) => {
    if (!req.files || !req.files.poster) {
        return res.status(400).json({ success: false, message: "No poster file uploaded" });
    }

    const file = req.files.poster[0];
    const relativePath = `/media/posters/${file.filename}`;

    res.json({
        success: true,
        message: "Poster uploaded successfully",
        path: relativePath,
        filename: file.filename
    });
};
