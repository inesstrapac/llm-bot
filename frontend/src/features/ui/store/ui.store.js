import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";

export const useUiStore = defineStore("ui", () => {
  const route = useRoute();
  const sidebarOpen = ref(route.name !== "homepage");
  const isHomeButtonPresent = ref(route.name !== "homepage");
  const apply = () => {
    sidebarOpen.value = route.name !== "homepage";
    isHomeButtonPresent.value = route.name !== "homepage";
  };
  watch(() => route.fullPath, apply, { immediate: true });
  return { sidebarOpen, isHomeButtonPresent };
});
