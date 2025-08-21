import axios from "axios";

const API_URL = "http://localhost:8081";

export const http = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  withCredentials: true,
});

// Separate client WITHOUT interceptors for the /auth/refresh call
const refreshClient = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  withCredentials: true,
});

// ---- optional logout hook (store registers its own signOut here) ----
let onLogout = null;
export function setLogoutHandler(fn) {
  onLogout = typeof fn === "function" ? fn : null;
}

// ---- attach Authorization on every request ----
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- 401 handling with single-flight refresh queue ----
let isRefreshing = false;
let queue = [];

function waitForNewToken() {
  return new Promise((resolve) => queue.push(resolve));
}

function resolveQueue(token) {
  queue.forEach((resolve) => resolve(token));
  queue = [];
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config || {};

    // Only intercept 401 once per request
    if (status === 401 && !original._retry) {
      original._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          // Use the bare client to avoid recursive interceptors
          const { headers } = await refreshClient.post("/auth/refresh");
          const newToken =
            headers["x-access-token"] || headers["X-Access-Token"];
          if (!newToken) throw new Error("No access token from refresh");

          localStorage.setItem("access_token", newToken);
          resolveQueue(newToken);
        }

        // Wait until the current refresh finishes
        const tokenFromQueue = await waitForNewToken();
        if (!tokenFromQueue) throw new Error("Token refresh failed");

        // Retry original request with new token
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${tokenFromQueue}`;
        return http(original);
      } catch (e) {
        // Refresh failed → hard logout
        localStorage.removeItem("access_token");
        resolveQueue(null);
        if (onLogout) onLogout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default http;
