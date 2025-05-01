import axios from "axios";
import { GET_AUTH_HEADERS } from "@/lib/constants";

// Create an Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000, // Adjust timeout as needed
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add auth headers automatically
apiClient.interceptors.request.use(
  (config) => {
    // Get auth headers directly from the function
    const authHeaders = GET_AUTH_HEADERS();

    // Apply all auth headers to the request
    if (config.headers) {
      Object.assign(config.headers, authHeaders);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if the error is due to unauthorized access (401)
    if (error.response && error.response.status === 401) {
      // Clear all local storage
      localStorage.clear();

      // Redirect to login page
      window.location.href = "/login"; // Adjust the login route as needed
    }

    return Promise.reject(error);
  }
);

// For multipart form data requests
export const formDataApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "multipart/form-data",
    Accept: "application/json",
    "Access-Control-Allow-Origin": "*",
  },
});
// For multipart form data requests
export const communityFormDataApiClient = axios.create({
  baseURL: import.meta.env.VITE_API_ADMIN_BASE_URL || "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "multipart/form-data",
    Accept: "application/json",
    "Access-Control-Allow-Origin": "*",
  },
});

// Add the same interceptor to formDataApiClient
formDataApiClient.interceptors.request.use(
  (config) => {
    // Get auth headers directly from the function
    const authHeaders = GET_AUTH_HEADERS();

    if (config.headers) {
      Object.assign(config.headers, authHeaders);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Admin API client for admin panel API calls
export const adminApiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_ADMIN_BASE_URL ||
    "https://bondbridge-admin-panel.vercel.app/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add auth headers automatically for admin API client
adminApiClient.interceptors.request.use(
  (config) => {
    // Get auth headers directly from the function
    const authHeaders = GET_AUTH_HEADERS();

    // Apply all auth headers to the request
    if (config.headers) {
      Object.assign(config.headers, authHeaders);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
communityFormDataApiClient.interceptors.request.use(
  (config) => {
    // Get auth headers directly from the function
    const authHeaders = GET_AUTH_HEADERS();

    // Apply all auth headers to the request
    if (config.headers) {
      Object.assign(config.headers, authHeaders);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authentication errors for admin API client
adminApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if the error is due to unauthorized access (401)
    if (error.response && error.response.status === 401) {
      // Clear all local storage
      localStorage.clear();

      // Redirect to login page
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
communityFormDataApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if the error is due to unauthorized access (401)
    if (error.response && error.response.status === 401) {
      // Clear all local storage
      localStorage.clear();

      // Redirect to login page
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
