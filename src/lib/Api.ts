import axios, { AxiosRequestHeaders } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. https://localhost:7297/api
});

// Attach token on all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    if (!config.headers) {
      config.headers = {} as AxiosRequestHeaders;
    }

    (config.headers as AxiosRequestHeaders).Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
