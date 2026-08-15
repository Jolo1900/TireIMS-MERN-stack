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
connectDB().then(() => {
  // Seed default admin/cashier credentials & tire inventory products
  seedDefaultUsers();
  seedDefaultProducts();
});

const app = express();

// Enable CORS before Helmet so cross-origin requests are authorized
app.use(cors({
  origin: true,
  credentials: true
}));

// Configure Helmet for API & Cross-Origin resource sharing compatibility
app.use(helmet({
  crossOriginResourcePolicy: false
}));

app.use(express.json());

app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
   res.send("tireIMS backend is running"); 
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});