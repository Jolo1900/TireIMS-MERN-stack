import React, { useEffect, useState } from "react";
import { createTransaction } from "../api/transactionApi";

function StockActionModal({ isOpen, onClose, product, onTransactionRecorded }) {
  const [formData, setFormData] = useState({
    type: "Restock",
    quantity: "",
    direction: "add",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFormData({
      type: "Restock",
      quantity: "",
      direction: "add",
      notes: "",
    });
    setError("");
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const qtyNum = Number(formData.quantity);
    if (!formData.quantity || isNaN(qtyNum) || qtyNum <= 0) {
      setError("Please enter a valid quantity greater than 0.");
      return;
    }

    // Additional validations
    if (formData.type === "Sale" && product.quantity < qtyNum) {
      setError(`Cannot complete sale: Insufficient stock. Only ${product.quantity} units available.`);
      return;
    }

    if (formData.type === "Adjustment" && formData.direction === "subtract" && product.quantity < qtyNum) {
      setError(`Cannot adjust stock down: Only ${product.quantity} units available.`);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        productId: product._id,
        type: formData.type,
        quantity: qtyNum,
        direction: formData.type === "Adjustment" ? formData.direction : undefined,
        notes: formData.notes,
      };

      await createTransaction(payload);
      
      onTransactionRecorded();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to record transaction.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3 className="modal-title">🔄 Stock Movement: {product.brand} {product.name}</h3>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: "1rem", backgroundColor: "var(--primary-light)", padding: "0.75rem", borderRadius: "8px", fontSize: "0.85rem" }}>
              <strong>Current Stock:</strong> {product.quantity} units
              <br />
              <strong>Size:</strong> {product.size}
            </div>

            {error && (
              <div className="notification-banner notification-banner-error" style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}>
                <span>{error}</span>
              </div>
            )}

            <div className="form-field">
              <label>Movement Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Restock">📈 Restock (Stock In)</option>
                <option value="Sale">📉 Sale (Stock Out)</option>
                <option value="Adjustment">🔧 Inventory Adjustment</option>
              </select>
            </div>

            {formData.type === "Adjustment" && (
              <div className="form-field">
                <label>Adjustment Direction</label>
                <div style={{ display: "flex", gap: "1rem", marginTop: "4px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer", fontWeight: "normal" }}>
                    <input
                      type="radio"
                      name="direction"
                      value="add"
                      checked={formData.direction === "add"}
                      onChange={handleChange}
                    />
                    Add (+)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer", fontWeight: "normal" }}>
                    <input
                      type="radio"
                      name="direction"
                      value="subtract"
                      checked={formData.direction === "subtract"}
                      onChange={handleChange}
                    />
                    Subtract (-)
                  </label>
                </div>
              </div>
            )}

            <div className="form-field">
              <label>Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="Enter amount"
                className="form-control"
                min="1"
                required
              />
            </div>

            <div className="form-field">
              <label>Transaction Notes / Reason</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="e.g. Restocked Goodyear shipment, Sale invoice #1023, Found damaged during count"
                className="form-control"
                rows="3"
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Recording..." : "Record Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StockActionModal;
