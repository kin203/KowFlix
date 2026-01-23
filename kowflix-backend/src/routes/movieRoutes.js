// src/routes/movieRoutes.js
import express from "express";
import {
  listMovies,
  getTrendingMovies,
  getTopRatedMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  playMovie,
  searchTMDb,
  getTMDbDetails,
  migrateHlsPaths,
  streamMP4,
  getFilterOptions
} from "../controllers/movieController.js";
import { getRecommendations } from "../controllers/recommendationController.js";

import auth from "../middleware/auth.js";
import isAdmin from "../middleware/admin.js";
import { streamLimiter, streamStatsHandler } from "../middleware/streamLimiter.js";

import { uploadMix } from "../utils/multer.js";

const router = express.Router();

// TMDb routes (no auth required for search)
router.get("/search-tmdb", searchTMDb);
router.get("/tmdb/:tmdbId", getTMDbDetails);

// Filter options (countries, genres)
// Filter options (countries, genres)
router.get("/filters", getFilterOptions);

router.get("/trending", getTrendingMovies);
router.get("/top-rated", getTopRatedMovies);
router.get("/recommendations", auth, getRecommendations);

router.get("/", listMovies);
router.get("/:id", getMovie);
router.get("/:id/play", streamLimiter, playMovie); // Apply stream limiter
router.get("/:id/stream", streamLimiter, streamMP4); // Apply stream limiter

// Admin: View stream statistics
router.get("/admin/stream-stats", auth, isAdmin, streamStatsHandler);


// Admin routes with file upload (poster, video, subtitles)
router.post(
  "/",
  auth,
  isAdmin,
  uploadMix.fields([
    { name: "poster", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "subtitle_en", maxCount: 1 },
    { name: "subtitle_vi", maxCount: 1 }
  ]),
  createMovie
);

router.put(
  "/:id",
  auth,
  isAdmin,
  uploadMix.fields([
    { name: "poster", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "subtitle_en", maxCount: 1 },
    { name: "subtitle_vi", maxCount: 1 }
  ]),
  updateMovie
);


router.delete("/:id", auth, isAdmin, deleteMovie);

// Migration route (admin only)
router.post("/migrate-hls-paths", auth, isAdmin, migrateHlsPaths);

export default router;
