import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/auth",
});

export const login = (credentials) => API.post("/login", credentials);
