import React, { useEffect, useState } from "react";
import { getProducts } from "../api/productApi";
import { createTransaction } from "../api/transactionApi";
import axios from "axios";

function PosView({ user }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState([]);

  // Payment State
  const [paymentAmount, setPaymentAmount] = useState("");
  const [changeAmount, setChangeAmount] = useState(0);

  // Modal receipt state
  const [receiptData, setReceiptData] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [error, setError] = useState("");
  const [requireReceipt, setRequireReceipt] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Service Inputs
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");

  const handleAddService = (e) => {
    e.preventDefault();
    if (!serviceName.trim() || !servicePrice) {
      setError("Please enter service name and price.");
      return;
    }
    const price = Number(servicePrice);
    if (isNaN(price) || price < 0) {
      setError("Price must be a positive number.");
      return;
    }

    const serviceItem = {
      product: {
        _id: `service-${Date.now()}`,
        name: serviceName.trim(),
        brand: "Service",
        sellingPrice: price,
        size: "N/A",
        isService: true
      },
      quantity: 1
    };

    setCart([...cart, serviceItem]);
    setServiceName("");
    setServicePrice("");
    setError("");
  };

  const showNotice = (type, text) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  useEffect(() => {
    fetchPosProducts();
  }, []);

  const fetchPosProducts = async () => {
    try {
      setLoading(true);
      const res = await getProducts();
      const items = Array.isArray(res.data) ? res.data : res.data?.items || res.data?.data || [];
      setProducts(items);
    } catch (err) {
      console.error("Failed to load POS products", err);
    } finally {
      setLoading(false);
    }
  };

  // Cart helper actions
  const addToCart = (product) => {
    if (product.quantity <= 0) return;

    const existingIndex = cart.findIndex((item) => item.product._id === product._id);
    if (existingIndex > -1) {
      const updated = [...cart];
      if (updated[existingIndex].quantity >= product.quantity) {
        setError(`Cannot add more. Only ${product.quantity} units are in stock.`);
        setTimeout(() => setError(""), 3000);
        return;
      }
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateCartQty = (productId, delta) => {
    const updated = cart.map((item) => {
      if (item.product._id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (!item.product.isService && newQty > item.product.quantity) {
          setError(`Only ${item.product.quantity} units are in stock.`);
          setTimeout(() => setError(""), 3000);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean);
    
    setCart(updated);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product._id !== productId));
  };

  // Calculations
  const grandTotal = cart.reduce((sum, item) => sum + (item.quantity * item.product.sellingPrice), 0);

  useEffect(() => {
    const tendered = Number(paymentAmount) || 0;
    if (tendered >= grandTotal) {
      setChangeAmount(tendered - grandTotal);
    } else {
      setChangeAmount(0);
    }
  }, [paymentAmount, grandTotal]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError("POS cart is empty.");
      return;
    }

    const tendered = Number(paymentAmount) || 0;
    if (tendered < grandTotal) {
      setError("Tendered payment amount is less than total due.");
      return;
    }

    try {
      setError("");
      // Batch POS checkout endpoint
      const payload = {
        items: cart.map((item) => {
          if (item.product.isService) {
            return {
              isService: true,
              productName: item.product.name,
              quantity: item.quantity,
              sellingPrice: item.product.sellingPrice
            };
          } else {
            return {
              productId: item.product._id,
              quantity: item.quantity,
            };
          }
        }),
        cashierName: user?.username || "Cashier",
        notes: "POS Checkout Sales Transaction",
      };

      const token = sessionStorage.getItem("tireims_token");
      const res = await axios.post("http://localhost:5000/api/transactions/pos", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        if (requireReceipt) {
          // Set Receipt parameters
          setReceiptData({
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            date: new Date(),
            cashier: user?.username || "Cashier",
            items: cart.map((item) => ({
              name: item.product.isService ? item.product.name : `${item.product.brand} ${item.product.name}`,
              size: item.product.size,
              quantity: item.quantity,
              price: item.product.sellingPrice,
              subtotal: item.quantity * item.product.sellingPrice
            })),
            total: grandTotal,
            tendered: tendered,
            change: changeAmount
          });
          setIsReceiptOpen(true);
        } else {
          showNotice("success", `POS checkout completed successfully! Change due: ${formatCurrency(changeAmount)}`);
        }

        setCart([]);
        setPaymentAmount("");
        fetchPosProducts(); // Refresh stock count
      }
    } catch (err) {
      setError(err.response?.data?.message || "POS checkout failed.");
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(val);
  };

  // Filter Catalog
  const filteredCatalog = products.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.size.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <>
      <div className="page-header">
        <div className="page-title-area">
          <h1 className="page-title">Sales POS Terminal</h1>
          <p className="page-subtitle">Add tires to cart and checkout sales orders</p>
        </div>
      </div>

      {error && (
        <div className="notification-banner notification-banner-error">
          <span>{error}</span>
        </div>
      )}

      {notification && (
        <div className={`notification-banner notification-banner-${notification.type}`}>
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: "bold" }}>×</button>
        </div>
      )}

      <div className="pos-layout">
        {/* Left Side: Product Catalog Selection */}
        <div className="pos-catalog-panel">
          <div className="glass-panel" style={{ padding: "1.25rem" }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search catalog by brand, model or size..."
              className="form-control"
            />
          </div>

          <div className="glass-panel" style={{ padding: "1.25rem", marginTop: "1rem" }}>
            <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.95rem", fontWeight: "700" }}>⚙️ Add Rendered Service</h4>
            <form onSubmit={handleAddService} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 2, minWidth: "150px" }}>
                <input
                  type="text"
                  placeholder="Enter service name (e.g. Tire Vulcanizing)"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  className="form-control"
                  style={{ padding: "0.5rem" }}
                  required
                />
              </div>
              <div style={{ flex: 1, minWidth: "100px" }}>
                <input
                  type="number"
                  placeholder="Price (₱)"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                  className="form-control"
                  style={{ padding: "0.5rem" }}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}>
                  ＋ Add Service
                </button>
              </div>
            </form>
          </div>

          {loading ? (
            <div className="glass-panel" style={{ textAlign: "center", padding: "3rem" }}>Loading catalog items...</div>
          ) : filteredCatalog.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              No available tires found.
            </div>
          ) : (
            <div className="pos-catalog-grid">
              {filteredCatalog.map((prod) => (
                <div
                  key={prod._id}
                  onClick={() => addToCart(prod)}
                  className={`pos-catalog-card ${prod.quantity <= 0 ? "out-of-stock" : ""}`}
                >
                  <div>
                    <span className="stock-tag" style={{
                      backgroundColor: prod.quantity <= 0 ? "var(--danger-bg)" : prod.quantity <= (prod.lowStockThreshold || 5) ? "var(--warning-bg)" : "var(--success-bg)",
                      color: prod.quantity <= 0 ? "var(--danger)" : prod.quantity <= (prod.lowStockThreshold || 5) ? "var(--warning)" : "var(--success)",
                      fontSize: "0.75rem",
                      padding: "0.15rem 0.4rem",
                      marginBottom: "0.5rem"
                    }}>
                      {prod.quantity <= 0 ? "Out of Stock" : `${prod.quantity} Left`}
                    </span>
                    <h4 style={{ fontWeight: "700", fontSize: "0.95rem" }}>{prod.brand} {prod.name}</h4>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace", marginTop: "2px" }}>
                      Size: {prod.size}
                    </p>
                  </div>
                  <div className="pos-catalog-price">{formatCurrency(prod.sellingPrice)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Cart and Billing Panel */}
        <div className="pos-cart-panel">
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: "500px" }}>
            <div className="section-title">
              <span>🛒 Shopping Cart</span>
              <span className="alert-badge alert-badge-danger" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary)" }}>
                {cart.reduce((s, i) => s + i.quantity, 0)} Items
              </span>
            </div>

            <div className="pos-cart-table-container">
              {cart.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "3rem" }}>
                  Your cart is empty. Click tires on the left to add.
                </p>
              ) : (
                <table className="custom-table" style={{ fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.product._id}>
                        <td>
                          <div style={{ fontWeight: "600" }}>{item.product.brand} {item.product.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{item.product.size}</div>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <button onClick={() => updateCartQty(item.product._id, -1)} className="pos-qty-btn">-</button>
                            <span style={{ fontWeight: "600", width: "20px", textAlign: "center" }}>{item.quantity}</span>
                            <button onClick={() => updateCartQty(item.product._id, 1)} className="pos-qty-btn">+</button>
                          </div>
                        </td>
                        <td style={{ fontWeight: "600" }}>{formatCurrency(item.quantity * item.product.sellingPrice)}</td>
                        <td>
                          <button onClick={() => removeFromCart(item.product._id)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "1.1rem" }}>
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Calculations & Checkout */}
            <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "1.25rem", fontWeight: "700" }}>
                <span>Grand Total:</span>
                <span style={{ color: "var(--primary)" }}>{formatCurrency(grandTotal)}</span>
              </div>

              <form onSubmit={handleCheckout}>
                <div className="form-field" style={{ marginBottom: "0.75rem" }}>
                  <label>Amount Tendered (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter customer cash paid"
                    className="form-control"
                    disabled={cart.length === 0}
                    required
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem", fontSize: "1.1rem", fontWeight: "600", color: changeAmount > 0 ? "var(--success)" : "inherit" }}>
                  <span>Change:</span>
                  <span>{formatCurrency(changeAmount)}</span>
                </div>

                <div className="form-field" style={{ marginBottom: "1.25rem", flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    id="requireReceipt"
                    checked={requireReceipt}
                    onChange={(e) => setRequireReceipt(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <label htmlFor="requireReceipt" style={{ cursor: "pointer", userSelect: "none", fontSize: "0.85rem", fontWeight: "500" }}>
                    Generate print receipt after checkout
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "0.75rem" }}
                  disabled={cart.length === 0 || Number(paymentAmount) < grandTotal}
                >
                  💳 Complete Sales Checkout
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* POS Thermal Receipt Modal Popup */}
      {isReceiptOpen && receiptData && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <h3 className="modal-title">Receipt Output</h3>
              <button onClick={() => setIsReceiptOpen(false)} className="modal-close-btn">&times;</button>
            </div>
            
            <div className="modal-body" style={{ backgroundColor: "#f1f5f9" }}>
              <div className="receipt-sheet">
                <div className="receipt-header">
                  <h3 style={{ margin: "0 0 0.25rem", fontWeight: "bold" }}>TIREIMS DEPOT</h3>
                  <p style={{ margin: "0", fontSize: "0.75rem" }}>123 Tire Street, Warehouse Hub</p>
                  <p style={{ margin: "0", fontSize: "0.75rem" }}>Phone: (555) 019-TIRE</p>
                </div>

                <div className="receipt-divider"></div>
                <div style={{ fontSize: "0.75rem" }}>
                  <div><strong>Invoice:</strong> {receiptData.invoiceNumber}</div>
                  <div><strong>Date:</strong> {receiptData.date.toLocaleString()}</div>
                  <div><strong>Cashier:</strong> {receiptData.cashier}</div>
                </div>
                <div className="receipt-divider"></div>

                <div style={{ minHeight: "100px" }}>
                  {receiptData.items.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: "0.5rem" }}>
                      <div style={{ fontWeight: "bold" }}>{item.name}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#333" }}>
                        <span>{item.size} (x{item.quantity})</span>
                        <span>{formatCurrency(item.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="receipt-divider"></div>
                
                <div className="receipt-item-row" style={{ fontWeight: "bold" }}>
                  <span>GRAND TOTAL:</span>
                  <span>{formatCurrency(receiptData.total)}</span>
                </div>
                <div className="receipt-item-row">
                  <span>Tendered:</span>
                  <span>{formatCurrency(receiptData.tendered)}</span>
                </div>
                <div className="receipt-item-row" style={{ fontWeight: "bold" }}>
                  <span>CHANGE DUE:</span>
                  <span>{formatCurrency(receiptData.change)}</span>
                </div>

                <div className="receipt-divider"></div>
                <div style={{ textAlign: "center", fontSize: "0.75rem", marginTop: "1rem" }}>
                  THANK YOU FOR YOUR PATRONAGE!
                  <br />
                  Please drive safely.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setIsReceiptOpen(false)} className="btn btn-secondary">
                Close
              </button>
              <button onClick={handlePrintReceipt} className="btn btn-primary">
                🖨️ Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PosView;
