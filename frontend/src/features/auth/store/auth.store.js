import { defineStore } from "pinia";
import { ref, computed, defineEmits } from "vue";
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
  const emit = defineEmits(["success"]);
  const accessToken = ref(localStorage.getItem("access_token"));
  const user = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const name = ref("");
  const surname = ref("");
  const email = ref("");
  const password = ref("");
  const tab = ref("login");

  async function setTab(form) {
    name.value = "";
    surname.value = "";
    email.value = "";
    password.value = "";

    tab.value = form;
  }

  async function onLoginSubmit() {
    try {
      await signIn(email.value, password.value);
      emit("success");
    } catch (error) {
      return error?.response?.data?.message || "Invalid credentials";
    }
  }

  async function onSubmit() {
    try {
      await signUp({
        name: name.value,
        surname: surname.value,
        email: email.value,
        password: password.value,
      });
      emit("success");
    } catch (error) {
      return error?.response?.data?.message || "Invalid credentials";
    }
  }

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
    name,
    surname,
    email,
    password,
    user,
    loading,
    error,
    isAuthenticated,
    tab,
    setTab,
    onSubmit,
    onLoginSubmit,
    bootstrap,
    signUp,
    signIn,
    signOut,
  };
});
