// src/routes/movieRoutes.js
import express from "express";
import {
  listMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  playMovie
} from "../controllers/movieController.js";

import auth from "../middleware/auth.js";
import isAdmin from "../middleware/admin.js";

import { uploadMix } from "../utils/multer.js";

const router = express.Router();

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

export default router;
