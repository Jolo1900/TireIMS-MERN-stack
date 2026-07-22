import React from "react";

function ProductTable({ products, onEdit, onDelete, onStockAction, user }) {
  // Format currency helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);
  };

  const getStockStatusTag = (qty, threshold = 5) => {
    if (qty <= 0) {
      return <span className="stock-tag stock-tag-out">Out of Stock</span>;
    }
    if (qty <= threshold) {
      return <span className="stock-tag stock-tag-low">{qty} units (Low)</span>;
    }
    return <span className="stock-tag stock-tag-ok">{qty} units (OK)</span>;
  };

  const isAdmin = user?.role === "Admin";

  return (
    <div className="table-responsive">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Tire Details</th>
            <th>Brand</th>
            <th>Size</th>
            <th>Stock Status</th>
            <th>Cost Price</th>
            <th>Selling Price</th>
            <th>Supplier</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id}>
              <td>
                <div style={{ fontWeight: "600" }}>{product.name}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Category: {product.category || "Tire"}
                </div>
              </td>
              <td>{product.brand}</td>
              <td style={{ fontFamily: "monospace", fontSize: "0.95rem" }}>{product.size}</td>
              <td>{getStockStatusTag(product.quantity, product.lowStockThreshold)}</td>
              <td>{formatCurrency(product.costPrice)}</td>
              <td>{formatCurrency(product.sellingPrice)}</td>
              <td style={{ color: product.supplier ? "inherit" : "var(--text-muted)" }}>
                {product.supplier || "—"}
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    onClick={() => onStockAction(product)}
                    className="btn btn-secondary btn-sm"
                    title="Stock Movement"
                  >
                    🔄 Stock In/Out
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => onEdit(product)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Tire"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(product._id)}
                        className="btn btn-danger btn-sm"
                        title="Delete Product"
                      >
                        Delete
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
  );
}

export default ProductTable;