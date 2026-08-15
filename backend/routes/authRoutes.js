import express from "express";
import rateLimit from "express-rate-limit";
import { loginUser } from "../controllers/authController.js";

const router = express.Router();

// Rate Limiter: Limit to 10 login requests per 15 minutes per IP address to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per window
  message: { message: "Too many login attempts from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/login", loginLimiter, loginUser);

export default router;
