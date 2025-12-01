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
import progressRoutes from "./routes/progressRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import heroRoutes from "./routes/heroRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import navMenuRoutes from "./routes/navMenuRoutes.js";

dotenv.config();

// Ensure media directories exist
const MEDIA_ROOT = process.env.MEDIA_ROOT || path.join(process.cwd(), "media");
const dirs = [
  MEDIA_ROOT,
  process.env.UPLOAD_DIR || path.join(MEDIA_ROOT, "uploads"),
  process.env.POSTER_DIR || path.join(MEDIA_ROOT, "posters"),
  process.env.HLS_DIR || path.join(MEDIA_ROOT, "hls"),
  process.env.THUMB_DIR || path.join(MEDIA_ROOT, "thumbnails"),
  process.env.SUBTITLE_DIR || path.join(MEDIA_ROOT, "subtitles")
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
app.use("/api/progress", progressRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/hero", heroRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/nav-menu", navMenuRoutes);

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Sample route
app.get("/", (req, res) => res.send("KowFlix API running..."));

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
// Server updated
