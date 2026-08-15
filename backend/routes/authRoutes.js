import express from "express";
import rateLimit from "express-rate-limit";
import { loginUser } from "../controllers/authController.js";

const router = express.Router();

// Rate Limiter: Safe for proxy/serverless environments like Vercel and Railway
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 attempts
  message: { message: "Too many login attempts from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

router.post("/login", loginLimiter, loginUser);

export default router;
