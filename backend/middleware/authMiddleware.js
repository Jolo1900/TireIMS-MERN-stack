import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "tireims_super_secret_key_2026";

// Verify authorization header token and populate req.user
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header: "Bearer <token>"
      token = req.headers.authorization.split(" ")[1];

      // Decode token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Fetch user from database and attach to request
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      next();
    } catch (error) {
      console.error("JWT validation error:", error.message);
      res.status(401).json({ message: "Not authorized, token validation failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, token is missing" });
  }
};

// Check if active user has Admin role
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Admin access only" });
  }
};
