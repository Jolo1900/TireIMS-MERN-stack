import axios from "axios";

export const getBaseURL = () => {
  const custom = sessionStorage.getItem("tireims_backend_url");
  if (custom) return custom.replace(/\/$/, "");
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  if (import.meta.env.PROD) return "";
  return "http://localhost:5000";
};

export const login = (credentials) => {
  const base = getBaseURL();
  return axios.post(`${base}/api/auth/login`, credentials);
};
