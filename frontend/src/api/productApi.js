import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/products",
});

// Inject JWT token into Authorization header automatically
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("tireims_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getProducts = () => API.get("/");

export const createProduct = (product) => API.post("/", product);

export const updateProduct = (id, product) =>
  API.put(`/${id}`, product);

export const deleteProduct = (id) =>
  API.delete(`/${id}`);