<template>
  <div class="app-shell">
    <NavBar />

    <div class="app-body">
      <aside
        class="app-aside"
        :class="{
          'is-collapsed': !uiStore.sidebarOpen,
          'is-chat': isChatRoute,
        }"
        :aria-hidden="!uiStore.sidebarOpen"
      >
        <SideBar />
      </aside>

      <main class="app-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import NavBar from "@/components/common/navbar/NavBar.vue";
import SideBar from "@/components/common/sidebar/SideBar.vue";
import { useUiStore } from "@/features/ui/store/ui.store";
import router from "@/app/router";

const isChatRoute = computed(() =>
  ["chat.new", "chat"].includes(router.currentRoute.value.name)
);
const uiStore = useUiStore();
</script>
