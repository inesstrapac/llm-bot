<template>
  <div class="app-shell">
    <NavBar />

    <div class="app-body">
      <aside
        class="app-aside"
        :class="{ 'is-collapsed': !uiStore.sidebarOpen }"
        :aria-hidden="!uiStore.sidebarOpen"
      >
        <SideBar />
      </aside>

      <main class="app-main">
        <slot />
        <!-- page content goes here -->
      </main>
    </div>
  </div>
</template>

<script setup>
import NavBar from "@/components/common/navbar/NavBar.vue";
import SideBar from "@/components/common/sidebar/SideBar.vue";
import { useUiStore } from "@/features/ui/store/ui.store";
const uiStore = useUiStore();
</script>
