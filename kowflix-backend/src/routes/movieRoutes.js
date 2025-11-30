// src/routes/movieRoutes.js
import express from "express";
import {
  listMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  playMovie,
  searchTMDb,
  getTMDbDetails,
  migrateHlsPaths,
  streamMP4
} from "../controllers/movieController.js";

import auth from "../middleware/auth.js";
import isAdmin from "../middleware/admin.js";
import { streamLimiter, streamStatsHandler } from "../middleware/streamLimiter.js";

import { uploadMix } from "../utils/multer.js";

const router = express.Router();

// TMDb routes (no auth required for search)
router.get("/search-tmdb", searchTMDb);
router.get("/tmdb/:tmdbId", getTMDbDetails);

router.get("/", listMovies);
router.get("/:id", getMovie);
router.get("/:id/play", streamLimiter, playMovie); // Apply stream limiter
router.get("/:id/stream", streamLimiter, streamMP4); // Apply stream limiter

// Admin: View stream statistics
router.get("/admin/stream-stats", auth, isAdmin, streamStatsHandler);


router.post(
  "/",
  auth,
  isAdmin,
  uploadMix.fields([
    { name: "poster", maxCount: 1 },
    { name: "video", maxCount: 1 }
  ]),
  createMovie
);

router.put(
  "/:id",
  auth,
  isAdmin,
  uploadMix.fields([
    { name: "poster", maxCount: 1 },
    { name: "video", maxCount: 1 }
  ]),
  updateMovie
);


router.delete("/:id", auth, isAdmin, deleteMovie);

// Migration route (admin only)
router.post("/migrate-hls-paths", auth, isAdmin, migrateHlsPaths);

export default router;
