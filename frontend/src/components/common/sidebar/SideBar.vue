<template>
  <nav class="c-sidebar">
    <ul class="c-sidebar__list">
      <li>
        <router-link to="/chat" class="c-sidebar__link">💬 Chat</router-link>
      </li>
      <li v-if="isAdmin">
        <router-link to="/users" class="c-sidebar__link">👥 Users</router-link>
      </li>
      <li>
        <router-link to="/settings" class="c-sidebar__link"
          >⚙️ Settings</router-link
        >
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "@/features/auth/store/auth.store";
import "./sidebar.css";

const auth = useAuthStore();
const isAdmin = computed(() => auth.user?.role === "admin");
</script>
