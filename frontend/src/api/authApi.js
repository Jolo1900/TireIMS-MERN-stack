import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: `${BASE}/api/auth`,
});

export const login = (credentials) => API.post("/login", credentials);
