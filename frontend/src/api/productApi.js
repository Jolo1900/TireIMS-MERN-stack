import axios from "axios";

const LIVE_BACKEND_URL = "https://tireims-mern-stack-production-522b.up.railway.app";

export const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://"))) {
    return envUrl.replace(/\/$/, "");
  }
  return LIVE_BACKEND_URL;
};

const getClient = () => {
  const instance = axios.create({
    baseURL: `${getBaseURL()}/api/products`,
  });
  const token = sessionStorage.getItem("tireims_token");
  if (token) {
    instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  return instance;
};

export const getProducts = () => getClient().get("/");
export const createProduct = (product) => getClient().post("/", product);
export const updateProduct = (id, product) => getClient().put(`/${id}`, product);
export const deleteProduct = (id) => getClient().delete(`/${id}`);