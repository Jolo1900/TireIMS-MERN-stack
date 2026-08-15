import axios from "axios";

const LIVE_BACKEND_URL = "https://tireims-mern-stack-production-e9c5.up.railway.app";

export const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  }
  return LIVE_BACKEND_URL;
};

export const login = (credentials) => {
  const base = getBaseURL();
  return axios.post(`${base}/api/auth/login`, credentials);
};
