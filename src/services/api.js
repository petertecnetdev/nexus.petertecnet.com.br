import axios from "axios";
import { apiBaseUrl } from "../config";

const APP_SLUG = "nexus";

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "X-Peter-App": APP_SLUG,
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  config.headers = config.headers || {};
  config.headers["X-Peter-App"] = APP_SLUG;

  if (token && !config.headers.Authorization) {
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
