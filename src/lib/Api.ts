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

// Global 403 handler — when the TenantGuardMiddleware blocks a write due to inactive billing,
// trigger the subscription modal. The error is still rejected so the write visibly fails.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const text = (error.response?.data ?? "").toString().toLowerCase();
      const isBillingBlock =
        text.includes("billing inactive") ||
        text.includes("billing active") ||
        text.includes("trial expired") ||
        text.includes("please update payment") ||
        text.includes("tenant is not active");
      if (isBillingBlock) {
        window.dispatchEvent(new Event("fleetmanage:payment-required"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
