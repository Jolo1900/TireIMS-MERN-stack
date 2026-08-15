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

// Security & Body Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json());

// Serverless DB Connection & Auto-Seed Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    await seedDefaultUsers();
    await seedDefaultProducts();
    next();
  } catch (err) {
    console.error("Serverless middleware error:", err.message);
    res.status(500).json({ message: "Database connection failed: " + err.message });
  }
});

// Dual-mount routes for both /api/* and direct /* paths (fixes Vercel rewrite URL stripping)
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

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;