import axios from "axios";

export const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  }
  if (import.meta.env.PROD) {
    return "https://tireims-mern-stack-production-e9c5.up.railway.app";
  }
  return "http://localhost:5000";
};

export const login = (credentials) => {
  const base = getBaseURL();
  return axios.post(`${base}/api/auth/login`, credentials);
};
