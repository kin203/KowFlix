// src/utils/multer.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mediaRoot = process.env.MEDIA_ROOT || path.join(__dirname, "..", "..", "media");
const posterDir = process.env.POSTER_DIR || path.join(mediaRoot, "posters");
const uploadDir = process.env.UPLOAD_DIR || path.join(mediaRoot, "uploads");
const subtitleDir = process.env.SUBTITLE_DIR || path.join(mediaRoot, "subtitles");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "poster") {
      cb(null, posterDir);
    } else if (file.fieldname === "video") {
      cb(null, uploadDir);
    } else if (file.fieldname.startsWith("subtitle")) {
      // subtitle_en, subtitle_vi, etc.
      cb(null, subtitleDir);
    } else {
      cb(new Error("Invalid field name"), null);
    }
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
