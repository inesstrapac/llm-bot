import axios from "axios";

const API_URL = "http://localhost:8081";

export const http = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  withCredentials: true,
});

let onLogout = null;
export function setLogoutHandler(fn) {
  onLogout = typeof fn === "function" ? fn : null;
}

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

    if (status === 401 && !original._retry) {
      original._retry = true;

      try {
        if (!isRefreshing) {
          isRefreshing = true;
          const { headers } = await refreshClient.post("/auth/refresh");
          const newToken =
            headers["x-access-token"] || headers["X-Access-Token"];
          if (!newToken) throw new Error("No access token from refresh");

          localStorage.setItem("access_token", newToken);
          resolveQueue(newToken);
        }
        const tokenFromQueue = await waitForNewToken();
        if (!tokenFromQueue) throw new Error("Token refresh failed");

        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${tokenFromQueue}`;
        return http(original);
      } catch (e) {
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
