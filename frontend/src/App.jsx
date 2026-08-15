import React, { useEffect, useState } from "react";
import { Sun, Moon, Search, Bell, Command, LogOut, Menu, X, Package, LayoutDashboard, ShoppingCart, Repeat, Users, BarChart3 } from "lucide-react";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import Inventory from "./pages/Inventory";
import TransactionsView from "./components/TransactionsView";
import SupplierView from "./components/SupplierView";
import PosView from "./components/PosView";
import ReportsView from "./components/ReportsView";
import LoginView from "./components/LoginView";
import GlobalSearchModal from "./components/GlobalSearchModal";
import { getProducts } from "./api/productApi";

function App() {
  // Load session
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem("tireims_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState("dashboard");
  const [alertProducts, setAlertProducts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Theme state: default dark mode
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("tireims_theme");
    return savedTheme ? savedTheme === "dark" : true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      document.body.classList.add("dark");
      document.body.classList.remove("light");
      localStorage.setItem("tireims_theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      document.body.classList.add("light");
      document.body.classList.remove("dark");
      localStorage.setItem("tireims_theme", "light");
    }
  }, [darkMode]);

  // Keyboard shortcut for Cmd+K / Ctrl+K search modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Poll for low stock alerts
  useEffect(() => {
    if (!user) return;
    
    const checkAlerts = async () => {
      try {
        const res = await getProducts();
        const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
        const lowStock = items.filter(
          (p) => (p.quantity || 0) <= (p.lowStockThreshold || 5)
        );
        setAlertProducts(lowStock);
      } catch (err) {
        console.error("Failed to check stock warnings", err);
      }
    };

    checkAlerts();
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
    sessionStorage.setItem("tireims_user", JSON.stringify(userObj));
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem("tireims_user");
    sessionStorage.removeItem("tireims_token");
    setActiveTab("dashboard");
  };

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const navMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, adminOnly: false },
    { id: "pos", label: "Sales POS", icon: <ShoppingCart size={18} />, adminOnly: false },
    { id: "inventory", label: "Inventory", icon: <Package size={18} />, adminOnly: false },
    { id: "transactions", label: "Transactions", icon: <Repeat size={18} />, adminOnly: false },
    { id: "suppliers", label: "Suppliers", icon: <Users size={18} />, adminOnly: true },
    { id: "reports", label: "Reports", icon: <BarChart3 size={18} />, adminOnly: true },
  ];

  const isAdmin = user?.role === "Admin";
  const visibleItems = navMenuItems.filter((item) => !item.adminOnly || isAdmin);

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
    <div className={`app-container ${darkMode ? "dark-theme" : "light-theme"}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      
      <main className="main-content">
        {/* Top Header Bar */}
        <header className="app-header" style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Mobile Hamburger Trigger (<768px) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="mobile-menu-trigger btn btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "44px",
              minHeight: "44px",
              padding: "0.5rem"
            }}
            title="Open Mobile Navigation Menu"
          >
            <Menu size={22} />
          </button>

          {/* Quick Cmd+K Search trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="global-search-trigger"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.45rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-card)",
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: "0.85rem",
              transition: "all 0.2s ease",
              flex: 1,
              maxWidth: "320px",
              minHeight: "44px"
            }}
          >
            <Search size={16} style={{ color: "var(--primary)" }} />
            <span style={{ display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Search tires...</span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: "0.7rem",
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
                padding: "0.15rem 0.4rem",
                borderRadius: "4px",
                fontWeight: 700
              }}
            >
              ⌘K
            </span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}>
            {/* Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn btn-secondary btn-sm"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 0.75rem",
                minHeight: "44px"
              }}
              title="Toggle Light / Dark Mode"
            >
              {darkMode ? <Sun size={18} style={{ color: "#fbbf24" }} /> : <Moon size={18} style={{ color: "#4f46e5" }} />}
              <span className="theme-text" style={{ fontSize: "0.8rem" }}>{darkMode ? "Light" : "Dark"}</span>
            </button>

            {/* Notifications Bell */}
            <div className="bell-container">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="bell-button"
                title="Notifications"
                style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Bell size={18} />
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
                        style={{ width: "100%", marginTop: "0.25rem", minHeight: "44px" }}
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
              <span className="user-name">Welcome, <strong>{user.username}</strong></span>
              <span className={`user-badge user-badge-${user.role.toLowerCase()}`}>
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                style={{ padding: "0.35rem 0.6rem", display: "flex", alignItems: "center", gap: "4px", minHeight: "44px" }}
              >
                <LogOut size={14} />
                <span className="logout-text">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* View Section */}
        {renderActiveView()}
      </main>

      {/* Slide-out Mobile Navigation Drawer Sheet */}
      {isMobileMenuOpen && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            justifyContent: "flex-start"
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            style={{
              width: "280px",
              maxWidth: "85vw",
              height: "100vh",
              backgroundColor: "var(--bg-app)",
              borderRight: "1px solid var(--border-color)",
              padding: "1.5rem 1rem",
              display: "flex",
              flexDirection: "column",
              boxShadow: "10px 0 30px rgba(0,0,0,0.3)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "var(--primary)", color: "#fff", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>T</div>
                <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>TireIMS</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "8px", minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Menu Links */}
            <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {visibleItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: activeTab === item.id ? "var(--primary-light)" : "transparent",
                    color: activeTab === item.id ? "var(--primary)" : "var(--text-main)",
                    fontWeight: activeTab === item.id ? 700 : 500,
                    minHeight: "44px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: "0.95rem"
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Drawer Footer */}
            <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                User: <strong>{user?.username}</strong> ({user?.role})
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="btn btn-danger"
                style={{ width: "100%", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Cmd+K Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={() => setActiveTab("inventory")}
      />
    </div>
  );
}

export default App;