<script setup>
import { ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../store/auth.store";
import LoginForm from "../components/LoginForm.vue";
import RegisterForm from "../components/RegisterForm.vue";
import "../styles/auth.css";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const tab = ref("login");

function goNext() {
  router.replace(route.query.next || "/chat");
}
</script>

<template>
  <section>
    <h1 class="auth-title">Welcome</h1>

    <div class="auth-tabs">
      <button :class="{ active: tab === 'login' }" @click="tab = 'login'">
        Login
      </button>
      <button :class="{ active: tab === 'register' }" @click="tab = 'register'">
        Register
      </button>
    </div>

    <LoginForm v-if="tab === 'login'" @success="goNext" />
    <RegisterForm v-else @success="tab = 'register'" />

    <p v-if="auth.error" class="auth-err">{{ auth.error }}</p>
  </section>
</template>
