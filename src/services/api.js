import axios from "axios";
import { apiBaseUrl } from "../config";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token && !config.headers?.Authorization) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("authChanged"));
    }

    return Promise.reject(error);
  }
);

export default api;
