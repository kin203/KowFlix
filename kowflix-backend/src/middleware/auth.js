// src/middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export default function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: "No token" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    // Update lastActive asynchronously (fire and forget)
    import("../models/User.js").then(({ default: User }) => {
      User.findByIdAndUpdate(decoded.id, { lastActive: new Date() }).catch(err => console.error("Update lastActive error", err));
    });

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalid" });
  }
}

// Export as 'protect' for compatibility
export const protect = auth;
