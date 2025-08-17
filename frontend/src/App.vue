<template>
  <component :is="layoutComp">
    <router-view />
  </component>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import AuthLayout from "./layouts/authentication/AuthLayout.vue";
import DefaultLayout from "./layouts/default/DefaultLayout.vue";

const route = useRoute();
const layoutComp = computed(() =>
  route.meta.layout === "authentication" ? AuthLayout : DefaultLayout
);
</script>
