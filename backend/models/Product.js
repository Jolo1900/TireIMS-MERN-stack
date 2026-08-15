import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "Tire",
    },

    size: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 0,
    },

    costPrice: {
      type: Number,
      required: true,
    },

    sellingPrice: {
      type: Number,
      required: true,
    },

    supplier: {
      type: String,
      default: "",
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text search index and single-field query indexes for high performance
productSchema.index({ name: "text", brand: "text", category: "text", size: "text" });
productSchema.index({ brand: 1, quantity: 1 });
productSchema.index({ quantity: 1 });
productSchema.index({ createdAt: -1 });

const Product = mongoose.model("Product", productSchema);

export default Product;