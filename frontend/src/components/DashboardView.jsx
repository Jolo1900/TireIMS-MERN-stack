import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Boxes, DollarSign, AlertTriangle, XCircle, TrendingUp, BarChart2 } from "lucide-react";
import { getProducts } from "../api/productApi";
import { getTransactions } from "../api/transactionApi";

function DashboardView({ setActiveTab }) {
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await getProducts();
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    },
  });

  const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const res = await getTransactions();
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const products = productsData || [];
  const transactions = transactionsData || [];
  const loading = loadingProducts || loadingTransactions;

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
        Loading real-time dashboard metrics...
      </div>
    );
  }

  // Calculate required 4 KPI statistics
  const totalItems = products.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const totalCostValue = products.reduce((acc, p) => acc + ((p.quantity || 0) * (p.costPrice || 0)), 0);
  const totalSalesValue = products.reduce((acc, p) => acc + ((p.quantity || 0) * (p.sellingPrice || 0)), 0);
  
  const lowStockProducts = products.filter(
    (p) => (p.quantity || 0) > 0 && (p.quantity || 0) <= (p.lowStockThreshold || 5)
  );
  const outOfStockProducts = products.filter((p) => (p.quantity || 0) === 0);

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
    .slice(0, 5);

  const maxBrandQuantity = Math.max(...Object.values(brandData), 1);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val || 0);
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title-area">
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Real-time inventory metrics, stock alerts, and brand distribution</p>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="kpis-grid">
        {/* KPI 1: Total Items Count */}
        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
            <Boxes size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Total Items Count</span>
            <span className="kpi-value">{totalItems} <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--text-muted)" }}>units</span></span>
          </div>
        </div>

        {/* KPI 2: Total Inventory Value ($/₱) */}
        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
            <DollarSign size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Total Inventory Value</span>
            <span className="kpi-value">{formatCurrency(totalCostValue)}</span>
          </div>
        </div>

        {/* KPI 3: Low Stock Alerts Count */}
        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container" style={{ backgroundColor: "var(--warning-bg)", color: "var(--warning)" }}>
            <AlertTriangle size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Low Stock Alerts</span>
            <span className="kpi-value" style={{ color: lowStockProducts.length > 0 ? "var(--warning)" : "inherit" }}>
              {lowStockProducts.length} <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--text-muted)" }}>items</span>
            </span>
          </div>
        </div>

        {/* KPI 4: Out of Stock Count */}
        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
            <XCircle size={24} />
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Out of Stock</span>
            <span className="kpi-value" style={{ color: outOfStockProducts.length > 0 ? "var(--danger)" : "inherit" }}>
              {outOfStockProducts.length} <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--text-muted)" }}>items</span>
            </span>
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
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertTriangle size={18} style={{ color: "var(--warning)" }} />
                <span>Critical Stock Warnings</span>
              </span>
              {stockAlerts.length > 0 && (
                <span className="alert-badge alert-badge-danger">
                  {stockAlerts.length} Action Needed
                </span>
              )}
            </div>

            {stockAlerts.length === 0 ? (
              <p style={{ color: "var(--success)", fontSize: "0.9rem", fontWeight: "500", padding: "0.5rem 0" }}>
                ✓ All items are healthy. No stock warnings.
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
                    style={{ marginTop: "0.5rem", width: "100%" }}
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
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <TrendingUp size={18} style={{ color: "var(--primary)" }} />
                <span>Recent Stock Movements</span>
              </span>
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
              <>
                <div className="table-responsive desktop-table-wrapper">
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

                {/* Mobile Recent Activities Card Fallback */}
                <div className="mobile-card-grid" style={{ display: "none" }}>
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx._id} style={{ padding: "0.75rem", borderBottom: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{tx.productName}</span>
                        <span className={`stock-tag ${tx.type === "Restock" ? "stock-tag-ok" : tx.type === "Sale" ? "stock-tag-out" : "stock-tag-low"}`}>
                          {tx.type}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        <span>{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <strong style={{ color: tx.quantity < 0 ? "var(--danger)" : "var(--success)" }}>
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} pcs
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Brand Breakdown Chart */}
        <div className="glass-panel">
          <div className="section-title">
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BarChart2 size={18} style={{ color: "var(--primary)" }} />
              <span>Top Brand Market Share</span>
            </span>
          </div>

          {products.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>No items to display brand breakdown.</p>
          ) : (
            <div className="brand-breakdown-list">
              {sortedBrands.map(([brand, qty]) => {
                const percentage = Math.round((qty / (totalItems || 1)) * 100) || 0;
                return (
                  <div key={brand} className="brand-bar-row">
                    <div className="brand-bar-info">
                      <span style={{ fontWeight: 600 }}>{brand}</span>
                      <span style={{ color: "var(--text-muted)" }}>{qty} pcs ({percentage}%)</span>
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
