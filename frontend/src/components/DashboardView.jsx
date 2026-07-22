import React, { useEffect, useState } from "react";
import { getProducts } from "../api/productApi";
import { getTransactions } from "../api/transactionApi";

function DashboardView({ setActiveTab }) {
  const [products, setProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [prodRes, txRes] = await Promise.all([
          getProducts(),
          getTransactions(),
        ]);
        setProducts(prodRes.data);
        setTransactions(txRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>Loading dashboard details...</div>;
  }

  // Calculate statistics
  const totalItems = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const totalCostValue = products.reduce((acc, p) => acc + ((p.quantity || 0) * (p.costPrice || 0)), 0);
  const totalSalesValue = products.reduce((acc, p) => acc + ((p.quantity || 0) * (p.sellingPrice || 0)), 0);
  const expectedProfit = totalSalesValue - totalCostValue;

  // Identify low stock or out of stock products
  const stockAlerts = products.filter(
    (p) => (p.quantity || 0) <= (p.lowStockThreshold || 5)
  );

  // Group by brands for breakdown
  const brandData = {};
  products.forEach((p) => {
    const brand = p.brand || "Unknown";
    brandData[brand] = (brandData[brand] || 0) + (p.quantity || 0);
  });

  const sortedBrands = Object.entries(brandData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // top 5 brands

  const maxBrandQuantity = Math.max(...Object.values(brandData), 1);

  // Format currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title-area">
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Real-time stats and metrics for your tire inventory</p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="kpis-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
            📦
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Total Tires In Stock</span>
            <span className="kpi-value">{totalItems}</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
            💰
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Inventory Cost</span>
            <span className="kpi-value">{formatCurrency(totalCostValue)}</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container" style={{ backgroundColor: "rgba(167, 139, 250, 0.15)", color: "#a78bfa" }}>
            📈
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Potential Revenue</span>
            <span className="kpi-value">{formatCurrency(totalSalesValue)}</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container" style={{ backgroundColor: "var(--warning-bg)", color: "var(--warning)" }}>
            💵
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Expected Profit</span>
            <span className="kpi-value">{formatCurrency(expectedProfit)}</span>
          </div>
        </div>
      </div>

      {/* Main dashboard columns */}
      <div className="dashboard-details-layout">
        {/* Left Side: Recent Transactions & Alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Alerts Box */}
          <div className="glass-panel">
            <div className="section-title">
              <span>⚠️ Critical Stock Alerts</span>
              {stockAlerts.length > 0 && (
                <span className="alert-badge alert-badge-danger">
                  {stockAlerts.length} Action Needed
                </span>
              )}
            </div>

            {stockAlerts.length === 0 ? (
              <p style={{ color: "var(--success)", fontSize: "0.9rem", fontWeight: "500" }}>
                ✓ All items are healthy. No low stock warnings.
              </p>
            ) : (
              <div className="alert-list">
                {stockAlerts.slice(0, 4).map((item) => (
                  <div key={item._id} className={`alert-item ${item.quantity === 0 ? "" : "warning-item"}`}>
                    <div>
                      <div className="alert-item-title">
                        {item.brand} {item.name} ({item.size})
                      </div>
                      <div className="alert-item-desc">
                        Supplier: {item.supplier || "N/A"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="stock-tag" style={{
                        backgroundColor: item.quantity === 0 ? "var(--danger-bg)" : "var(--warning-bg)",
                        color: item.quantity === 0 ? "var(--danger)" : "var(--warning)"
                      }}>
                        {item.quantity === 0 ? "Out of Stock" : `${item.quantity} Left (Low)`}
                      </span>
                    </div>
                  </div>
                ))}
                {stockAlerts.length > 4 && (
                  <button
                    onClick={() => setActiveTab("inventory")}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: "0.5rem" }}
                  >
                    View All {stockAlerts.length} Warnings
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recent transactions log */}
          <div className="glass-panel">
            <div className="section-title">
              <span>🔄 Recent Activities</span>
              <button
                onClick={() => setActiveTab("transactions")}
                className="btn btn-secondary btn-sm"
              >
                Full logs
              </button>
            </div>

            {transactions.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No stock movements recorded yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Product</th>
                      <th>Action</th>
                      <th>Qty Change</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map((tx) => (
                      <tr key={tx._id}>
                        <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                          {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ fontWeight: "600" }}>{tx.productName}</td>
                        <td>
                          <span className={`stock-tag ${
                            tx.type === "Restock" ? "stock-tag-ok" : tx.type === "Sale" ? "stock-tag-out" : "stock-tag-low"
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: "bold", color: tx.quantity < 0 ? "var(--danger)" : "var(--success)" }}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{tx.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Brand Breakdown Chart */}
        <div className="glass-panel">
          <div className="section-title">
            <span>📊 Top Brands Share</span>
          </div>

          {products.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No items to display brand breakdown.</p>
          ) : (
            <div className="brand-breakdown-list">
              {sortedBrands.map(([brand, qty]) => {
                const percentage = Math.round((qty / totalItems) * 100) || 0;
                return (
                  <div key={brand} className="brand-bar-row">
                    <div className="brand-bar-info">
                      <span>{brand}</span>
                      <span style={{ fontWeight: "600" }}>{qty} pcs ({percentage}%)</span>
                    </div>
                    <div className="brand-bar-container">
                      <div
                        className="brand-bar-fill"
                        style={{ width: `${(qty / maxBrandQuantity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default DashboardView;
