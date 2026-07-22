import React, { useEffect, useState } from "react";
import { getProducts, deleteProduct } from "../api/productApi";
import { getSuppliers } from "../api/supplierApi";
import ProductTable from "../components/ProductTable";
import ProductModal from "../components/ProductModal";
import StockActionModal from "../components/StockActionModal";

function Inventory({ user }) {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Filters & Sorting state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [sortBy, setSortBy] = useState("name-asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [prodRes, supRes] = await Promise.all([
        getProducts(),
        getSuppliers(),
      ]);
      setProducts(prodRes.data);
      setSuppliers(supRes.data);
    } catch (error) {
      showNotice("error", "Error loading inventory data.");
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

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tire product? This cannot be undone.")) {
      return;
    }
    try {
      await deleteProduct(id);
      showNotice("success", "Product deleted successfully.");
      fetchInventoryData();
    } catch (error) {
      showNotice("error", "Failed to delete product.");
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

  // Get unique brands for the brand filter dropdown
  const uniqueBrands = [...new Set(products.map((p) => p.brand))].sort();

  // Filtered and Sorted list
  const filteredProducts = products
    .filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.size.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchBrand = selectedBrand ? p.brand === selectedBrand : true;
      
      const matchLowStock = onlyLowStock
        ? p.quantity <= (p.lowStockThreshold || 5)
        : true;
      
      return matchSearch && matchBrand && matchLowStock;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "brand-asc":
          return a.brand.localeCompare(b.brand);
        case "qty-asc":
          return a.quantity - b.quantity;
        case "qty-desc":
          return b.quantity - a.quantity;
        case "price-asc":
          return a.sellingPrice - b.sellingPrice;
        case "price-desc":
          return b.sellingPrice - a.sellingPrice;
        default:
          return 0;
      }
    });

  // Pagination logic
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBrand, onlyLowStock, sortBy]);

  const isAdmin = user?.role === "Admin";

  return (
    <>
      <div className="page-header">
        <div className="page-title-area">
          <h1 className="page-title">Tire Catalog & Stock</h1>
          <p className="page-subtitle">Track and configure tire products and items in stock</p>
        </div>
        {isAdmin && (
          <button onClick={handleAddClick} className="btn btn-primary">
            ➕ Add New Tire
          </button>
        )}
      </div>

      {notification && (
        <div className={`notification-banner notification-banner-${notification.type}`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}>×</button>
        </div>
      )}

      {/* Advanced Filters Panel */}
      <div className="glass-panel filter-bar">
        <div className="filter-group">
          <label>Search Tires</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, brand, or size..."
            className="form-control"
          />
        </div>

        <div className="filter-group">
          <label>Filter by Brand</label>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="form-control"
          >
            <option value="">-- All Brands --</option>
            {uniqueBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Sort By</label>
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
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.75rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              style={{ width: "16px", height: "16px" }}
            />
            Low Stock Only
          </label>
        </div>
      </div>

      {/* Inventory Table Panel */}
      <div className="glass-panel">
        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>Loading tires list...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
            No tire products found matching filters.
          </div>
        ) : (
          <>
            <ProductTable
              products={paginatedProducts}
              onEdit={handleEditClick}
              onDelete={handleDeleteProduct}
              onStockAction={handleStockActionClick}
              user={user}
            />

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

      {/* Dialog Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProductForEdit}
        onProductSaved={fetchInventoryData}
        suppliers={suppliers}
      />

      <StockActionModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={selectedProductForStock}
        onTransactionRecorded={fetchInventoryData}
      />
    </>
  );
}

export default Inventory;