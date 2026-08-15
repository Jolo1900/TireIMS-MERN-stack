import React, { useEffect, useState } from "react";
import { Search, X, Command, Package } from "lucide-react";
import { getProducts } from "../api/productApi";

function GlobalSearchModal({ isOpen, onClose, onSelectProduct }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await getProducts();
      const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setProducts(items);
    } catch (err) {
      console.error("Failed to load products for search", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filtered = products.filter((p) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(term) ||
      p.brand?.toLowerCase().includes(term) ||
      p.size?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term)
    );
  }).slice(0, 8); // top 8 results

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val || 0);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "10vh",
        zIndex: 9999,
        animation: "fadeIn 0.15s ease-out"
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "640px",
          margin: "0 1rem",
          padding: 0,
          overflow: "hidden",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          borderRadius: "16px",
          border: "1px solid var(--border-color)",
          backgroundColor: "var(--bg-app)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border-color)",
            gap: "0.75rem"
          }}
        >
          <Search size={20} style={{ color: "var(--primary)" }} />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tires by model, brand, size (e.g. Michelin 205/55R16)..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: "1rem",
              color: "var(--text-main)",
              fontFamily: "var(--font-sans)"
            }}
          />
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              backgroundColor: "var(--primary-light)",
              padding: "0.2rem 0.5rem",
              borderRadius: "6px",
              fontWeight: 600
            }}
          >
            <Command size={12} /> K
          </span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "4px",
              display: "flex"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Results Body */}
        <div style={{ maxHeight: "400px", overflowY: "auto", padding: "0.5rem" }}>
          {loading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              Loading inventory catalog...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              No tire products found matching "{searchTerm}"
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item._id}
                onClick={() => {
                  if (onSelectProduct) onSelectProduct(item);
                  onClose();
                }}
                className="search-item-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  marginBottom: "4px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "8px",
                      backgroundColor: "var(--primary-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--primary)"
                    }}
                  >
                    <Package size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "0.95rem" }}>
                      {item.brand} {item.name}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Size: {item.size} • Supplier: {item.supplier || "N/A"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span
                    className={`stock-tag ${
                      item.quantity === 0
                        ? "stock-tag-out"
                        : item.quantity <= (item.lowStockThreshold || 5)
                        ? "stock-tag-low"
                        : "stock-tag-ok"
                    }`}
                  >
                    {item.quantity === 0 ? "Out of Stock" : `${item.quantity} in stock`}
                  </span>
                  <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.95rem" }}>
                    {formatCurrency(item.sellingPrice)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div
          style={{
            padding: "0.6rem 1.25rem",
            backgroundColor: "var(--border-color)",
            opacity: 0.8,
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "var(--text-muted)"
          }}
        >
          <span>Use <strong>ESC</strong> to exit quick search</span>
          <span>Showing up to 8 matching items</span>
        </div>
      </div>
    </div>
  );
}

export default GlobalSearchModal;
