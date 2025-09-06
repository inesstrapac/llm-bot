import axios from "axios";
import { createToastInterface } from "vue-toastification";
import "vue-toastification/dist/index.css";
import { toastOptions } from "@/app/toast/toastOptions";

const toast = createToastInterface(toastOptions);
function extractErrorMessage(err) {
  const fallback = "";

  if (!err || !err.response) return err?.message || fallback;

  const data = err.response.data;

  if (data && data.message) {
    if (Array.isArray(data.message)) return data.message.join("\n");
    if (typeof data.message === "string") return data.message;
    try {
      return JSON.stringify(data.message);
    } finally {
      console.log("meow");
    }
  }

  if (typeof data === "string") return data;

  return err.message || fallback;
}

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

    const msg = extractErrorMessage(error);
    toast.error(msg);
    console.log("Me hereeeee");

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
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default http;
