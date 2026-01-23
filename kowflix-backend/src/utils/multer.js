// src/utils/multer.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mediaRoot = process.env.MEDIA_ROOT || path.join(__dirname, "..", "..", "media");
const posterDir = process.env.POSTER_DIR || path.join(mediaRoot, "posters");
const uploadDir = process.env.UPLOAD_DIR || path.join(mediaRoot, "uploads");
const subtitleDir = process.env.SUBTITLE_DIR || path.join(mediaRoot, "subtitles");

import fs from "fs";

// Ensure base directories exist (Create them at startup is good, but inside callback is safer for ephemeral FS)
[posterDir, uploadDir, subtitleDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.error(`Failed to create directory ${dir}:`, e);
    }
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir = uploadDir; // Default

    if (file.fieldname === "poster") {
      dir = posterDir;
    } else if (file.fieldname === "video") {
      dir = uploadDir;
    } else if (file.fieldname.startsWith("subtitle")) {
      dir = subtitleDir;
    }

    // Double check ensure dir exists (in case it was deleted or ephemeral)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  }
});

export const uploadMix = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 } // 5GB max for everything (video dominates)
});

// Legacy exports removed to prevent errors
