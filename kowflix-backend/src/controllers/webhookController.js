// src/controllers/webhookController.js
import mongoose from "mongoose";
import Movie from "../models/Movie.js";
import path from "path";

/**
 * POST /api/webhook/movies/:id/ready
 * body: { master: '/media/hls/<id>/master.m3u8', variants: [{quality:'720p', path:'/media/hls/.../720p.m3u8'}], thumbnails: ['/media/thumbnails/x.jpg'] }
 * optional: protect with secret token header X-WEBHOOK-SECRET
 */
export const movieReadyWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.WEBHOOK_SECRET;
        if (webhookSecret) {
            const header = req.get("x-webhook-secret");
            if (!header || header !== webhookSecret) return res.status(403).json({ success: false, message: "Forbidden" });
        }

        const idParam = req.params.id;
        let movie;

        // Try finding by ID if it's a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(idParam)) {
            movie = await Movie.findById(idParam);
        }

        // If not found or not ObjectId, try finding by slug
        if (!movie) {
            movie = await Movie.findOne({ slug: idParam });
        }

        if (!movie) return res.status(404).json({ success: false, message: "Not found" });

        const payload = req.body;

        // update contentFiles (replace hls)
        const variants = Array.isArray(payload.variants) ? payload.variants : [];
        const hlsFiles = variants.map(v => ({ type: "hls", quality: v.quality, path: v.path, filesize: v.filesize || 0 }));
        if (payload.master) hlsFiles.push({ type: "hls", quality: "master", path: payload.master });
        movie.contentFiles = movie.contentFiles.filter(f => f.type !== "hls").concat(hlsFiles);

        if (Array.isArray(payload.thumbnails)) movie.thumbnails = payload.thumbnails;
        movie.status = "ready";

        // Use the payload hlsFolder, or existing one, or construct from ID (which might be slug)
        movie.hlsFolder = payload.hlsFolder || movie.hlsFolder || `/media/hls/${idParam}`;

        await movie.save();
        return res.json({ success: true });
    } catch (err) {
        console.error("webhook error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
