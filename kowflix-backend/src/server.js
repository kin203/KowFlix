import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
// Routes
import movieRoutes from "./routes/movieRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
// Routes
app.use("/api/movies", movieRoutes);
app.use("/api/auth", authRoutes);

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Sample route
app.get("/", (req, res) => res.send("KowFlix API running..."));

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`🚀 Server listening on port ${port}`));
