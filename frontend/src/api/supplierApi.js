import axios from "axios";

export const getBaseURL = () => {
  const custom = sessionStorage.getItem("tireims_backend_url");
  if (custom) return custom.replace(/\/$/, "");
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  if (import.meta.env.PROD) return "";
  return "http://localhost:5000";
};

const getClient = () => {
  const instance = axios.create({
    baseURL: `${getBaseURL()}/api/suppliers`,
  });
  const token = sessionStorage.getItem("tireims_token");
  if (token) {
    instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  return instance;
};

export const getSuppliers = () => getClient().get("/");
export const createSupplier = (supplier) => getClient().post("/", supplier);
export const updateSupplier = (id, supplier) => getClient().put(`/${id}`, supplier);
export const deleteSupplier = (id) => getClient().delete(`/${id}`);
