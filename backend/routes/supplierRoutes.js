import express from "express";
import {
  getSuppliers,
  createSupplier,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// All supplier actions are restricted to Admins only
router.use(protect);
router.use(adminOnly);

router.get("/", getSuppliers);
router.post("/", createSupplier);
router.get("/:id", getSupplierById);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

export default router;
