import express from "express";
import {
  getTransactions,
  createTransaction,
  createPosTransaction,
  deleteTransaction,
} from "../controllers/transactionController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getTransactions);
router.post("/", createTransaction);
router.post("/pos", createPosTransaction);

// Deleting transaction history logs is restricted to Admins only
router.delete("/:id", adminOnly, deleteTransaction);

export default router;
