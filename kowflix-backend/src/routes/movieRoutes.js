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
  migrateHlsPaths
} from "../controllers/movieController.js";

import auth from "../middleware/auth.js";
import isAdmin from "../middleware/admin.js";

import { uploadMix } from "../utils/multer.js";

const router = express.Router();

// TMDb routes (no auth required for search)
router.get("/search-tmdb", searchTMDb);
router.get("/tmdb/:tmdbId", getTMDbDetails);

router.get("/", listMovies);
router.get("/:id", getMovie);
router.get("/:id/play", playMovie);


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
