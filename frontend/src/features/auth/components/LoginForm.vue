<template>
  <form @submit.prevent="authStore.onLoginSubmit" class="form">
    <label
      >Email<input v-model.trim="authStore.email" type="text" required
    /></label>
    <label
      >Password<input
        v-model="authStore.password"
        type="password"
        required
        minlength="5"
    /></label>
    <button type="submit" :disabled="authStore.loading">
      {{ authStore.loading ? "Signing in…" : "Sign in" }}
    </button>
  </form>
</template>

<script setup>
import { useAuthStore } from "../store/auth.store";
const authStore = useAuthStore();
</script>

<style scoped>
.form {
  display: grid;
  gap: 12px;
}
label {
  display: grid;
  gap: 6px;
  font-size: 14px;
}
input {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
}
button {
  padding: 10px 12px;
  border-radius: 10px;
  border: none;
  background: #111827;
  color: #fff;
}
button:disabled {
  opacity: 0.7;
}
</style>
