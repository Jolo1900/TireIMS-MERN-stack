import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import Inventory from "./pages/Inventory";
import TransactionsView from "./components/TransactionsView";
import SupplierView from "./components/SupplierView";
import PosView from "./components/PosView";
import ReportsView from "./components/ReportsView";
import LoginView from "./components/LoginView";
import { getProducts } from "./api/productApi";

function App() {
  // Load session
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("tireims_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [alertProducts, setAlertProducts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Poll for low stock alerts
  useEffect(() => {
    if (!user) return;
    
    const checkAlerts = async () => {
      try {
        const res = await getProducts();
        const lowStock = res.data.filter(
          (p) => (p.quantity || 0) <= (p.lowStockThreshold || 5)
        );
        setAlertProducts(lowStock);
      } catch (err) {
        console.error("Failed to check stock warnings", err);
      }
    };

    checkAlerts();
    // Poll every 15 seconds to keep notification counts updated
    const interval = setInterval(checkAlerts, 15000);
    return () => clearInterval(interval);
  }, [user, activeTab]);

  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
    localStorage.setItem("tireims_user", JSON.stringify(userObj));
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("tireims_user");
    localStorage.removeItem("tireims_token");
    setActiveTab("dashboard");
  };

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView setActiveTab={setActiveTab} />;
      case "pos":
        return <PosView user={user} />;
      case "inventory":
        return <Inventory user={user} />;
      case "transactions":
        return <TransactionsView user={user} />;
      case "suppliers":
        return <SupplierView />;
      case "reports":
        return <ReportsView />;
      default:
        return <DashboardView setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      
      <main className="main-content">
        {/* Top Header Bar */}
        <header className="app-header">
          {/* Notifications Bell */}
          <div className="bell-container">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="bell-button"
              title="Notifications"
            >
              🔔
              {alertProducts.length > 0 && (
                <span className="bell-badge">{alertProducts.length}</span>
              )}
            </button>

            {showNotifications && (
              <div className="bell-dropdown">
                <div className="bell-dropdown-title">
                  <span>Stock Alerts ({alertProducts.length})</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", color: "var(--danger)" }}
                  >
                    Close
                  </button>
                </div>
                {alertProducts.length === 0 ? (
                  <p style={{ fontSize: "0.8rem", color: "var(--success)", padding: "0.5rem 0" }}>
                    ✓ All tires have healthy stock levels.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {alertProducts.map((item) => (
                      <div
                        key={item._id}
                        style={{
                          fontSize: "0.75rem",
                          borderBottom: "1px solid var(--border-color)",
                          paddingBottom: "0.5rem"
                        }}
                      >
                        <div style={{ fontWeight: "bold" }}>
                          {item.brand} {item.name}
                        </div>
                        <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>
                          Size: {item.size}
                        </div>
                        <div style={{ marginTop: "4px" }}>
                          <span
                            className="stock-tag"
                            style={{
                              fontSize: "0.7rem",
                              padding: "0.1rem 0.3rem",
                              backgroundColor: item.quantity === 0 ? "var(--danger-bg)" : "var(--warning-bg)",
                              color: item.quantity === 0 ? "var(--danger)" : "var(--warning)"
                            }}
                          >
                            {item.quantity === 0 ? "Out of Stock" : `${item.quantity} Left (Low)`}
                          </span>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        setActiveTab("inventory");
                        setShowNotifications(false);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ width: "100%", marginTop: "0.25rem" }}
                    >
                      Manage Inventory
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User profile section */}
          <div className="user-profile-widget">
            <span>Welcome, <strong>{user.username}</strong></span>
            <span className={`user-badge user-badge-${user.role.toLowerCase()}`}>
              {user.role}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-secondary btn-sm"
              style={{ padding: "0.35rem 0.6rem" }}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* View Section */}
        {renderActiveView()}
      </main>
    </div>
  );
}

export default App;