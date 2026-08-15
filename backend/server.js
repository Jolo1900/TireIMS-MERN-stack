import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import connectDB from "./config/db.js";
import productRoutes from "./routes/productRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { seedDefaultUsers } from "./controllers/authController.js";
import { seedDefaultProducts } from "./controllers/productController.js";

dotenv.config();

const app = express();

// Enable trust proxy for Vercel/Railway reverse proxies & rate limiting
app.set("trust proxy", 1);

// Global Explicit CORS Middleware (handles preflight OPTIONS immediately with 204)
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

  // Handle preflight OPTIONS request immediately
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());

// Server DB Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection middleware error:", err.message);
    res.status(500).json({ message: "Database connection failed: " + err.message });
  }
});

// Dual-mount routes for both /api/* and direct /* paths
app.use("/api/products", productRoutes);
app.use("/products", productRoutes);

app.use("/api/suppliers", supplierRoutes);
app.use("/suppliers", supplierRoutes);

app.use("/api/transactions", transactionRoutes);
app.use("/transactions", transactionRoutes);

app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("tireIMS backend is running");
});

const PORT = process.env.PORT || 5000;

// Connect DB & start server binding to 0.0.0.0 for Railway / persistent servers
if (!process.env.VERCEL) {
  connectDB().then(async () => {
    await seedDefaultUsers();
    await seedDefaultProducts();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch((err) => {
    console.error("Failed to start server:", err.message);
  });
}

export default app;