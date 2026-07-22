import React, { useState } from "react";
import { login } from "../api/authApi";

function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        localStorage.setItem("tireims_token", res.data.token);
        onLoginSuccess(res.data.user);
      } else {
        setError("Login failed.");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Invalid credentials. Please try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
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
          <div className="notification-banner notification-banner-error" style={{ fontSize: "0.85rem", padding: "0.5rem" }}>
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


      </div>
    </div>
  );
}

export default LoginView;
