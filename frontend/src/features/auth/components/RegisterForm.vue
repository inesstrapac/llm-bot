<template>
  <form @submit.prevent="authStore.onSubmit" class="form">
    <label>Name<input v-model.trim="authStore.name" required /></label>
    <label>Surname<input v-model.trim="authStore.surname" required /></label>
    <label
      >Email<input v-model.trim="authStore.email" type="email" required
    /></label>
    <label
      >Password<input
        v-model="authStore.password"
        type="password"
        required
        minlength="6"
    /></label>
    <button :disabled="authStore.loading">
      {{ authStore.loading ? "Creating…" : "Create account" }}
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
</style>
