import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { login, register, logout } from "../api";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const accessToken = ref(localStorage.getItem("access_token"));
  const loading = ref(false);
  const error = ref(null);
  const isAuthenticated = computed(() => !!accessToken.value);

  async function signIn(email, password) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await login(email, password);
      accessToken.value = data.accessToken;
      localStorage.setItem("access_token", data.accessToken);
      user.value = data.user ?? null;
    } catch (e) {
      error.value = e?.response?.data?.message || "Login failed";
      accessToken.value = null;
      localStorage.removeItem("access_token");
      throw e;
    } finally {
      loading.value = false;
    }
    return user.value;
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

  async function signOut() {
    try {
      await logout();
    } catch {
      console.log("not done yet");
    }
    user.value = null;
    accessToken.value = null;
    localStorage.removeItem("access_token");
  }

  return {
    user,
    accessToken,
    loading,
    error,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
  };
});
