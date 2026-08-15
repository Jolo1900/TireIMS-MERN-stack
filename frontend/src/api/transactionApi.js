import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.PROD) {
    return "";
  }
  return "http://localhost:5000";
};

const API = axios.create({
  baseURL: `${getBaseURL()}/api/transactions`,
});

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
