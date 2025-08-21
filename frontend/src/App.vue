<template>
  <component :is="layoutComp">
    <router-view />
  </component>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import AuthLayout from "./layouts/authentication/AuthLayout.vue";
import DefaultLayout from "./layouts/default/DefaultLayout.vue";
import { useAuthStore } from "./features/auth/store/auth.store";

const route = useRoute();
const layoutComp = computed(() =>
  route.meta.layout === "authentication" ? AuthLayout : DefaultLayout
);

const auth = useAuthStore();
onMounted(() => auth.bootstrap());
</script>
