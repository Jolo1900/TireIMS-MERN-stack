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
  baseURL: `${getBaseURL()}/api/auth`,
});

export const login = (credentials) => API.post("/login", credentials);
