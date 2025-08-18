<template>
  <header class="c-nav" role="navigation">
    <!-- Left: Home -->
    <router-link
      v-if="uiStore.isHomeButtonPresent"
      to="/homepage"
      class="c-nav__homebtn"
    >
      <!-- You can swap the SVG for an <img> if you prefer a picture -->
      <svg viewBox="0 0 24 24" class="c-nav__homeicon" aria-hidden="true">
        <path
          d="M3 11l9-7 9 7"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
        />
        <path
          d="M5 10v10h14V10"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
          stroke-linecap="round"
        />
      </svg>
      <span class="c-nav__hometext">Home</span>
    </router-link>

    <!-- Center: Title -->
    <h1 class="c-nav__title">Mathematics ChatBot</h1>

    <!-- Right: Auth -->
    <div class="c-nav__auth">
      <template v-if="authStore.isAuthenticated">
        <button class="c-nav__btn" @click="authStore.signOut()">Logout</button>
      </template>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from "@/features/auth/store/auth.store";
import "./navbar.css";
import { useUiStore } from "@/features/ui/store/ui.store";
const authStore = useAuthStore();
const uiStore = useUiStore();
</script>
