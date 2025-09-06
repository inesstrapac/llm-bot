<template>
  <form @submit.prevent="onSubmit" class="form">
    <label>Email<input v-model.trim="email" type="text" required /></label>
    <label
      >Password<input v-model="password" type="password" required minlength="5"
    /></label>
    <button type="submit" :disabled="auth.loading">
      {{ auth.loading ? "Signing in…" : "Sign in" }}
    </button>
  </form>
</template>

<script setup>
import { ref, defineEmits } from "vue";
import { useAuthStore } from "../store/auth.store";
const emit = defineEmits(["success"]);
const auth = useAuthStore();
const email = ref("");
const password = ref("");

async function onSubmit() {
  try {
    await auth.signIn(email.value, password.value);
    emit("success");
  } catch (error) {
    return error?.response?.data?.message || "Invalid credentials";
  }
}
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
