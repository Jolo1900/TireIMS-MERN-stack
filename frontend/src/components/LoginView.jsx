import React, { useState } from "react";
import { login, getBaseURL } from "../api/authApi";

function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [customBackend, setCustomBackend] = useState(sessionStorage.getItem("tireims_backend_url") || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const res = await login({ username, password });
      if (res.data.success) {
        sessionStorage.setItem("tireims_token", res.data.token);
        onLoginSuccess(res.data.user);
      } else {
        setError("Login failed.");
      }
    } catch (err) {
      console.error("Login error details:", err);
      const serverMsg = err.response?.data?.message;
      const statusPrefix = err.response?.status ? `[HTTP ${err.response.status}] ` : "";
      
      let errMsg = serverMsg 
        ? `${statusPrefix}${serverMsg}` 
        : err.message === "Network Error"
        ? "Network Error: Unable to reach backend server."
        : `${statusPrefix}${err.message || "Invalid username or password"}`;

      if (err.response?.status === 405) {
        errMsg = "[HTTP 405 Method Not Allowed] Frontend is requesting a static route. Please configure your Backend API URL below.";
        setShowConfig(true);
      }

      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBackendUrl = () => {
    if (!customBackend.trim()) {
      sessionStorage.removeItem("tireims_backend_url");
    } else {
      let formatted = customBackend.trim();
      if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
        formatted = "https://" + formatted;
      }
      sessionStorage.setItem("tireims_backend_url", formatted);
    }
    setError("");
    alert("Backend Server URL saved! You can now try logging in again.");
  };

  return (
    <div className="login-screen-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">RJP</div>
          <h2 className="login-title">RJP Tires Trading</h2>
          <p className="login-subtitle">Tire Inventory Management System</p>
        </div>

        {error && (
          <div className="notification-banner notification-banner-error" style={{ fontSize: "0.85rem", padding: "0.6rem", marginBottom: "1rem" }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field" style={{ marginBottom: "1rem" }}>
            <label style={{ color: "#94a3b8" }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="form-control"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", borderColor: "rgba(255,255,255,0.1)" }}
              required
            />
          </div>

          <div className="form-field" style={{ marginBottom: "1.5rem" }}>
            <label style={{ color: "#94a3b8" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="form-control"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "#fff", borderColor: "rgba(255,255,255,0.1)" }}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", padding: "0.75rem" }} disabled={loading}>
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>

        {/* Backend API Configuration Bar */}
        <div style={{ marginTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.75rem", textAlign: "center" }}>
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline" }}
          >
            {showConfig ? "Hide API Server Settings" : "⚙️ Configure Backend API Server URL"}
          </button>

          {showConfig && (
            <div style={{ marginTop: "0.75rem", textAlign: "left", background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "8px" }}>
              <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.3rem" }}>
                Backend API URL (e.g. Railway Address)
              </label>
              <input
                type="text"
                placeholder="https://tireims-production.up.railway.app"
                value={customBackend}
                onChange={(e) => setCustomBackend(e.target.value)}
                className="form-control"
                style={{ fontSize: "0.8rem", padding: "0.4rem 0.6rem", marginBottom: "0.5rem" }}
              />
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={handleSaveBackendUrl}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, fontSize: "0.75rem" }}
                >
                  Save & Connect
                </button>
                {sessionStorage.getItem("tireims_backend_url") && (
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.removeItem("tireims_backend_url");
                      setCustomBackend("");
                      alert("Reset to default URL settings.");
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.4rem", margin: 0 }}>
                Active Base: <code style={{ color: "var(--primary)" }}>{getBaseURL() || "Relative /"}</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginView;
