import express from "express";
import Movie from "../models/Movie.js";

const router = express.Router();

// [GET] /api/movies — danh sách phim
router.get("/", async (req, res) => {
  try {
    const { q, genre, page = 1, limit = 10 } = req.query;
    const query = {};

    if (q) query.$text = { $search: q };
    if (genre) query.genres = genre;

    const movies = await Movie.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, count: movies.length, data: movies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
