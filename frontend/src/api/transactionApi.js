import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/transactions",
});

// Inject JWT token into Authorization header automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("tireims_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getTransactions = () => API.get("/");

export const createTransaction = (transaction) => API.post("/", transaction);

export const deleteTransaction = (id) => API.delete(`/${id}`);
