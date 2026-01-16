// src/routes/authRoutes.js
import express from "express";
import { register, login, changePassword } from "../controllers/authController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/change-password", auth, changePassword);

export default router;
