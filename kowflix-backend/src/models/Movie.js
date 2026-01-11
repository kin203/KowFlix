// // src/models/Movie.js
// import mongoose from "mongoose";

// const ContentFileSchema = new mongoose.Schema({
//   type: { type: String, enum: ["hls", "mp4"], required: true },
//   path: { type: String, required: true }, // relative path or URL served by nginx
//   quality: { type: String, enum: ["1080p","720p","480p","360p"], default: "720p" },
//   filesize: { type: Number, default: 0 } // in bytes (optional)
// }, { _id: false });

// const MovieSchema = new mongoose.Schema({
//   title: { type: String, required: true, index: "text" },
//   slug: { type: String, required: true, unique: true, index: true },
//   description: { type: String, default: "" },
//   genres: { type: [String], default: [] },
//   tags: { type: [String], default: [] },
//   poster: { type: String, default: "" },       // url/path
//   background: { type: String, default: "" },   // url/path
//   duration: { type: Number, default: 0 },      // seconds
//   releaseYear: { type: Number },
//   contentFiles: { type: [ContentFileSchema], default: [] },
//   thumbnails: { type: [String], default: [] },
//   createdAt: { type: Date, default: Date.now }
// });

// // text index for search
// MovieSchema.index({ title: "text", description: "text", genres: "text", tags: "text" });

// export default mongoose.models.Movie || mongoose.model("Movie", MovieSchema);


// src/models/Movie.js
// src/models/Movie.js
import mongoose from "mongoose";

const ContentFileSchema = new mongoose.Schema({
  type: { type: String, enum: ["hls", "mp4"], required: true },
  path: { type: String, required: true },
  quality: { type: String, enum: ["1080p", "720p", "480p", "360p", "master"], default: "720p" },
  filesize: { type: Number, default: 0 }
}, { _id: false });

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true, index: "text" }, // Default (Vietnamese)
  title_en: { type: String, default: "" }, // English Title
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: "" }, // Default (Vietnamese)
  description_en: { type: String, default: "" }, // English Description
  genres: { type: [String], default: [] },
  countries: { type: [String], default: [] }, // NEW: production countries
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  poster: { type: String, default: "" },
  lqip: { type: String, default: "" }, // Low Quality Image Placeholder (blur, tiny)
  backdrop: { type: String, default: "" }, // NEW: backdrop image
  duration: { type: Number, default: 0 },
  releaseYear: { type: Number },

  // TMDb metadata
  tmdbId: { type: Number }, // TMDb movie ID
  imdbId: { type: String }, // IMDb ID
  imdbRating: { type: Number }, // Vote average from TMDb (0-10)
  runtime: { type: Number }, // Runtime in minutes
  releaseDate: { type: Date }, // Full release date
  cast: [{
    name: { type: String },
    profile_path: { type: String } // TMDb profile image path
  }],
  director: { type: String }, // Director name
  voteAverage: { type: Number }, // TMDb vote average
  voteCount: { type: Number }, // TMDb vote count
  tagline: { type: String }, // Movie tagline
  trailerKey: { type: String, default: "" }, // YouTube trailer key from TMDb
  useTrailer: { type: Boolean, default: true }, // Toggle to enable/disable trailer

  // Views
  views: { type: Number, default: 0 },

  // trạng thái encode
  status: { type: String, enum: ["draft", "processing", "ready", "error"], default: "draft" },
  hlsFolder: { type: String, default: "" }, // ví dụ: /media/hls/<movieId>/
  thumbnails: { type: [String], default: [] },

  contentFiles: { type: [ContentFileSchema], default: [] },

  // Subtitles
  subtitles: [{
    language: { type: String, required: true }, // 'en', 'vi', etc.
    label: { type: String, required: true }, // 'English', 'Tiếng Việt'
    path: { type: String, required: true }, // Path to .vtt file
    default: { type: Boolean, default: false } // Default subtitle track
  }],

  createdAt: { type: Date, default: Date.now }
});

MovieSchema.index({ title: "text", description: "text", genres: "text" });

export default mongoose.models.Movie || mongoose.model("Movie", MovieSchema);
