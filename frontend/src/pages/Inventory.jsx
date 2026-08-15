import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { Search, Plus, Filter, ArrowUpDown, SlidersHorizontal, Layers, CheckCircle, AlertCircle } from "lucide-react";
import { getProducts, updateProduct, deleteProduct } from "../api/productApi";
import { getSuppliers } from "../api/supplierApi";
import { createTransaction } from "../api/transactionApi";
import ProductTable from "../components/ProductTable";
import ProductModal from "../components/ProductModal";
import StockActionModal from "../components/StockActionModal";

function Inventory({ user }) {
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState(null);

  // Filters, Search & Sorting state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebounce(searchInput, 300); // 300ms debounce
  const [selectedBrand, setSelectedBrand] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [sortBy, setSortBy] = useState("name-asc");

  // Row Density State ("comfortable" vs "compact")
  const [density, setDensity] = useState("comfortable");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);

  // TanStack Query: Load Products
  const { data: rawProductsData, isLoading: loadingProducts, isError } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await getProducts();
      return Array.isArray(res.data) ? res.data : res.data?.items || [];
    },
  });

  // TanStack Query: Load Suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const res = await getSuppliers();
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const products = rawProductsData || [];
  const suppliers = suppliersData || [];

  const showNotice = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Optimistic UI Mutation: Quick Stock +1 / -1
  const quickStockMutation = useMutation({
    mutationFn: async ({ product, delta }) => {
      const newQty = Math.max(0, (product.quantity || 0) + delta);
      // 1. Update product quantity
      await updateProduct(product._id, { quantity: newQty });
      // 2. Log transaction audit record
      await createTransaction({
        productId: product._id,
        type: delta > 0 ? "Restock" : "Adjustment",
        direction: delta < 0 ? "subtract" : "add",
        quantity: Math.abs(delta),
        notes: `Quick ${delta > 0 ? "+1 Restock" : "-1 Stock Adjustment"} by ${user?.username || "Admin"}`
      });
    },
    onMutate: async ({ product, delta }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const previousProducts = queryClient.getQueryData(["products"]);

      // Optimistically update query cache
      queryClient.setQueryData(["products"], (old = []) =>
        old.map((p) =>
          p._id === product._id
            ? { ...p, quantity: Math.max(0, (p.quantity || 0) + delta) }
            : p
        )
      );

      return { previousProducts };
    },
    onError: (err, variables, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts);
      }
      showNotice("error", "Failed to update stock level.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await deleteProduct(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const previousProducts = queryClient.getQueryData(["products"]);
      queryClient.setQueryData(["products"], (old = []) => old.filter((p) => p._id !== id));
      return { previousProducts };
    },
    onError: (err, id, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts);
      }
      showNotice("error", "Failed to delete tire product.");
    },
    onSuccess: () => {
      showNotice("success", "Product deleted successfully.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleDeleteProduct = (id) => {
    if (window.confirm("Are you sure you want to delete this tire product? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEditClick = (product) => {
    setSelectedProductForEdit(product);
    setIsProductModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedProductForEdit(null);
    setIsProductModalOpen(true);
  };

  const handleStockActionClick = (product) => {
    setSelectedProductForStock(product);
    setIsStockModalOpen(true);
  };

  const handleQuickStockChange = (product, delta) => {
    quickStockMutation.mutate({ product, delta });
  };

  // Get unique brand options
  const uniqueBrands = [...new Set(products.map((p) => p.brand))].filter(Boolean).sort();

  // Filter & Sort Logic (debounced)
  const filteredProducts = products
    .filter((p) => {
      const matchSearch = debouncedSearch
        ? p.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.brand?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.size?.toLowerCase().includes(debouncedSearch.toLowerCase())
        : true;

      const matchBrand = selectedBrand ? p.brand === selectedBrand : true;
      const matchLowStock = onlyLowStock ? p.quantity <= (p.lowStockThreshold || 5) : true;

      return matchSearch && matchBrand && matchLowStock;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc": return (a.name || "").localeCompare(b.name || "");
        case "name-desc": return (b.name || "").localeCompare(a.name || "");
        case "brand-asc": return (a.brand || "").localeCompare(b.brand || "");
        case "qty-asc": return a.quantity - b.quantity;
        case "qty-desc": return b.quantity - a.quantity;
        case "price-asc": return a.sellingPrice - b.sellingPrice;
        case "price-desc": return b.sellingPrice - a.sellingPrice;
        default: return 0;
      }
    });

  // Pagination calculations
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedBrand, onlyLowStock, sortBy]);

  const isAdmin = user?.role === "Admin";

  return (
    <>
      <div className="page-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div className="page-title-area">
          <h1 className="page-title">Tire Catalog & Stock Manager</h1>
          <p className="page-subtitle">Track, filter, and modify inventory with instant updates</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Row Density Toggle Button */}
          <div style={{ display: "flex", alignItems: "center", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "2px" }}>
            <button
              onClick={() => setDensity("comfortable")}
              className={`btn btn-sm ${density === "comfortable" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", borderRadius: "6px" }}
              title="Comfortable Density"
            >
              Comfortable
            </button>
            <button
              onClick={() => setDensity("compact")}
              className={`btn btn-sm ${density === "compact" ? "btn-primary" : "btn-secondary"}`}
              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", borderRadius: "6px" }}
              title="Compact Density"
            >
              Compact
            </button>
          </div>

          {isAdmin && (
            <button onClick={handleAddClick} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Plus size={18} />
              <span>Add Tire</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div className={`notification-banner notification-banner-${notification.type}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}>×</button>
        </div>
      )}

      {/* Advanced Debounced Filters Panel */}
      <div className="glass-panel filter-bar">
        <div className="filter-group">
          <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Search size={14} style={{ color: "var(--primary)" }} />
            <span>Search Catalog (300ms Debounce)</span>
          </label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Type tire model, size, brand..."
            className="form-control"
          />
        </div>

        <div className="filter-group">
          <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Filter size={14} style={{ color: "var(--primary)" }} />
            <span>Filter by Brand</span>
          </label>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="form-control"
          >
            <option value="">-- All Brands --</option>
            {uniqueBrands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <ArrowUpDown size={14} style={{ color: "var(--primary)" }} />
            <span>Sort By</span>
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-control"
          >
            <option value="name-asc">Model Name (A-Z)</option>
            <option value="name-desc">Model Name (Z-A)</option>
            <option value="brand-asc">Brand Name (A-Z)</option>
            <option value="qty-asc">Stock Level (Low to High)</option>
            <option value="qty-desc">Stock Level (High to Low)</option>
            <option value="price-asc">Selling Price (Low to High)</option>
            <option value="price-desc">Selling Price (High to Low)</option>
          </select>
        </div>

        <div className="filter-group" style={{ flexGrow: 0, minWidth: "140px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.75rem", cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            Low Stock Only
          </label>
        </div>
      </div>

      {/* Main Inventory Panel */}
      <div className="glass-panel">
        {loadingProducts ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            Loading tire inventory catalog...
          </div>
        ) : isError ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--danger)" }}>
            <p style={{ fontWeight: "bold", fontSize: "1.1rem" }}>⚠️ Unable to load tire catalog from server.</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              The server connection returned an error or requires re-authentication.
            </p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: "1rem" }}
            >
              🔄 Retry Fetching Catalog
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            <p style={{ fontSize: "1rem", fontWeight: 600 }}>No tire products found matching filters.</p>
            {products.length === 0 && isAdmin && (
              <button
                onClick={handleAddClick}
                className="btn btn-primary btn-sm"
                style={{ marginTop: "1rem" }}
              >
                ➕ Add Your First Tire Product
              </button>
            )}
          </div>
        ) : (
          <>
            <ProductTable
              products={paginatedProducts}
              onEdit={handleEditClick}
              onDelete={handleDeleteProduct}
              onStockAction={handleStockActionClick}
              onQuickStockChange={handleQuickStockChange}
              density={density}
              user={user}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-container" style={{ marginTop: "1.5rem" }}>
                <div className="pagination-info">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} items
                </div>
                <div className="pagination-actions">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  <span style={{ alignSelf: "center", margin: "0 0.5rem", fontSize: "0.85rem", fontWeight: "600" }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
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

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProductForEdit}
        onProductSaved={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
        suppliers={suppliers}
      />

      <StockActionModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={selectedProductForStock}
        onTransactionRecorded={() => {
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
        }}
      />
    </>
  );
}

export default Inventory;