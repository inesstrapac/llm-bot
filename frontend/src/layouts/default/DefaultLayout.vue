<template>
  <div class="app-shell">
    <header class="app-nav">
      <NavBar />
    </header>

    <aside v-if="true" class="app-aside">
      <SideBar />
    </aside>

    <main class="app-main">
      <slot />
      <!-- page content goes here -->
    </main>

    <!-- optional footer -->
    <!-- <footer class="app-foot"> … </footer> -->
  </div>
</template>

<script setup>
import NavBar from "@/components/common/navbar/NavBar.vue";
import SideBar from "@/components/common/sidebar/SideBar.vue";
</script>
