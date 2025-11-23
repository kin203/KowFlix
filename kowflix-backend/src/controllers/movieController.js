// src/controllers/movieController.js
import fs from "fs/promises";
import path from "path";
import slugify from "slugify";
import Movie from "../models/Movie.js";
import { uploadPoster, uploadVideo } from "../utils/remoteUpload.js";
import { searchMovies, getMovieDetails } from "../utils/tmdb.js";

const mediaBase = ""; // Store relative paths (e.g. /uploads/xxx) so we can map to any root

// ====================== LIST ======================
export const listMovies = async (req, res) => {
  try {
    const { q, genre, page = 1, limit = 12 } = req.query;
    const query = {};

    if (q) query.$text = { $search: q };
    if (genre) query.genres = genre;

    const total = await Movie.countDocuments(query);

    const movies = await Movie.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Add PUBLIC_MEDIA_URL to poster paths
    const PUBLIC_MEDIA_URL = process.env.PUBLIC_MEDIA_URL || "https://nk203.id.vn/media";
    const moviesWithFullUrls = movies.map(movie => {
      const movieObj = movie.toObject();
      if (movieObj.poster && movieObj.poster.startsWith('/media/')) {
        movieObj.poster = `${PUBLIC_MEDIA_URL}${movieObj.poster.replace('/media', '')}`;
      }
      if (movieObj.background && movieObj.background.startsWith('/media/')) {
        movieObj.background = `${PUBLIC_MEDIA_URL}${movieObj.background.replace('/media', '')}`;
      }
      return movieObj;
    });

    res.json({ success: true, total, page: Number(page), limit: Number(limit), data: moviesWithFullUrls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== GET ONE ======================
export const getMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ success: false, message: "Not found" });

    // Add PUBLIC_MEDIA_URL to poster paths
    const PUBLIC_MEDIA_URL = process.env.PUBLIC_MEDIA_URL || "https://nk203.id.vn/media";
    const movieObj = movie.toObject();
    if (movieObj.poster && movieObj.poster.startsWith('/media/')) {
      movieObj.poster = `${PUBLIC_MEDIA_URL}${movieObj.poster.replace('/media', '')}`;
    }
    if (movieObj.background && movieObj.background.startsWith('/media/')) {
      movieObj.background = `${PUBLIC_MEDIA_URL}${movieObj.background.replace('/media', '')}`;
    }

    res.json({ success: true, data: movieObj });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== CREATE ======================
export const createMovie = async (req, res) => {
  try {
    const { title, description, genres = [], releaseYear, duration } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "title required" });

    let slug = slugify(title, { lower: true, strict: true });

    // Check for duplicate slug
    const existingMovie = await Movie.findOne({ slug });
    if (existingMovie) {
      slug = `${slug}-${Date.now()}`;
    }

    // Create movie first to get ID
    const movie = await Movie.create({
      title,
      slug,
      description,
      genres: typeof genres === "string" ? genres.split(",").map(s => s.trim()) : genres,
      releaseYear: releaseYear ? Number(releaseYear) : undefined,
      duration: duration ? Number(duration) : undefined,
      // TMDb metadata
      tmdbId: req.body.tmdbId ? Number(req.body.tmdbId) : undefined,
      imdbId: req.body.imdbId || undefined,
      runtime: req.body.runtime ? Number(req.body.runtime) : undefined,
      cast: req.body.cast ? (typeof req.body.cast === "string" ? req.body.cast.split(",").map(s => s.trim()) : req.body.cast) : undefined,
      director: req.body.director || undefined,
      imdbRating: req.body.imdbRating ? Number(req.body.imdbRating) : undefined,
      voteAverage: req.body.imdbRating ? Number(req.body.imdbRating) : undefined,
      status: "draft"
    });

    const movieId = movie._id.toString();
    let posterPath = "";
    let videoPath = "";

    try {
      // Upload poster to remote server
      if (req.files?.poster?.[0]) {
        const localPosterPath = req.files.poster[0].path;
        posterPath = await uploadPoster(localPosterPath, movieId);

        // Delete local temp file
        await fs.unlink(localPosterPath);
      }

      // Upload video to remote server
      if (req.files?.video?.[0]) {
        const localVideoPath = req.files.video[0].path;
        videoPath = await uploadVideo(localVideoPath, movieId);

        // Delete local temp file
        await fs.unlink(localVideoPath);
      }

      // Update movie with remote paths
      movie.poster = posterPath;
      movie.contentFiles = videoPath ? [{ type: "mp4", path: videoPath, quality: "720p" }] : [];
      await movie.save();

      res.status(201).json({ success: true, data: movie });
    } catch (uploadErr) {
      console.error("Upload error:", uploadErr);

      // Clean up: delete movie if upload failed
      await Movie.findByIdAndDelete(movieId);

      // Try to clean up local temp files
      try {
        if (req.files?.poster?.[0]) await fs.unlink(req.files.poster[0].path);
        if (req.files?.video?.[0]) await fs.unlink(req.files.video[0].path);
      } catch (e) { /* ignore */ }

      return res.status(500).json({
        success: false,
        message: "Failed to upload files to remote server: " + uploadErr.message
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== UPDATE ======================
export const updateMovie = async (req, res) => {
  try {
    const payload = { ...req.body };

    if (typeof payload.genres === "string") {
      payload.genres = payload.genres.split(",").map(s => s.trim());
    }

    if (req.files?.poster?.[0]) {
      payload.poster = `${mediaBase}/posters/${req.files.poster[0].filename}`;
    }

    if (req.files?.video?.[0]) {
      const videoPath = `${mediaBase}/uploads/${req.files.video[0].filename}`;
      payload.contentFiles = payload.contentFiles || [];
      payload.contentFiles.push({ type: "mp4", path: videoPath, quality: "720p" });
    }

    const movie = await Movie.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!movie) return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: movie });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== DELETE ======================
export const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ success: false, message: "Not found" });

    // Delete poster
    try {
      const mediaRoot = process.env.MEDIA_ROOT || path.join(process.cwd(), "media");

      if (movie.poster) {
        // movie.poster might be "/posters/xxx.jpg" or "/media/posters/xxx.jpg"
        // We want to resolve it against MEDIA_ROOT
        const rel = movie.poster.replace(/^\/media\//, "").replace(/^\//, "");
        await fs.rm(path.join(mediaRoot, rel), { force: true });
      }

      for (const f of movie.contentFiles) {
        const rel = f.path.replace(/^\/media\//, "").replace(/^\//, "");
        await fs.rm(path.join(mediaRoot, rel), { force: true });
      }
    } catch (e) {
      console.warn("File delete warning:", e.message);
    }

    await movie.deleteOne();
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const playMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ success: false, message: "Not found" });

    const PUBLIC_MEDIA_URL = process.env.PUBLIC_MEDIA_URL || "";

    // Get all HLS content files
    const hlsFiles = movie.contentFiles.filter(f => f.type === "hls");

    // Find the master playlist
    const masterFile = hlsFiles.find(f => f.quality === "master");

    // Build qualities array with full URLs
    const qualities = hlsFiles.map(f => {
      let url = f.path;

      // Only build URL if it's not already a full URL
      if (!url.startsWith("http")) {
        // Paths are stored as /hls/... or /media/hls/...
        // PUBLIC_MEDIA_URL is like https://nk203.id.vn/media

        if (PUBLIC_MEDIA_URL) {
          // If path starts with /hls/, prepend PUBLIC_MEDIA_URL
          // Result: https://nk203.id.vn/media/hls/...
          if (url.startsWith("/hls/")) {
            url = `${PUBLIC_MEDIA_URL}${url}`;
          }
          // If path starts with /media/hls/, strip /media and prepend PUBLIC_MEDIA_URL
          else if (url.startsWith("/media/hls/")) {
            url = `${PUBLIC_MEDIA_URL}${url.replace("/media", "")}`;
          }
          // Otherwise just prepend
          else {
            url = `${PUBLIC_MEDIA_URL}${url}`;
          }
        }
      }

      return {
        quality: f.quality,
        url
      };
    });

    // Build master URL
    let masterUrl = null;
    if (masterFile) {
      masterUrl = masterFile.path;

      if (!masterUrl.startsWith("http")) {
        if (PUBLIC_MEDIA_URL) {
          if (masterUrl.startsWith("/hls/")) {
            masterUrl = `${PUBLIC_MEDIA_URL}${masterUrl}`;
          } else if (masterUrl.startsWith("/media/hls/")) {
            masterUrl = `${PUBLIC_MEDIA_URL}${masterUrl.replace("/media", "")}`;
          } else {
            masterUrl = `${PUBLIC_MEDIA_URL}${masterUrl}`;
          }
        }
      }
    }

    // Return both master (for backward compatibility) and qualities
    res.json({
      success: true,
      data: {
        id: movie._id,
        title: movie.title,
        poster: movie.poster,
        description: movie.description,
        master: masterUrl,  // Add master URL for frontend compatibility
        qualities
      }
    });
  } catch (e) {
    console.error("playMovie error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== TMDB SEARCH ======================
export const searchTMDb = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ success: false, message: "Query parameter is required" });
    }

    const results = await searchMovies(query);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("TMDb search error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== TMDB GET DETAILS ======================
export const getTMDbDetails = async (req, res) => {
  try {
    const { tmdbId } = req.params;

    if (!tmdbId) {
      return res.status(400).json({ success: false, message: "TMDb ID is required" });
    }

    const details = await getMovieDetails(parseInt(tmdbId));

    res.json({
      success: true,
      data: details
    });
  } catch (error) {
    console.error("TMDb getDetails error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
