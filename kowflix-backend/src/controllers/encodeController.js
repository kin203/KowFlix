// src/controllers/encodeController.js
import path from "path";
import Movie from "../models/Movie.js";
import { triggerEncode } from "../utils/remoteEncode.js";

const REMOTE_MEDIA_ROOT = process.env.REMOTE_MEDIA_ROOT || "/media/DATA/kowflix";

// POST /api/encode/:id/start
export const startEncode = async (req, res) => {
    try {
        const movieId = req.params.id;
        const movie = await Movie.findById(movieId);
        if (!movie) return res.status(404).json({ success: false, message: "Not found" });

        // find MP4 source
        const source = movie.contentFiles.find(f => f.type === "mp4");
        if (!source) return res.status(400).json({ success: false, message: "No mp4 source found to encode" });

        // Convert relative path to absolute path on remote server
        // source.path is like "/media/uploads/xxx.mp4"
        const videoPath = `${REMOTE_MEDIA_ROOT}${source.path.replace('/media', '')}`;

        // set status processing
        movie.status = "processing";
        await movie.save();

        // Trigger encode on remote server (non-blocking)
        triggerEncode(videoPath, movie.slug)
            .then(async () => {
                console.log(`✅ Encode completed for: ${movie.slug}`);

                // Update movie with HLS URLs
                const PUBLIC_MEDIA_URL = process.env.PUBLIC_MEDIA_URL || "https://nk203.id.vn/media";
                const hlsBase = `${PUBLIC_MEDIA_URL}/hls/${movie.slug}`;

                const updatedMovie = await Movie.findByIdAndUpdate(movieId, {
                    status: "ready",
                    hlsFolder: `/media/hls/${movie.slug}`,
                    contentFiles: [
                        ...movie.contentFiles.filter(f => f.type !== "hls"),
                        { type: "hls", path: `${hlsBase}/1080p/index.m3u8`, quality: "1080p" },
                        { type: "hls", path: `${hlsBase}/720p/index.m3u8`, quality: "720p" },
                        { type: "hls", path: `${hlsBase}/480p/index.m3u8`, quality: "480p" }
                    ]
                }, { new: true });

                console.log(`✅ Movie updated with HLS URLs:`, updatedMovie.slug);
            })
            .catch((err) => {
                console.error(`❌ Encode failed for ${movie.slug}:`, err);
                Movie.findByIdAndUpdate(movieId, { status: "error" }).catch(e => console.error(e));
            });

        // Return immediately (don't wait for encode to finish)
        res.json({
            success: true,
            message: "Encode started. This may take several minutes. Check movie status later."
        });
    } catch (err) {
        console.error("startEncode error:", err);
        try {
            if (req.params.id) {
                await Movie.findByIdAndUpdate(req.params.id, { status: "error" });
            }
        } catch (e) { }
        return res.status(500).json({ success: false, message: "Encode failed" });
    }
};
