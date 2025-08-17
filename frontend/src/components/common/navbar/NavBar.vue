<template>
  <nav class="c-nav">
    <strong>Mathematics ChatBot</strong>
    <div class="c-nav__spacer" />
    <template v-if="auth.isAuthenticated">
      <button class="c-nav__btn" @click="auth.signOut()">Logout</button>
    </template>
    <template v-else>
      <router-link class="c-nav__link" to="/">Login</router-link>
    </template>
  </nav>
</template>

<script setup>
import { useAuthStore } from "../../../features/auth/store/auth.store";
import "./navbar.css";
const auth = useAuthStore();
</script>
