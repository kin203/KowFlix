// src/controllers/movieController.js
import fs from "fs/promises";
import path from "path";
import slugify from "slugify";
import Movie from "../models/Movie.js";
import Job from "../models/Job.js";
import { uploadPoster, uploadVideo, deleteMovieFiles } from "../utils/remoteUpload.js";
import { searchMovies, getMovieDetails, getMovieTrailer } from "../utils/tmdb.js";
import { triggerEncode } from "../utils/remoteEncode.js";

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

    // Debug logging
    console.log('📝 [CREATE MOVIE] Request received');
    console.log('📝 [CREATE MOVIE] Files:', req.files);
    console.log('📝 [CREATE MOVIE] Has video?', !!req.files?.video?.[0]);
    console.log('📝 [CREATE MOVIE] Has poster?', !!req.files?.poster?.[0]);

    try {
      // Handle poster: prioritize TMDb URL, fallback to file upload
      if (req.body.posterUrl) {
        // Use TMDb poster URL directly
        posterPath = req.body.posterUrl;
      } else if (req.files?.poster?.[0]) {
        // Upload poster to remote server
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

      // Upload video to remote server
      if (req.files?.video?.[0]) {
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

      // If video uploaded, trigger auto-encode
      if (videoPath) {
        movie.status = "processing";
        await movie.save();

        // Create encode job
        const encodeJob = await Job.create({
          type: 'encode',
          movieId: movie._id,
          movieTitle: movie.title,
          status: 'encoding',
          progress: 0
        });

        // Convert relative path to absolute path on remote server
        const REMOTE_MEDIA_ROOT = process.env.REMOTE_MEDIA_ROOT || "/media/DATA/kowflix";
        const absoluteVideoPath = `${REMOTE_MEDIA_ROOT}${videoPath.replace('/media', '')}`;

        // Trigger encode with movieId (server creates folder with movieId)
        triggerEncode(absoluteVideoPath, movieId, async (progress) => {
          // Update encode job progress in real-time
          try {
            await Job.findByIdAndUpdate(encodeJob._id, {
              progress: progress,
              status: progress >= 100 ? 'completed' : 'encoding'
            });
            console.log(`📊 Encode progress for ${movie.title}: ${progress}%`);
          } catch (err) {
            console.error('Failed to update job progress:', err);
          }
        })
          .then(async () => {
            console.log(`✅ Auto-encode completed for: ${movie.title} (${movieId})`);

            // Update encode job to completed
            await Job.findByIdAndUpdate(encodeJob._id, {
              status: 'completed',
              progress: 100,
              completedTime: new Date()
            });

            // Update movie with HLS paths (using movieId as folder name)
            const hlsBasePath = `/hls/${movieId}`;
            await Movie.findByIdAndUpdate(movieId, {
              status: "ready",
              hlsFolder: `/hls/${movieId}`,
              contentFiles: [
                ...movie.contentFiles.filter(f => f.type !== "hls"),
                { type: "hls", path: `${hlsBasePath}/master.m3u8`, quality: "master" },
                { type: "hls", path: `${hlsBasePath}/1080p/index.m3u8`, quality: "1080p" },
                { type: "hls", path: `${hlsBasePath}/720p/index.m3u8`, quality: "720p" },
                { type: "hls", path: `${hlsBasePath}/480p/index.m3u8`, quality: "480p" }
              ]
            });
            console.log(`✅ Movie ready: ${movie.title} (${movieId})`);
          })
          .catch(async (err) => {
            console.error(`❌ Auto-encode failed for ${movie.title} (${movieId}):`, err);

            // Update encode job to failed
            await Job.findByIdAndUpdate(encodeJob._id, {
              status: 'failed',
              error: err.message,
              completedTime: new Date()
            });

            Movie.findByIdAndUpdate(movieId, { status: "error" }).catch(e => console.error(e));
          });

        res.status(201).json({
          success: true,
          data: movie,
          message: "Movie uploaded successfully. Encoding started automatically."
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

    if (typeof payload.genres === "string") {
      payload.genres = payload.genres.split(",").map(s => s.trim());
    }

    // Handle useTrailer toggle
    if (payload.useTrailer !== undefined) {
      payload.useTrailer = payload.useTrailer === 'true' || payload.useTrailer === true;
    }

    // Handle poster: prioritize TMDb URL, fallback to file upload
    if (payload.posterUrl) {
      payload.poster = payload.posterUrl;
      delete payload.posterUrl; // Remove from payload to avoid storing duplicate
    } else if (req.files?.poster?.[0]) {
      payload.poster = `${mediaBase}/posters/${req.files.poster[0].filename}`;
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
        backdrop: movie.backdrop,
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
