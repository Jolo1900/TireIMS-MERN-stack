import React, { useEffect, useState } from "react";
import { getTransactions, deleteTransaction } from "../api/transactionApi";

function TransactionsView({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Filtering & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchTransactionsList();
  }, []);

  const fetchTransactionsList = async () => {
    try {
      setLoading(true);
      const res = await getTransactions();
      setTransactions(res.data);
    } catch (error) {
      console.error("Failed to fetch transactions list", error);
    } finally {
      setLoading(false);
    }
  };

  const showNotice = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction log? This will revert the stock level of the corresponding tire product.")) {
      return;
    }

    try {
      await deleteTransaction(id);
      showNotice("success", "Transaction deleted and product inventory stock reverted.");
      fetchTransactionsList();
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to delete transaction.";
      showNotice("error", errMsg);
    }
  };

  // Format helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);
  };

  // Filtered transactions
  const filteredTx = transactions.filter((tx) => {
    const matchSearch = tx.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (tx.notes && tx.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = typeFilter ? tx.type === typeFilter : true;
    return matchSearch && matchType;
  });

  // Calculate totals
  const totalSalesVal = filteredTx
    .filter(t => t.type === "Sale")
    .reduce((sum, t) => sum + (Math.abs(t.quantity) * t.sellingPrice), 0);

  const totalRestockVal = filteredTx
    .filter(t => t.type === "Restock")
    .reduce((sum, t) => sum + (Math.abs(t.quantity) * t.costPrice), 0);

  const totalSoldQty = filteredTx
    .filter(t => t.type === "Sale")
    .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

  // Pagination logic
  const totalItems = filteredTx.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTx = filteredTx.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  const isAdmin = user?.role === "Admin";

  return (
    <>
      <div className="page-header">
        <div className="page-title-area">
          <h1 className="page-title">Transaction History</h1>
          <p className="page-subtitle">Historical audit trail of all inventory changes and movements</p>
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

      {/* Stats Summary Panel */}
      <div className="kpis-grid">
        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container" style={{ backgroundColor: "var(--success-bg)", color: "var(--success)" }}>
            📈
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Total Sales Revenue</span>
            <span className="kpi-value">{formatCurrency(totalSalesVal)}</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container" style={{ backgroundColor: "var(--danger-bg)", color: "var(--danger)" }}>
            📉
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Total Restock Cost</span>
            <span className="kpi-value">{formatCurrency(totalRestockVal)}</span>
          </div>
        </div>

        <div className="glass-panel kpi-card">
          <div className="kpi-icon-container" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
            📦
          </div>
          <div className="kpi-details">
            <span className="kpi-title">Tires Sold (Units)</span>
            <span className="kpi-value">{totalSoldQty} pcs</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel filter-bar">
        <div className="filter-group">
          <label>Search Transactions</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name or notes..."
            className="form-control"
          />
        </div>

        <div className="filter-group" style={{ maxWidth: "250px" }}>
          <label>Filter by Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-control"
          >
            <option value="">-- All Types --</option>
            <option value="Restock">Restock (Stock In)</option>
            <option value="Sale">Sale (Stock Out)</option>
            <option value="Adjustment">Adjustment</option>
          </select>
        </div>
      </div>

      {/* Main Table List */}
      <div className="glass-panel">
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>Loading transactions log...</div>
        ) : filteredTx.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>
            No transaction logs found matching filters.
          </p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Product Details</th>
                    <th>Type</th>
                    <th>Qty Change</th>
                    <th>Price per Unit</th>
                    <th>Transaction Value</th>
                    <th>Notes</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedTx.map((tx) => {
                    const priceUsed = tx.type === "Sale" ? tx.sellingPrice : tx.costPrice;
                    const valueCalculated = Math.abs(tx.quantity) * priceUsed;
                    return (
                      <tr key={tx._id}>
                        <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
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
                        <td>{formatCurrency(priceUsed)}</td>
                        <td style={{ fontWeight: "600" }}>{formatCurrency(valueCalculated)}</td>
                        <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{tx.notes || "—"}</td>
                        {isAdmin && (
                          <td>
                            <button
                              onClick={() => handleDeleteTransaction(tx._id)}
                              className="btn btn-danger btn-sm"
                              title="Delete and revert stock change"
                            >
                              Delete
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} entries
                </div>
                <div className="pagination-actions">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => c - 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  <span style={{ alignSelf: "center", margin: "0 0.5rem", fontSize: "0.85rem", fontWeight: "600" }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => c + 1)}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default TransactionsView;
