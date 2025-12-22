// src/routes/encodeRoutes.js
import express from "express";
import { startEncode } from "../controllers/encodeController.js";
import { movieReadyWebhook } from "../controllers/webhookController.js";
import auth from "../middleware/auth.js";
import isAdmin from "../middleware/admin.js";

const router = express.Router();

// admin trigger encode manually
router.post("/encode/:id/start", auth, isAdmin, startEncode);

// webhook from watcher/ingest (no auth or secret header)
router.post("/webhook/movies/:id/ready", movieReadyWebhook);

export default router;
