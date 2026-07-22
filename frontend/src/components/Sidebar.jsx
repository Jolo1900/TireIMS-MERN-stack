import React from "react";

function Sidebar({ activeTab, setActiveTab, user }) {
  // Define full menu
  const allMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", adminOnly: false },
    { id: "pos", label: "Sales POS", icon: "🛒", adminOnly: false },
    { id: "inventory", label: "Inventory", icon: "📦", adminOnly: false },
    { id: "transactions", label: "Transactions", icon: "🔄", adminOnly: false },
    { id: "suppliers", label: "Suppliers", icon: "🤝", adminOnly: true },
    { id: "reports", label: "Reports", icon: "📄", adminOnly: true },
  ];

  // Filter based on role
  const isAdmin = user?.role === "Admin";
  const visibleItems = allMenuItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo-icon">T</div>
        <span className="sidebar-brand-name">TireIMS</span>
      </div>

      <ul className="sidebar-menu">
        {visibleItems.map((item) => (
          <li key={item.id} className="sidebar-item">
            <button
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-link ${activeTab === item.id ? "active" : ""}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <p>TireIMS v2.0</p>
        <p style={{ marginTop: "4px" }}>Role: {user?.role || "User"}</p>
      </div>
    </aside>
  );
}

export default Sidebar;
