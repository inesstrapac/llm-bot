<script setup>
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../store/auth.store";
import LoginForm from "../components/LoginForm.vue";
import RegisterForm from "../components/RegisterForm.vue";
import "../styles/auth.css";

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

function goNext() {
  router.replace(route.query.next || "/homepage");
}
</script>

<template>
  <section>
    <h1 class="auth-title">Welcome</h1>

    <div class="auth-tabs">
      <button
        :class="{ active: authStore.tab === 'login' }"
        @click="authStore.setTab('login')"
      >
        Login
      </button>
      <button
        :class="{ active: authStore.tab === 'register' }"
        @click="authStore.setTab('register')"
      >
        Register
      </button>
    </div>

    <LoginForm v-if="authStore.tab === 'login'" @success="goNext" />
    <RegisterForm v-else @success="authStore.tab = 'login'" />

    <p v-if="authStore.error" class="auth-err">{{ authStore.error }}</p>
  </section>
</template>
