<template>
  <form @submit.prevent="onSubmit" class="form">
    <label>Name<input v-model.trim="name" required /></label>
    <label>Surname<input v-model.trim="surname" required /></label>
    <label>Email<input v-model.trim="email" type="email" required /></label>
    <label
      >Password<input v-model="password" type="password" required minlength="6"
    /></label>
    <button :disabled="auth.loading">
      {{ auth.loading ? "Creating…" : "Create account" }}
    </button>
  </form>
</template>

<script setup>
import { ref, defineEmits } from "vue";
import { useAuthStore } from "../store/auth.store";
const emit = defineEmits(["success"]);
const auth = useAuthStore();

const name = ref("");
const surname = ref("");
const email = ref("");
const password = ref("");

async function onSubmit() {
  await auth.signUp({
    name: name.value,
    surname: surname.value,
    email: email.value,
    password: password.value,
  });
  emit("success");
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
</style>
