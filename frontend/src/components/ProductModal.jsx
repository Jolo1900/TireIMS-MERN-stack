import React, { useEffect, useState } from "react";
import { createProduct, updateProduct } from "../api/productApi";

function ProductModal({ isOpen, onClose, product, onProductSaved, suppliers }) {
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "Tire",
    size: "",
    quantity: 0,
    costPrice: "",
    sellingPrice: "",
    supplier: "",
    lowStockThreshold: 5,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        brand: product.brand || "",
        category: product.category || "Tire",
        size: product.size || "",
        quantity: product.quantity || 0,
        costPrice: product.costPrice || "",
        sellingPrice: product.sellingPrice || "",
        supplier: product.supplier || "",
        lowStockThreshold: product.lowStockThreshold || 5,
      });
    } else {
      setFormData({
        name: "",
        brand: "",
        category: "Tire",
        size: "",
        quantity: 0,
        costPrice: "",
        sellingPrice: "",
        supplier: "",
        lowStockThreshold: 5,
      });
    }
    setError("");
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" || name === "lowStockThreshold" ? Number(value) : value,
    }));
  };

  const handleSupplierChange = (e) => {
    const selectedSupplierName = e.target.value;
    const selectedSupplierObj = suppliers.find(s => s.name === selectedSupplierName);
    
    setFormData((prev) => ({
      ...prev,
      supplier: selectedSupplierName,
      supplierId: selectedSupplierObj ? selectedSupplierObj._id : null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!formData.name.trim() || !formData.brand.trim() || !formData.size.trim()) {
      setError("Please fill out all required fields: Name, Brand, Size.");
      return;
    }
    if (Number(formData.costPrice) <= 0 || Number(formData.sellingPrice) <= 0) {
      setError("Prices must be greater than 0.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (product) {
        // Edit Mode
        await updateProduct(product._id, formData);
      } else {
        // Create Mode
        await createProduct(formData);
      }

      onProductSaved();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save product.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">{product ? "📝 Edit Tire Info" : "➕ Add New Tire Product"}</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="notification-banner notification-banner-error" style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}>
                <span>{error}</span>
              </div>
            )}

            <div className="form-grid">
              <div className="form-field">
                <label>Tire Model Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Defender LTX"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-field">
                <label>Brand *</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="e.g. Michelin"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Size Specification *</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  placeholder="e.g. 265/70R17"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-field">
                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="Tire"
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Cost Price ($) *</label>
                <input
                  type="number"
                  name="costPrice"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="form-control"
                  required
                />
              </div>

              <div className="form-field">
                <label>Selling Price ($) *</label>
                <input
                  type="number"
                  name="sellingPrice"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>Initial Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="form-control"
                  disabled={!!product} // Disable quantity editing directly in Edit Mode (use Stock movements instead)
                />
                {product && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Use "Stock In/Out" to adjust stock levels.
                  </span>
                )}
              </div>

              <div className="form-field">
                <label>Low Stock Warning Threshold</label>
                <input
                  type="number"
                  name="lowStockThreshold"
                  value={formData.lowStockThreshold}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-field">
              <label>Supplier</label>
              <select
                name="supplier"
                value={formData.supplier}
                onChange={handleSupplierChange}
                className="form-control"
              >
                <option value="">-- Select Supplier (Optional) --</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : product ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductModal;
