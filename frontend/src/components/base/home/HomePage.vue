<template>
  <div class="home fill-parent">
    <div class="home__illustration" aria-hidden="true"></div>
    <div class="home__content">
      <div class="home__header">
        <h1 class="home__title">Where to next?</h1>
      </div>
      <div class="home__actions">
        <RouterLink to="/chat" class="home__button">Chat</RouterLink>
        <RouterLink v-if="isAdmin" to="/users" class="home__button"
          >Users</RouterLink
        >
        <RouterLink to="/settings" class="home__button">Settings</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import "./homepage.css";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { computed } from "vue";

const auth = useAuthStore();
const isAdmin = computed(() => auth.user?.role === "admin");
</script>
