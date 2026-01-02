import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// Configuration
import config from "./config/config.js";

// Middleware
import errorHandler, { notFoundHandler } from "./middleware/errorHandler.js";

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
import wishlistRoutes from "./routes/wishlistRoutes.js";

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Note: Media files are now served directly from nk203.id.vn via Cloudflare Tunnel
// However, for local development uploads, we still need to serve the uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
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
app.use("/api/wishlist", wishlistRoutes);

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// Health check route
app.get("/", (req, res) => res.json({
  status: "success",
  message: "KowFlix API running...",
  version: "1.0.0",
  environment: config.server.env
}));

// 404 Handler - Must be after all routes
app.use(notFoundHandler);

// Error Handler - Must be last
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(config.database.uri)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Start server
const server = app.listen(config.server.port, () => {
  console.log(`🚀 Server running on port ${config.server.port}`);
  console.log(`🌍 Environment: ${config.server.env}`);
  console.log(`📁 Media URL: ${config.media.publicUrl}`);

  // Log enabled features
  if (config.cloudinary.enabled) console.log("☁️  Cloudinary: enabled");
  if (config.remote.enabled) console.log("🔗 Remote server: enabled");
  if (config.tmdb.enabled) console.log("🎬 TMDb API: enabled");
});

// Graceful shutdown
// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    console.log('✅ Server closed');
    try {
      await mongoose.connection.close(false);
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully...');
  server.close(async () => {
    console.log('✅ Server closed');
    try {
      await mongoose.connection.close(false);
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    } catch (err) {
      console.error('Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });
});

