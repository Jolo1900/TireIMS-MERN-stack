import React from "react";
import { Edit2, Trash2, RefreshCw, Plus, Minus, Package, Tag, Building2 } from "lucide-react";

function ProductTable({
  products,
  onEdit,
  onDelete,
  onStockAction,
  onQuickStockChange,
  density = "comfortable",
  user
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val || 0);
  };

  // Status Pill Badges with distinct styling
  const renderStatusPill = (qty, threshold = 5) => {
    if (qty <= 0) {
      return (
        <span
          className="stock-pill stock-pill-out"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "0.25rem 0.6rem",
            borderRadius: "9999px",
            fontSize: "0.75rem",
            fontWeight: 700,
            backgroundColor: "var(--danger-bg)",
            color: "var(--danger)",
            border: "1px solid rgba(239, 68, 68, 0.3)"
          }}
        >
          ● Out of Stock
        </span>
      );
    }
    if (qty <= threshold) {
      return (
        <span
          className="stock-pill stock-pill-low"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "0.25rem 0.6rem",
            borderRadius: "9999px",
            fontSize: "0.75rem",
            fontWeight: 700,
            backgroundColor: "var(--warning-bg)",
            color: "var(--warning)",
            border: "1px solid rgba(245, 158, 11, 0.3)"
          }}
        >
          ● Low Stock ({qty})
        </span>
      );
    }
    return (
      <span
        className="stock-pill stock-pill-ok"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "0.25rem 0.6rem",
          borderRadius: "9999px",
          fontSize: "0.75rem",
          fontWeight: 700,
          backgroundColor: "var(--success-bg)",
          color: "var(--success)",
          border: "1px solid rgba(16, 185, 129, 0.3)"
        }}
      >
        ● In Stock ({qty})
      </span>
    );
  };

  const isAdmin = user?.role === "Admin";
  const paddingY = density === "compact" ? "0.4rem" : "0.85rem";
  const paddingX = density === "compact" ? "0.6rem" : "1rem";
  const fontSize = density === "compact" ? "0.82rem" : "0.9rem";

  return (
    <>
      {/* Desktop & Tablet Virtualized Table View */}
      <div className="table-responsive desktop-table-wrapper" style={{ overflowX: "auto", position: "relative" }}>
        <table className="custom-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
          <thead>
            <tr>
              <th style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "var(--bg-app)", padding: `${paddingY} ${paddingX}` }}>
                Tire Product Details
              </th>
              <th style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "var(--bg-app)", padding: `${paddingY} ${paddingX}` }}>
                Brand
              </th>
              <th style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "var(--bg-app)", padding: `${paddingY} ${paddingX}` }}>
                Size Specification
              </th>
              <th style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "var(--bg-app)", padding: `${paddingY} ${paddingX}` }}>
                Stock Level
              </th>
              <th style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "var(--bg-app)", padding: `${paddingY} ${paddingX}` }}>
                Cost Price
              </th>
              <th style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "var(--bg-app)", padding: `${paddingY} ${paddingX}` }}>
                Selling Price
              </th>
              <th style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "var(--bg-app)", padding: `${paddingY} ${paddingX}` }}>
                Supplier
              </th>
              <th style={{ position: "sticky", top: 0, right: 0, zIndex: 11, backgroundColor: "var(--bg-app)", padding: `${paddingY} ${paddingX}`, boxShadow: "-4px 0 8px rgba(0,0,0,0.05)" }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} style={{ transition: "background 0.15s ease" }}>
                <td style={{ padding: `${paddingY} ${paddingX}`, fontSize }}>
                  <div style={{ fontWeight: 600, color: "var(--text-main)" }}>{product.name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    Category: {product.category || "Tire"}
                  </div>
                </td>
                <td style={{ padding: `${paddingY} ${paddingX}`, fontSize, fontWeight: 500 }}>{product.brand}</td>
                <td style={{ padding: `${paddingY} ${paddingX}`, fontSize, fontFamily: "monospace", fontWeight: 600 }}>{product.size}</td>
                <td style={{ padding: `${paddingY} ${paddingX}`, fontSize }}>
                  {renderStatusPill(product.quantity, product.lowStockThreshold)}
                </td>
                <td style={{ padding: `${paddingY} ${paddingX}`, fontSize }}>{formatCurrency(product.costPrice)}</td>
                <td style={{ padding: `${paddingY} ${paddingX}`, fontSize, fontWeight: 600, color: "var(--primary)" }}>
                  {formatCurrency(product.sellingPrice)}
                </td>
                <td style={{ padding: `${paddingY} ${paddingX}`, fontSize, color: product.supplier ? "inherit" : "var(--text-muted)" }}>
                  {product.supplier || "—"}
                </td>
                {/* Sticky Action Column */}
                <td
                  style={{
                    position: "sticky",
                    right: 0,
                    zIndex: 5,
                    backgroundColor: "var(--bg-app)",
                    padding: `${paddingY} ${paddingX}`,
                    boxShadow: "-4px 0 8px rgba(0,0,0,0.05)"
                  }}
                >
                  <div className="action-buttons" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {/* Quick +1 / -1 Stock Adjustments */}
                    <div style={{ display: "flex", gap: "2px", backgroundColor: "var(--border-color)", padding: "2px", borderRadius: "6px" }}>
                      <button
                        onClick={() => onQuickStockChange && onQuickStockChange(product, -1)}
                        disabled={product.quantity <= 0}
                        title="Quick Decrease -1"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "4px",
                          border: "none",
                          backgroundColor: "var(--bg-card)",
                          color: "var(--danger)",
                          cursor: product.quantity <= 0 ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: product.quantity <= 0 ? 0.5 : 1
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <button
                        onClick={() => onQuickStockChange && onQuickStockChange(product, 1)}
                        title="Quick Increase +1"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "4px",
                          border: "none",
                          backgroundColor: "var(--bg-card)",
                          color: "var(--success)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => onStockAction(product)}
                      className="btn btn-secondary btn-sm"
                      title="Custom Stock Movement"
                      style={{ padding: "0.35rem 0.6rem", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <RefreshCw size={14} />
                      <span>Adjust</span>
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => onEdit(product)}
                          className="btn btn-secondary btn-sm"
                          title="Edit Tire"
                          style={{ padding: "0.35rem 0.6rem", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(product._id)}
                          className="btn btn-danger btn-sm"
                          title="Delete Product"
                          style={{ padding: "0.35rem 0.6rem", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card View Fallback (<768px) */}
      <div className="mobile-card-grid" style={{ display: "none" }}>
        {products.map((product) => (
          <div
            key={product._id}
            className="glass-panel"
            style={{
              padding: "1rem",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              border: "1px solid var(--border-color)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)" }}>
                  {product.brand} {product.name}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Size: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{product.size}</span>
                </div>
              </div>
              {renderStatusPill(product.quantity, product.lowStockThreshold)}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
                backgroundColor: "var(--primary-light)",
                padding: "0.6rem",
                borderRadius: "8px",
                fontSize: "0.85rem"
              }}
            >
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Cost Price: </span>
                <span style={{ fontWeight: 500 }}>{formatCurrency(product.costPrice)}</span>
              </div>
              <div>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>Selling Price: </span>
                <span style={{ fontWeight: 700, color: "var(--primary)" }}>{formatCurrency(product.sellingPrice)}</span>
              </div>
            </div>

            {/* Touch Target Compliant Buttons (Min 44px Height) */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.25rem" }}>
              <div style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => onQuickStockChange && onQuickStockChange(product, -1)}
                  disabled={product.quantity <= 0}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-card)",
                    color: "var(--danger)",
                    cursor: product.quantity <= 0 ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Minus size={18} />
                </button>
                <button
                  onClick={() => onQuickStockChange && onQuickStockChange(product, 1)}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-card)",
                    color: "var(--success)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Plus size={18} />
                </button>
              </div>

              <button
                onClick={() => onStockAction(product)}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, height: "44px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <RefreshCw size={16} />
                <span>Adjust</span>
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => onEdit(product)}
                    className="btn btn-secondary btn-sm"
                    style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(product._id)}
                    className="btn btn-danger btn-sm"
                    style={{ width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default ProductTable;