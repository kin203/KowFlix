// src/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: "Email exists" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const user = await User.create({ email, passwordHash: hash, profile: { name } });
    const token = signToken(user);
    res.json({ success: true, data: { user: { id: user._id, email: user.email }, token } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = signToken(user);
    res.json({ success: true, data: { user: { id: user._id, email: user.email }, token } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
