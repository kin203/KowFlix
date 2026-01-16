// src/models/User.js
import mongoose from "mongoose";

const ProfileSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  avatar: { type: String, default: "" },
  avatarPublicId: { type: String, default: "" }, // For Cloudinary deletion
  bio: { type: String, default: "" }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  profile: { type: ProfileSchema, default: () => ({}) },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
  lastActive: { type: Date, default: Date.now },
  loginCount: { type: Number, default: 0 },
  totalWatchTime: { type: Number, default: 0 }, // in minutes
  mobileSettings: {
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' }
  },
  pushTokens: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
