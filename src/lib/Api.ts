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

// Global Error Handler for 403 Billing/Trial Expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend `TenantGuardMiddleware` throws a 403 for an inactive subscription...
    if (error.response?.status === 403) {
      const errorText = error.response.data; // Usually "Billing inactive or trial expired..." from middleware
      if (typeof errorText === 'string' && (errorText.toLowerCase().includes('billing active') || errorText.toLowerCase().includes('trial expired') || errorText.toLowerCase().includes('billing inactive'))) {
        // Dispatch the global custom event picked up by SubscriptionContext
        window.dispatchEvent(new Event("fleetmanage:payment-required"));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
