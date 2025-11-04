// src/models/Movie.js
import mongoose from "mongoose";

const ContentFileSchema = new mongoose.Schema({
  type: { type: String, enum: ["hls", "mp4"], required: true },
  path: { type: String, required: true }, // relative path or URL served by nginx
  quality: { type: String, enum: ["1080p","720p","480p","360p"], default: "720p" },
  filesize: { type: Number, default: 0 } // in bytes (optional)
}, { _id: false });

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true, index: "text" },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: "" },
  genres: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  poster: { type: String, default: "" },       // url/path
  background: { type: String, default: "" },   // url/path
  duration: { type: Number, default: 0 },      // seconds
  releaseYear: { type: Number },
  contentFiles: { type: [ContentFileSchema], default: [] },
  thumbnails: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

// text index for search
MovieSchema.index({ title: "text", description: "text", genres: "text", tags: "text" });

export default mongoose.models.Movie || mongoose.model("Movie", MovieSchema);
