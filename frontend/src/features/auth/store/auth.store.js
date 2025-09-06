import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { login, register, logout, refresh } from "../api";
import router from "@/app/router";

function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore("auth", () => {
  const accessToken = ref(localStorage.getItem("access_token"));
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const isExpired = (tok) => {
    const p = decodeJwt(tok);
    if (!p?.exp) return false;
    return Date.now() >= p.exp * 1000;
  };

  const isAuthenticated = computed(
    () => !!accessToken.value && !isExpired(accessToken.value)
  );

  async function bootstrap() {
    try {
      const { headers, data } = await refresh();
      const token = headers["x-access-token"] || headers["X-Access-Token"];
      if (token) {
        accessToken.value = token;
        localStorage.setItem("access_token", token);
        user.value = data?.user ?? user.value;
      }
    } catch {
      accessToken.value = null;
      localStorage.removeItem("access_token");
      user.value = null;
    }
  }

  async function signUp(form) {
    loading.value = true;
    error.value = null;
    try {
      await register(form);
    } catch (e) {
      error.value = e?.response?.data?.message || "Registration failed";
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function signIn(email, password) {
    loading.value = true;
    error.value = null;
    try {
      const { data, headers } = await login(email, password);
      const token = headers["x-access-token"] || headers["X-Access-Token"];
      if (!token) throw new Error("No token received");
      accessToken.value = token;
      localStorage.setItem("access_token", token);
      user.value = data.user ?? null;
    } catch (e) {
      error.value = e?.response?.data?.message || "Login failed";
      accessToken.value = null;
      localStorage.removeItem("access_token");
      throw e;
    } finally {
      router.replace({ name: "homepage" });
      loading.value = false;
    }
  }

  async function signOut() {
    try {
      await logout();
    } catch (error) {
      return error;
    }
    accessToken.value = null;
    user.value = null;
    localStorage.removeItem("access_token");
    router.replace({ name: "authentication" });
  }

  return {
    accessToken,
    user,
    loading,
    error,
    isAuthenticated,
    bootstrap,
    signUp,
    signIn,
    signOut,
  };
});
