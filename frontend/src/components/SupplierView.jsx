import React, { useEffect, useState } from "react";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../api/supplierApi";

function SupplierView() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  });

  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchSuppliersList();
  }, []);

  const fetchSuppliersList = async () => {
    try {
      setLoading(true);
      const res = await getSuppliers();
      const items = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.data || [];
      setSuppliers(items);
    } catch (error) {
      showNotice("error", "Failed to fetch suppliers.");
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showNotice("error", "Supplier Name is required.");
      return;
    }

    try {
      if (isEditing) {
        await updateSupplier(currentId, formData);
        showNotice("success", "Supplier updated successfully.");
      } else {
        await createSupplier(formData);
        showNotice("success", "Supplier added successfully.");
      }
      
      resetForm();
      fetchSuppliersList();
    } catch (error) {
      const errMsg = error.response?.data?.message || "An error occurred.";
      showNotice("error", errMsg);
    }
  };

  const handleEditClick = (supplier) => {
    setIsEditing(true);
    setCurrentId(supplier._id);
    setFormData({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
    });
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this supplier?")) {
      return;
    }

    try {
      await deleteSupplier(id);
      showNotice("success", "Supplier deleted.");
      fetchSuppliersList();
    } catch (error) {
      showNotice("error", "Failed to delete supplier.");
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
    });
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title-area">
          <h1 className="page-title">Supplier Management</h1>
          <p className="page-subtitle">Add and configure tire suppliers</p>
        </div>
      </div>

      {notification && (
        <div className={`notification-banner notification-banner-${notification.type}`}>
          <span>{notification.text}</span>
          <button
            onClick={() => setNotification(null)}
            style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}
          >
            ×
          </button>
        </div>
      )}

      <div className="dashboard-details-layout">
        {/* Suppliers List Table */}
        <div className="glass-panel">
          <div className="section-title">
            <span>🤝 Supplier Directory</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500" }}>
              Total: {suppliers.length}
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>Loading suppliers...</div>
          ) : suppliers.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
              No suppliers added yet. Fill out the form to add one.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Supplier Name</th>
                    <th>Contact Person</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((supplier) => (
                    <tr key={supplier._id}>
                      <td style={{ fontWeight: "600" }}>{supplier.name}</td>
                      <td>{supplier.contactPerson || "—"}</td>
                      <td>{supplier.phone || "—"}</td>
                      <td>{supplier.email || "—"}</td>
                      <td>{supplier.address || "—"}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEditClick(supplier)}
                            className="btn btn-secondary btn-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(supplier._id)}
                            className="btn btn-danger btn-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Supplier Card Form */}
        <div className="glass-panel">
          <div className="section-title">
            <span>{isEditing ? "📝 Edit Supplier" : "➕ Add New Supplier"}</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>Supplier Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Goodyear Distribution"
                className="form-control"
                required
              />
            </div>

            <div className="form-field">
              <label>Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="form-control"
              />
            </div>

            <div className="form-field">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +1 555-0199"
                className="form-control"
              />
            </div>

            <div className="form-field">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. orders@goodyear.com"
                className="form-control"
              />
            </div>

            <div className="form-field">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. 100 Main St, Akron, OH"
                className="form-control"
                rows="3"
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
              <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>
                {isEditing ? "Save Changes" : "Create Supplier"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default SupplierView;
