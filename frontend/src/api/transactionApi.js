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

const getClient = () => {
  const instance = axios.create({
    baseURL: `${getBaseURL()}/api/transactions`,
  });
  const token = sessionStorage.getItem("tireims_token");
  if (token) {
    instance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  return instance;
};

export const getTransactions = () => getClient().get("/");
export const createTransaction = (transaction) => getClient().post("/", transaction);
export const deleteTransaction = (id) => getClient().delete(`/${id}`);
