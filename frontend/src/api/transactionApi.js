import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: `${BASE}/api/transactions`,
});

// Inject JWT token into Authorization header automatically
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("tireims_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getTransactions = () => API.get("/");
export const createTransaction = (transaction) => API.post("/", transaction);
export const deleteTransaction = (id) => API.delete(`/${id}`);
