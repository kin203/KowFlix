// src/controllers/movieController.js
import fs from "fs/promises";
import path from "path";
import slugify from "slugify";
import Movie from "../models/Movie.js";
import Job from "../models/Job.js";
import { uploadPoster, uploadVideo, deleteMovieFiles } from "../utils/remoteUpload.js";
import { searchMovies, getMovieDetails, getMovieTrailer, downloadImage } from "../utils/tmdb.js";
import { triggerEncode } from "../utils/remoteEncode.js";
import * as jobQueue from "../services/jobQueue.js";

const mediaBase = ""; // Store relative paths (e.g. /uploads/xxx) so we can map to any root

// ====================== LIST ======================
export const getTrendingMovies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const movies = await Movie.find()
      .sort({ views: -1 })
      .limit(limit);

    // Add PUBLIC_MEDIA_URL to poster paths
    const PUBLIC_MEDIA_URL = process.env.PUBLIC_MEDIA_URL || (process.env.NODE_ENV === 'production' ? "https://nk203.id.vn/media" : "http://localhost:5000/media");
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

    res.json({ success: true, data: moviesWithFullUrls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTopRatedMovies = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Dynamically import Review to avoid circular dependency issues if any
    let Review;
    try {
      Review = (await import("../models/Review.js")).default;
    } catch (e) {
      console.error("Failed to import Review model:", e);
      // Fallback to sorting by createdAt if Review model fails
      const fallbackMovies = await Movie.find().sort({ createdAt: -1 }).limit(limit);
      return res.json({ success: true, data: fallbackMovies });
    }

    // Aggregate reviews to get average rating
    const topRatedIds = await Review.aggregate([
      {
        $group: {
          _id: "$movieId",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gte: 1 } } }, // Optional: require at least 1 review
      { $sort: { avgRating: -1 } },
      { $limit: limit }
    ]);

    // If no rated movies found, return trending or new instead of empty
    if (!topRatedIds || topRatedIds.length === 0) {
      const fallbackMovies = await Movie.find().sort({ views: -1 }).limit(limit);
      // Add PUBLIC_MEDIA_URL to poster paths (duplicate logic, should be helper but inline for now)
      const PUBLIC_MEDIA_URL = process.env.PUBLIC_MEDIA_URL || (process.env.NODE_ENV === 'production' ? "https://nk203.id.vn/media" : "http://localhost:5000/media");
      const moviesWithFullUrls = fallbackMovies.map(movie => {
        const movieObj = movie.toObject();
        if (movieObj.poster && movieObj.poster.startsWith('/media/')) {
          movieObj.poster = `${PUBLIC_MEDIA_URL}${movieObj.poster.replace('/media', '')}`;
        }
        if (movieObj.background && movieObj.background.startsWith('/media/')) {
          movieObj.background = `${PUBLIC_MEDIA_URL}${movieObj.background.replace('/media', '')}`;
        }
        return movieObj;
      });
      return res.json({ success: true, data: moviesWithFullUrls });
    }

    // Extract valid ObjectIds
    const movieIds = topRatedIds.map(item => item._id);

    // Fetch full movie details
    const movies = await Movie.find({ _id: { $in: movieIds } });

    // Map back to preserve order and structure
    const orderedMovies = movieIds
      .map(id => movies.find(m => m && m._id.toString() === id.toString())) // Added check for m
      .filter(m => m); // Filter out nulls if movie was deleted but reviews exist

    // Add PUBLIC_MEDIA_URL
    const PUBLIC_MEDIA_URL = process.env.PUBLIC_MEDIA_URL || (process.env.NODE_ENV === 'production' ? "https://nk203.id.vn/media" : "http://localhost:5000/media");
    const moviesWithFullUrls = orderedMovies.map(movie => {
      const movieObj = movie.toObject();
      const ratingInfo = topRatedIds.find(item => item._id.toString() === movie._id.toString());
      movieObj.voteAverage = ratingInfo ? ratingInfo.avgRating : 0; // In case we want to display it

      if (movieObj.poster && movieObj.poster.startsWith('/media/')) {
        movieObj.poster = `${PUBLIC_MEDIA_URL}${movieObj.poster.replace('/media', '')}`;
      }
      if (movieObj.background && movieObj.background.startsWith('/media/')) {
        movieObj.background = `${PUBLIC_MEDIA_URL}${movieObj.background.replace('/media', '')}`;
      }
      return movieObj;
    });

    res.json({ success: true, data: moviesWithFullUrls });
  } catch (err) {
    console.error("getTopRatedMovies error:", err);
    res.status(500).json({ success: false, message: "Server error: " + err.message });
  }
};

export const listMovies = async (req, res) => {
  try {
    const { q, genre, categoryId, page = 1, limit = 12 } = req.query;
    const query = {};

    if (q) query.$text = { $search: q };
    if (genre) query.genres = genre;
    if (categoryId) query.categories = categoryId;
    // Support filtering by country (exact match from array)
    if (req.query.country) query.countries = req.query.country;

    const total = await Movie.countDocuments(query);

    const movies = await Movie.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Add PUBLIC_MEDIA_URL to poster paths
    const PUBLIC_MEDIA_URL = process.env.PUBLIC_MEDIA_URL || (process.env.NODE_ENV === 'production' ? "https://nk203.id.vn/media" : "http://localhost:5000/media");
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
    const PUBLIC_MEDIA_URL = process.env.PUBLIC_MEDIA_URL || (process.env.NODE_ENV === 'production' ? "https://nk203.id.vn/media" : "http://localhost:5000/media");
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
    const { title, title_en, description, description_en, genres = [], releaseYear, duration } = req.body;
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
      title_en: title_en || "",
      slug,
      description,
      description_en: description_en || "",
      genres: typeof genres === "string" ? genres.split(",").map(s => s.trim()) : genres,
      countries: req.body.countries ? (typeof req.body.countries === "string" ? req.body.countries.split(",").map(s => s.trim()) : req.body.countries) : [], // NEW: Handle countries
      releaseYear: releaseYear ? Number(releaseYear) : undefined,
      duration: duration ? Number(duration) : undefined,
      // TMDb metadata
      tmdbId: req.body.tmdbId ? Number(req.body.tmdbId) : undefined,
      imdbId: req.body.imdbId || undefined,
      runtime: req.body.runtime ? Number(req.body.runtime) : undefined,
      cast: req.body.cast ? (() => {
        try {
          // Try to parse as JSON first (new format with profile_path)
          const parsed = JSON.parse(req.body.cast);
          return Array.isArray(parsed) ? parsed : undefined;
        } catch (e) {
          // Fallback: parse as comma-separated string (old format)
          return req.body.cast.split(",").map(s => ({ name: s.trim() }));
        }
      })() : undefined,
      director: req.body.director || undefined,
      imdbRating: req.body.imdbRating ? Number(req.body.imdbRating) : undefined,
      voteAverage: req.body.imdbRating ? Number(req.body.imdbRating) : undefined,
      categories: req.body.categories ? JSON.parse(req.body.categories) : [],
      status: "draft"
    });

    const movieId = movie._id.toString();
    let posterPath = "";
    let videoPath = "";

    try {
      // Handle poster: prioritize TMDb URL, then Cloudinary URL, fallback to file upload
      if (req.body.posterUrl) {
        // Use TMDb poster URL directly
        posterPath = req.body.posterUrl;
      } else if (req.body.customPosterUrl) {
        // Use Cloudinary URL (uploaded via Cloudinary Upload Widget)
        posterPath = req.body.customPosterUrl;
      } else if (req.files?.poster?.[0]) {
        // Fallback: Upload poster to remote server (legacy support)
        const localPosterPath = req.files.poster[0].path;
        posterPath = await uploadPoster(localPosterPath, movieId);
        // Delete local temp file
        await fs.unlink(localPosterPath);
      }

      // Handle backdrop URL from TMDb
      if (req.body.backdropUrl) {
        movie.backdrop = req.body.backdropUrl;
      }

      // Fetch trailer from TMDb if tmdbId is provided
      if (req.body.tmdbId) {
        console.log(`[DEBUG] Fetching trailer for TMDb ID: ${req.body.tmdbId}`);
        const trailerKey = await getMovieTrailer(req.body.tmdbId);
        if (trailerKey) {
          console.log(`[DEBUG] Trailer found: ${trailerKey}`);
          movie.trailerKey = trailerKey;
        } else {
          console.log(`[DEBUG] No trailer found for TMDb ID: ${req.body.tmdbId}`);
        }
      }

      // Handle useTrailer toggle
      if (req.body.useTrailer !== undefined) {
        movie.useTrailer = req.body.useTrailer === 'true' || req.body.useTrailer === true;
      }

      // Handle video: accept videoPath from client (already uploaded to nk203.id.vn)
      if (req.body.videoPath) {
        // Validate path (security check)
        if (!req.body.videoPath.startsWith('/media/uploads/')) {
          throw new Error('Invalid video path. Must start with /media/uploads/');
        }
        videoPath = req.body.videoPath;
        console.log(`✅ Using pre-uploaded video: ${videoPath}`);
      }
      // Fallback: support legacy file upload (for backward compatibility during transition)
      else if (req.files?.video?.[0]) {
        const localVideoPath = req.files.video[0].path;
        const fileSize = `${(req.files.video[0].size / (1024 * 1024 * 1024)).toFixed(2)} GB`;

        // Create upload job
        const uploadJob = await Job.create({
          type: 'upload',
          movieId: movie._id,
          movieTitle: movie.title,
          status: 'uploading',
          fileSize,
          progress: 0
        });

        try {
          videoPath = await uploadVideo(localVideoPath, movieId);

          // Update upload job to completed
          await Job.findByIdAndUpdate(uploadJob._id, {
            status: 'completed',
            progress: 100,
            completedTime: new Date()
          });

          // Delete local temp file
          await fs.unlink(localVideoPath);
        } catch (uploadError) {
          // Update upload job to failed
          await Job.findByIdAndUpdate(uploadJob._id, {
            status: 'failed',
            error: uploadError.message,
            completedTime: new Date()
          });
          throw uploadError;
        }
      }

      // Update movie with remote paths
      movie.poster = posterPath;
      movie.contentFiles = videoPath ? [{ type: "mp4", path: videoPath, quality: "720p" }] : [];

      // Handle subtitles
      const subtitles = [];
      if (req.files) {
        // Check for subtitle files (subtitle_en, subtitle_vi, etc.)
        Object.keys(req.files).forEach(fieldname => {
          if (fieldname.startsWith('subtitle_')) {
            const language = fieldname.replace('subtitle_', ''); // 'en', 'vi'
            const file = req.files[fieldname][0];
            const subtitlePath = `/media/subtitles/${file.filename}`;

            // Determine label based on language code
            const labels = {
              'en': 'English',
              'vi': 'Tiếng Việt',
              'zh': '中文',
              'ja': '日本語',
              'ko': '한국어'
            };

            subtitles.push({
              language: language,
              label: labels[language] || language.toUpperCase(),
              path: subtitlePath,
              default: language === 'vi' // Vietnamese default for Vietnamese movies
            });

            console.log(`✅ Added subtitle: ${labels[language] || language} (${subtitlePath})`);
          }
        });
      }

      movie.subtitles = subtitles;

      // If video uploaded, add to encoding queue
      if (videoPath) {
        movie.status = "processing";
        await movie.save();

        // Convert relative path to absolute path on remote server
        const REMOTE_MEDIA_ROOT = process.env.REMOTE_MEDIA_ROOT || "/media/DATA/kowflix";
        const absoluteVideoPath = `${REMOTE_MEDIA_ROOT}${videoPath.replace('/media', '')}`;

        // Create encode job with 'pending' status (will be processed by queue)
        const encodeJob = await Job.create({
          type: 'encode',
          movieId: movie._id,
          movieTitle: movie.title,
          status: 'pending', // ✅ Start as pending, queue will process it
          progress: 0,
          metadata: {
            videoPath: absoluteVideoPath
          }
        });

        // Add job to queue (will start when ready)
        await jobQueue.addJob(encodeJob._id);

        res.status(201).json({
          success: true,
          data: movie,
          jobId: encodeJob._id,
          message: "Movie uploaded successfully. Encoding queued."
        });
      } else {
        await movie.save();
        res.status(201).json({ success: true, data: movie });
      }
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

    // Handle bilingual fields if present in payload (already there due to ...req.body)
    // payload.title_en and payload.description_en are automatically included

    if (typeof payload.genres === "string") {
      payload.genres = payload.genres.split(",").map(s => s.trim());
    }

    if (typeof payload.countries === "string") {
      payload.countries = payload.countries.split(",").map(s => s.trim());
    }

    // Handle cast: if it's a string, try to parse it
    if (typeof payload.cast === "string") {
      try {
        // Try to parse as JSON first
        payload.cast = JSON.parse(payload.cast);
      } catch (e) {
        payload.cast = payload.cast.split(",").map(s => ({ name: s.trim() })).filter(c => c.name);
      }
    }

    // Handle categories
    if (payload.categories) {
      try {
        payload.categories = JSON.parse(payload.categories);
      } catch (e) {
        console.error("Error parsing categories:", e);
        payload.categories = [];
      }
    }

    // Handle useTrailer toggle
    if (payload.useTrailer !== undefined) {
      payload.useTrailer = payload.useTrailer === 'true' || payload.useTrailer === true;
    }

    // Handle poster: prioritize TMDb URL, fallback to file upload
    if (payload.posterUrl) {
      // Use TMDb poster URL directly
      payload.poster = payload.posterUrl;
      delete payload.posterUrl; // Remove from payload to avoid storing duplicate
    } else if (req.files?.poster?.[0]) {
      // Upload poster to remote server
      const localPosterPath = req.files.poster[0].path;
      payload.poster = await uploadPoster(localPosterPath, req.params.id);
      // Delete local temp file
      await fs.unlink(localPosterPath);
    }

    // Handle backdrop URL from TMDb
    if (payload.backdropUrl) {
      payload.backdrop = payload.backdropUrl;
      delete payload.backdropUrl; // Remove from payload to avoid storing duplicate
    }

    // Fetch trailer from TMDb if tmdbId is provided and no trailer exists
    if (payload.tmdbId) {
      const movie = await Movie.findById(req.params.id);
      if (!movie.trailerKey) {
        console.log(`[DEBUG] Fetching trailer for existing movie, TMDb ID: ${payload.tmdbId}`);
        const trailerKey = await getMovieTrailer(payload.tmdbId);
        if (trailerKey) {
          console.log(`[DEBUG] Trailer found: ${trailerKey}`);
          payload.trailerKey = trailerKey;
        } else {
          console.log(`[DEBUG] No trailer found for TMDb ID: ${payload.tmdbId}`);
        }
      }
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

    // Delete files from remote server
    try {
      console.log(`🗑️ Deleting remote files for movie: ${movie.title}`);
      await deleteMovieFiles(req.params.id, movie);
    } catch (remoteErr) {
      console.error('Remote file deletion error:', remoteErr);
      // Continue even if remote deletion fails
    }

    // Delete local files (if any)
    try {
      const mediaRoot = process.env.MEDIA_ROOT || path.join(process.cwd(), "media");

      if (movie.poster && !movie.poster.startsWith('http')) {
        const rel = movie.poster.replace(/^\/media\//, "").replace(/^\//, "");
        await fs.rm(path.join(mediaRoot, rel), { force: true });
      }

      for (const f of movie.contentFiles) {
        const rel = f.path.replace(/^\/media\//, "").replace(/^\//, "");
        await fs.rm(path.join(mediaRoot, rel), { force: true });
      }
    } catch (e) {
      console.warn("Local file delete warning:", e.message);
    }

    // Delete movie from database
    await movie.deleteOne();

    console.log(`✅ Movie deleted: ${movie.title}`);
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

    // Increment views
    await Movie.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    // Update DailyStat (fire and forget to not block response)
    (async () => {
      try {
        const DailyStat = (await import("../models/DailyStat.js")).default;
        const today = new Date().toISOString().split('T')[0];
        await DailyStat.findOneAndUpdate(
          { date: today },
          { $inc: { views: 1 } },
          { upsert: true }
        );
      } catch (err) {
        console.error("Failed to update daily stats:", err);
      }
    })();

    let PUBLIC_MEDIA_URL = process.env.PUBLIC_MEDIA_URL || (process.env.NODE_ENV === 'production' ? "https://nk203.id.vn/media" : "http://localhost:5000/media");

    // FORCE HTTPS for remote media server (nk203.id.vn) to prevent Mixed Content errors
    if (PUBLIC_MEDIA_URL.includes("nk203.id.vn") && PUBLIC_MEDIA_URL.startsWith("http:")) {
      PUBLIC_MEDIA_URL = PUBLIC_MEDIA_URL.replace("http:", "https:");
    }

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
      } else {
        // If it is ALREADY a full URL (e.g. from database legacy), force HTTPS if it matches our remote server
        if (url.includes("nk203.id.vn") && url.startsWith("http:")) {
          url = url.replace("http:", "https:");
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
      } else {
        // Force HTTPS for existing full URLs
        if (masterUrl.includes("nk203.id.vn") && masterUrl.startsWith("http:")) {
          masterUrl = masterUrl.replace("http:", "https:");
        }
      }
    }

    // Return both master (for backward compatibility) and qualities
    res.json({
      success: true,
      data: {
        _id: movie._id,
        id: movie._id,
        title: movie.title,
        poster: movie.poster,
        backdrop: movie.backdrop,
        description: movie.description,
        genres: movie.genres || [],
        imdbRating: movie.imdbRating,
        imdbId: movie.imdbId,
        tmdbId: movie.tmdbId,
        releaseYear: movie.releaseYear,
        releaseDate: movie.releaseDate,
        runtime: movie.runtime,
        cast: movie.cast || [],
        director: movie.director,
        voteAverage: movie.voteAverage,
        voteCount: movie.voteCount,
        tagline: movie.tagline,
        trailerKey: movie.trailerKey,
        useTrailer: movie.useTrailer,
        subtitles: movie.subtitles || [],
        master: masterUrl,  // Add master URL for frontend compatibility
        qualities
      }
    });
  } catch (e) {
    console.error("playMovie error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ====================== MIGRATE HLS PATHS ======================
export const migrateHlsPaths = async (req, res) => {
  try {
    // Find all movies that are ready or have HLS content
    const movies = await Movie.find({
      $or: [
        { "contentFiles.type": "hls" },
        { status: "ready" }
      ]
    });

    const results = {
      total: movies.length,
      updated: 0,
      skipped: 0,
      errors: []
    };

    for (const movie of movies) {
      try {
        const movieId = movie._id.toString();
        let needsUpdate = false;
        let updatedContentFiles = [...movie.contentFiles];

        // Check if movie has HLS files
        const hasHlsFiles = movie.contentFiles.some(f => f.type === "hls");

        if (hasHlsFiles) {
          // Case 1: Has HLS files but using old slug-based paths
          updatedContentFiles = movie.contentFiles.map(file => {
            if (file.type === "hls") {
              // Check if path contains slug pattern (not movieId)
              if (file.path.includes(`/hls/${movie.slug}/`)) {
                needsUpdate = true;
                // Replace slug with movieId
                return {
                  ...file.toObject(),
                  path: file.path.replace(`/hls/${movie.slug}/`, `/hls/${movieId}/`)
                };
              }
            }
            return file;
          });
        } else if (movie.status === "ready") {
          // Case 2: Status is "ready" but no HLS entries - add them
          needsUpdate = true;
          const hlsBasePath = `/hls/${movieId}`;

          // Keep existing files (like mp4) and add HLS entries
          updatedContentFiles = [
            ...movie.contentFiles.filter(f => f.type !== "hls"),
            { type: "hls", path: `${hlsBasePath}/master.m3u8`, quality: "master" },
            { type: "hls", path: `${hlsBasePath}/1080p/index.m3u8`, quality: "1080p" },
            { type: "hls", path: `${hlsBasePath}/720p/index.m3u8`, quality: "720p" },
            { type: "hls", path: `${hlsBasePath}/480p/index.m3u8`, quality: "480p" }
          ];
        }

        if (needsUpdate) {
          // Update hlsFolder as well
          const newHlsFolder = `/hls/${movieId}`;

          await Movie.findByIdAndUpdate(movieId, {
            contentFiles: updatedContentFiles,
            hlsFolder: newHlsFolder
          });

          results.updated++;
          console.log(`✅ Migrated: ${movie.title} (${movie.slug} → ${movieId})`);
        } else {
          results.skipped++;
        }
      } catch (err) {
        results.errors.push({
          movieId: movie._id,
          title: movie.title,
          error: err.message
        });
        console.error(`❌ Failed to migrate ${movie.title}:`, err);
      }
    }

    res.json({
      success: true,
      message: "Migration completed",
      results
    });
  } catch (err) {
    console.error("Migration error:", err);
    res.status(500).json({ success: false, message: "Migration failed: " + err.message });
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

// ====================== STREAM MP4 WITH RANGE SUPPORT ======================
export const streamMP4 = async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    // Find MP4 file
    const mp4File = movie.contentFiles.find(f => f.type === "mp4");
    if (!mp4File) {
      return res.status(404).json({ success: false, message: "MP4 file not found" });
    }

    // Construct file path
    const REMOTE_MEDIA_ROOT = process.env.REMOTE_MEDIA_ROOT || "/media/DATA/kowflix";
    const filePath = `${REMOTE_MEDIA_ROOT}${mp4File.path.replace('/media', '')}`;

    // Check if file exists (using fs from 'fs/promises')
    const fsSync = await import('fs');
    const stat = await fs.stat(filePath);
    const fileSize = stat.size;

    // Parse Range header
    const range = req.headers.range;

    if (!range) {
      // No range requested, send entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fsSync.default.createReadStream(filePath).pipe(res);
    } else {
      // Range requested
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, head);
      const stream = fsSync.default.createReadStream(filePath, { start, end });
      stream.pipe(res);
    }
  } catch (error) {
    console.error("Stream MP4 error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ====================== GET FILTER OPTIONS (Countries, etc.) ======================
export const getFilterOptions = async (req, res) => {
  try {
    const countries = await Movie.distinct("countries");
    const genres = await Movie.distinct("genres");

    res.json({
      success: true,
      data: {
        countries: countries.filter(c => c).sort(),
        genres: genres.filter(g => g).sort()
      }
    });
  } catch (err) {
    console.error("Get filter options error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
