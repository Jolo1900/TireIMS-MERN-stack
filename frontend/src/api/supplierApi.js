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
  baseURL: `${getBaseURL()}/api/suppliers`,
});

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("tireims_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getSuppliers = () => API.get("/");
export const createSupplier = (supplier) => API.post("/", supplier);
export const updateSupplier = (id, supplier) => API.put(`/${id}`, supplier);
export const deleteSupplier = (id) => API.delete(`/${id}`);
