import React, { useEffect, useState } from "react";
import { getTransactions } from "../api/transactionApi";
import { getProducts } from "../api/productApi";

function ReportsView() {
  const [reportType, setReportType] = useState("daily"); // daily, monthly, profit, inventory
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 30 days ago
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [txRes, prodRes] = await Promise.all([
        getTransactions(),
        getProducts(),
      ]);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : txRes.data?.items || txRes.data?.data || []);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.items || prodRes.data?.data || []);
    } catch (err) {
      console.error("Failed to load report data", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);
  };

  // Helper date matching
  const isSameDay = (d1, d2) => {
    return new Date(d1).toDateString() === new Date(d2).toDateString();
  };

  const isSameMonth = (d1, yyyyMmStr) => {
    const d = new Date(d1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}` === yyyyMmStr;
  };

  // 1. Daily Report Filter
  const dailySales = transactions.filter(
    (t) => t.type === "Sale" && isSameDay(t.createdAt, selectedDate)
  );

  // 2. Monthly Report Filter
  const monthlySales = transactions.filter(
    (t) => t.type === "Sale" && isSameMonth(t.createdAt, selectedMonth)
  );

  // 3. Profit Report Filter (Custom Date Range)
  const rangeTransactions = transactions.filter((t) => {
    const txDateStr = new Date(t.createdAt).toISOString().split('T')[0];
    return txDateStr >= startDate && txDateStr <= endDate;
  });

  const rangeSales = rangeTransactions.filter((t) => t.type === "Sale");
  const totalSalesRevenue = rangeSales.reduce((sum, t) => sum + (Math.abs(t.quantity) * t.sellingPrice), 0);
  const totalSalesCOGS = rangeSales.reduce((sum, t) => sum + (Math.abs(t.quantity) * t.costPrice), 0);
  const totalNetProfit = totalSalesRevenue - totalSalesCOGS;

  // 4. Inventory Report calculations
  const totalInventoryCost = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.costPrice || 0)), 0);
  const totalInventoryPotential = products.reduce((sum, p) => sum + ((p.quantity || 0) * (p.sellingPrice || 0)), 0);
  const totalInventoryProfit = totalInventoryPotential - totalInventoryCost;
  const outOfStockCount = products.filter((p) => (p.quantity || 0) <= 0).length;
  const lowStockCount = products.filter((p) => (p.quantity || 0) > 0 && (p.quantity || 0) <= (p.lowStockThreshold || 5)).length;

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title-area">
          <h1 className="page-title">Executive Reports</h1>
          <p className="page-subtitle">Analyze business health, sales performance, and profit margins</p>
        </div>
        <button onClick={handlePrintReport} className="btn btn-primary">
          🖨️ Print Report Page
        </button>
      </div>

      {/* Reports Navigation Tabs */}
      <div className="glass-panel filter-bar" style={{ gap: "0.5rem" }}>
        <button
          onClick={() => setReportType("daily")}
          className={`btn ${reportType === "daily" ? "btn-primary" : "btn-secondary"}`}
        >
          📅 Daily Sales
        </button>
        <button
          onClick={() => setReportType("monthly")}
          className={`btn ${reportType === "monthly" ? "btn-primary" : "btn-secondary"}`}
        >
          📆 Monthly Sales
        </button>
        <button
          onClick={() => setReportType("profit")}
          className={`btn ${reportType === "profit" ? "btn-primary" : "btn-secondary"}`}
        >
          💸 Profit Margins
        </button>
        <button
          onClick={() => setReportType("inventory")}
          className={`btn ${reportType === "inventory" ? "btn-primary" : "btn-secondary"}`}
        >
          📦 Inventory Status
        </button>
      </div>

      {/* Filters depending on Report Type */}
      <div className="glass-panel">
        {reportType === "daily" && (
          <div className="filter-group" style={{ maxWidth: "250px" }}>
            <label>Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-control"
            />
          </div>
        )}

        {reportType === "monthly" && (
          <div className="filter-group" style={{ maxWidth: "250px" }}>
            <label>Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-control"
            />
          </div>
        )}

        {reportType === "profit" && (
          <div className="filter-bar" style={{ padding: 0, border: "none", boxShadow: "none", backdropFilter: "none" }}>
            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-control"
              />
            </div>
            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-control"
              />
            </div>
          </div>
        )}

        {reportType === "inventory" && (
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            ✓ Displays real-time status of all products, total asset valuation, and stock alerts.
          </p>
        )}
      </div>

      {/* Render Selected Report View */}
      {loading ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "3rem" }}>Loading report parameters...</div>
      ) : (
        <div className="glass-panel">
          {/* DAILY SALES REPORT */}
          {reportType === "daily" && (
            <div>
              <div className="section-title">
                <span>Daily Sales Report: {selectedDate}</span>
                <span className="alert-badge alert-badge-danger" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
                  Total Orders: {dailySales.length}
                </span>
              </div>

              {dailySales.length === 0 ? (
                <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No sales recorded on this day.</p>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Product Details</th>
                        <th>Qty Sold</th>
                        <th>Price/Unit</th>
                        <th>Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySales.map((tx) => (
                        <tr key={tx._id}>
                          <td>{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td style={{ fontWeight: "600" }}>{tx.productName}</td>
                          <td style={{ fontWeight: "600" }}>{Math.abs(tx.quantity)}</td>
                          <td>{formatCurrency(tx.sellingPrice)}</td>
                          <td style={{ fontWeight: "700", color: "var(--primary)" }}>
                            {formatCurrency(Math.abs(tx.quantity) * tx.sellingPrice)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: "bold", backgroundColor: "rgba(148, 163, 184, 0.05)" }}>
                        <td colSpan="2">TOTALS</td>
                        <td>{dailySales.reduce((s, t) => s + Math.abs(t.quantity), 0)} pcs</td>
                        <td>—</td>
                        <td style={{ color: "var(--primary)" }}>
                          {formatCurrency(dailySales.reduce((sum, t) => sum + (Math.abs(t.quantity) * t.sellingPrice), 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* MONTHLY SALES REPORT */}
          {reportType === "monthly" && (
            <div>
              <div className="section-title">
                <span>Monthly Sales Report: {selectedMonth}</span>
                <span className="alert-badge alert-badge-danger" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
                  Total Orders: {monthlySales.length}
                </span>
              </div>

              {monthlySales.length === 0 ? (
                <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No sales recorded in this month.</p>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Product Details</th>
                        <th>Qty Sold</th>
                        <th>Price/Unit</th>
                        <th>Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlySales.map((tx) => (
                        <tr key={tx._id}>
                          <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td style={{ fontWeight: "600" }}>{tx.productName}</td>
                          <td style={{ fontWeight: "600" }}>{Math.abs(tx.quantity)}</td>
                          <td>{formatCurrency(tx.sellingPrice)}</td>
                          <td style={{ fontWeight: "700", color: "var(--primary)" }}>
                            {formatCurrency(Math.abs(tx.quantity) * tx.sellingPrice)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ fontWeight: "bold", backgroundColor: "rgba(148, 163, 184, 0.05)" }}>
                        <td colSpan="2">TOTALS</td>
                        <td>{monthlySales.reduce((s, t) => s + Math.abs(t.quantity), 0)} pcs</td>
                        <td>—</td>
                        <td style={{ color: "var(--primary)" }}>
                          {formatCurrency(monthlySales.reduce((sum, t) => sum + (Math.abs(t.quantity) * t.sellingPrice), 0))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PROFIT MARGIN REPORT */}
          {reportType === "profit" && (
            <div>
              <div className="section-title">
                <span>Profit & Loss analysis: {startDate} to {endDate}</span>
              </div>

              {/* Profit cards breakdown */}
              <div className="kpis-grid" style={{ marginBottom: "2rem" }}>
                <div className="glass-panel kpi-card" style={{ boxShadow: "none", border: "1px solid var(--border-color)" }}>
                  <div className="kpi-icon-container" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                    📈
                  </div>
                  <div className="kpi-details">
                    <span className="kpi-title">Gross Revenue</span>
                    <span className="kpi-value">{formatCurrency(totalSalesRevenue)}</span>
                  </div>
                </div>

                <div className="glass-panel kpi-card" style={{ boxShadow: "none", border: "1px solid var(--border-color)" }}>
                  <div className="kpi-icon-container" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
                    📉
                  </div>
                  <div className="kpi-details">
                    <span className="kpi-title">Cost of Goods (COGS)</span>
                    <span className="kpi-value">{formatCurrency(totalSalesCOGS)}</span>
                  </div>
                </div>

                <div className="glass-panel kpi-card" style={{ boxShadow: "none", border: "1px solid var(--border-color)" }}>
                  <div className="kpi-icon-container" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
                    💵
                  </div>
                  <div className="kpi-details">
                    <span className="kpi-title">Net Profit</span>
                    <span className="kpi-value" style={{ color: totalNetProfit >= 0 ? "var(--success)" : "var(--danger)" }}>
                      {formatCurrency(totalNetProfit)}
                    </span>
                  </div>
                </div>
              </div>

              {rangeSales.length === 0 ? (
                <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No transaction data within selected date range.</p>
              ) : (
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Product Details</th>
                        <th>Qty Sold</th>
                        <th>Cost Price</th>
                        <th>Sell Price</th>
                        <th>Est. Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rangeSales.map((tx) => {
                        const qty = Math.abs(tx.quantity);
                        const cogs = qty * tx.costPrice;
                        const rev = qty * tx.sellingPrice;
                        const profit = rev - cogs;
                        return (
                          <tr key={tx._id}>
                            <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                            <td style={{ fontWeight: "600" }}>{tx.productName}</td>
                            <td>{qty}</td>
                            <td>{formatCurrency(tx.costPrice)}</td>
                            <td>{formatCurrency(tx.sellingPrice)}</td>
                            <td style={{ fontWeight: "600", color: "var(--success)" }}>{formatCurrency(profit)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* INVENTORY STATUS REPORT */}
          {reportType === "inventory" && (
            <div>
              <div className="section-title">
                <span>Inventory Valuation Report</span>
              </div>

              <div className="kpis-grid" style={{ marginBottom: "2rem" }}>
                <div className="glass-panel kpi-card" style={{ boxShadow: "none", border: "1px solid var(--border-color)" }}>
                  <div className="kpi-details">
                    <span className="kpi-title">Total Valuation (Cost)</span>
                    <span className="kpi-value">{formatCurrency(totalInventoryCost)}</span>
                  </div>
                </div>
                <div className="glass-panel kpi-card" style={{ boxShadow: "none", border: "1px solid var(--border-color)" }}>
                  <div className="kpi-details">
                    <span className="kpi-title">Total Potential Revenue</span>
                    <span className="kpi-value">{formatCurrency(totalInventoryPotential)}</span>
                  </div>
                </div>
                <div className="glass-panel kpi-card" style={{ boxShadow: "none", border: "1px solid var(--border-color)" }}>
                  <div className="kpi-details">
                    <span className="kpi-title">Est. Markup Profit</span>
                    <span className="kpi-value">{formatCurrency(totalInventoryProfit)}</span>
                  </div>
                </div>
              </div>

              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Product Model</th>
                      <th>Brand</th>
                      <th>Size</th>
                      <th>Quantity</th>
                      <th>Cost Value</th>
                      <th>Retail Value</th>
                      <th>Low Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: "600" }}>{p.name}</td>
                        <td>{p.brand}</td>
                        <td style={{ fontFamily: "monospace" }}>{p.size}</td>
                        <td>
                          <span className={`stock-tag ${
                            p.quantity <= 0 ? "stock-tag-out" : p.quantity <= (p.lowStockThreshold || 5) ? "stock-tag-low" : "stock-tag-ok"
                          }`}>
                            {p.quantity} pcs
                          </span>
                        </td>
                        <td>{formatCurrency((p.quantity || 0) * (p.costPrice || 0))}</td>
                        <td>{formatCurrency((p.quantity || 0) * (p.sellingPrice || 0))}</td>
                        <td>{p.lowStockThreshold || 5} units</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Styled offscreen print container so printing has perfect styling */}
      <div className="report-print-container">
        <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>TIREIMS REPORT DETAILED EXCEL SHEET</h2>
        <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#666" }}>Generated: {new Date().toLocaleString()}</p>
        <hr style={{ margin: "1rem 0" }} />
        {/* Render report table again inside print container */}
        <div style={{ padding: "1rem" }}>
          {reportType === "daily" && (
            <div>
              <h3>Daily Sales: {selectedDate} (Count: {dailySales.length})</h3>
              <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySales.map(t => (
                    <tr key={t._id}>
                      <td>{new Date(t.createdAt).toLocaleTimeString()}</td>
                      <td>{t.productName}</td>
                      <td>{Math.abs(t.quantity)}</td>
                      <td>{formatCurrency(t.sellingPrice)}</td>
                      <td>{formatCurrency(Math.abs(t.quantity) * t.sellingPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {reportType === "monthly" && (
            <div>
              <h3>Monthly Sales: {selectedMonth} (Count: {monthlySales.length})</h3>
              <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySales.map(t => (
                    <tr key={t._id}>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td>{t.productName}</td>
                      <td>{Math.abs(t.quantity)}</td>
                      <td>{formatCurrency(t.sellingPrice)}</td>
                      <td>{formatCurrency(Math.abs(t.quantity) * t.sellingPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {reportType === "profit" && (
            <div>
              <h3>Profit Margins: {startDate} to {endDate}</h3>
              <p>Gross Revenue: {formatCurrency(totalSalesRevenue)}</p>
              <p>Cost of Goods: {formatCurrency(totalSalesCOGS)}</p>
              <p>Net Profit: {formatCurrency(totalNetProfit)}</p>
              <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Cost</th>
                    <th>Sell</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {rangeSales.map(t => (
                    <tr key={t._id}>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td>{t.productName}</td>
                      <td>{Math.abs(t.quantity)}</td>
                      <td>{formatCurrency(t.costPrice)}</td>
                      <td>{formatCurrency(t.sellingPrice)}</td>
                      <td>{formatCurrency((t.sellingPrice - t.costPrice) * Math.abs(t.quantity))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {reportType === "inventory" && (
            <div>
              <h3>Inventory Valuation Status</h3>
              <p>Total Cost Asset: {formatCurrency(totalInventoryCost)}</p>
              <p>Total Potential retail: {formatCurrency(totalInventoryPotential)}</p>
              <p>Est. Margin Profit: {formatCurrency(totalInventoryProfit)}</p>
              <table border="1" cellPadding="6" style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Size</th>
                    <th>Qty</th>
                    <th>Cost</th>
                    <th>Retail</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>{p.brand}</td>
                      <td>{p.size}</td>
                      <td>{p.quantity} pcs</td>
                      <td>{formatCurrency(p.costPrice)}</td>
                      <td>{formatCurrency(p.sellingPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ReportsView;
