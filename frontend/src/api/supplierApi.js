import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/suppliers",
});

// Inject JWT token into Authorization header automatically
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
