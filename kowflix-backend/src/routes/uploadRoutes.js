import express from "express";
import { uploadVideo, uploadPoster } from "../controllers/uploadController.js";
import { uploadMix } from "../utils/multer.js";

const router = express.Router();

// Direct upload endpoints
// Note: These might need protection (auth/admin) depending on requirements.
// For now, we leave them public or check auth if provided, to ease the "Storage Server" role.
// But ideally, the frontend should send a token.

// POST /api/upload/video
router.post(
    "/video",
    uploadMix.fields([{ name: "video", maxCount: 1 }]),
    uploadVideo
);

// POST /api/upload/poster
router.post(
    "/poster",
    uploadMix.fields([{ name: "poster", maxCount: 1 }]),
    uploadPoster
);

export default router;
