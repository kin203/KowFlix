import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import fs from "fs";
import path from "path";

// Routes
import movieRoutes from "./routes/movieRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import encodeRoutes from "./routes/encodeRoutes.js";

dotenv.config();

// Ensure media directories exist
const MEDIA_ROOT = process.env.MEDIA_ROOT || path.join(process.cwd(), "media");
const dirs = [
  MEDIA_ROOT,
  process.env.UPLOAD_DIR || path.join(MEDIA_ROOT, "uploads"),
  process.env.POSTER_DIR || path.join(MEDIA_ROOT, "posters"),
  process.env.HLS_DIR || path.join(MEDIA_ROOT, "hls"),
  process.env.THUMB_DIR || path.join(MEDIA_ROOT, "thumbnails")
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } catch (err) {
      console.error(`Failed to create directory ${dir}:`, err.message);
    }
  }
});

const app = express();

app.use(cors());
app.use(express.json());

// Serve static media files
app.use('/media', express.static(MEDIA_ROOT));

// Routes
app.use("/api/movies", movieRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", encodeRoutes);

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Sample route
app.get("/", (req, res) => res.send("KowFlix API running..."));

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
