// src/middleware/admin.js
export default function isAdmin(req, res, next) {
    // req.user được set bởi middleware auth (JWT)
    if (!req.user) return res.status(401).json({ success:false, message: "Not authenticated" });
    if (req.user.role !== "admin") return res.status(403).json({ success:false, message: "Admin only" });
    next();
  }
  