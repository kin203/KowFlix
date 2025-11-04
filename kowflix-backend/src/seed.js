// src/seed.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import Movie from "./models/Movie.js";

dotenv.config();

const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/kowflix";

const sampleMovies = [
  {
    title: "Sample Movie One",
    slug: "sample-movie-one",
    description: "Demo movie 1 - short description",
    genres: ["Drama"],
    tags: ["demo","sample"],
    poster: "/media/posters/sample1.jpg",
    background: "/media/backgrounds/sample1.jpg",
    duration: 7200,
    releaseYear: 2020,
    contentFiles: [
      { type: "hls", path: "/media/hls/sample1/index.m3u8", quality: "720p" },
      { type: "mp4", path: "/media/mp4/sample1.mp4", quality: "720p" }
    ],
    thumbnails: ["/media/thumbs/sample1-1.jpg"]
  },
  {
    title: "Sample Movie Two",
    slug: "sample-movie-two",
    description: "Demo movie 2 - short description",
    genres: ["Action"],
    tags: ["demo","action"],
    poster: "/media/posters/sample2.jpg",
    background: "/media/backgrounds/sample2.jpg",
    duration: 5400,
    releaseYear: 2021,
    contentFiles: [
      { type: "hls", path: "/media/hls/sample2/index.m3u8", quality: "720p" }
    ],
    thumbnails: ["/media/thumbs/sample2-1.jpg"]
  }
];

async function runSeed() {
  try {
    await mongoose.connect(MONGO, {});

    console.log("Connected to MongoDB:", MONGO);

    // clear (optional) - comment if you don't want to drop
    // await User.deleteMany({});
    // await Movie.deleteMany({});

    // create admin user if not exists
    const adminEmail = "admin@kowflix.local";
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash("password123", salt);
      const admin = new User({
        email: adminEmail,
        passwordHash: hash,
        role: "admin",
        profile: { name: "KowFlix Admin" }
      });
      await admin.save();
      console.log("Created admin:", adminEmail);
    } else {
      console.log("Admin exists, skip creation:", adminEmail);
    }

    // insert sample movies if not exists
    for (const m of sampleMovies) {
      const found = await Movie.findOne({ slug: m.slug });
      if (!found) {
        await Movie.create(m);
        console.log("Inserted movie:", m.slug);
      } else {
        console.log("Movie exists, skip:", m.slug);
      }
    }

    console.log("Seed finished.");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    process.exit(1);
  }
}

runSeed();
