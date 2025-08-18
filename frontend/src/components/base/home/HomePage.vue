<template>
  <div class="homepage-body fill-parent">
    <div class="robot-bg" aria-hidden="true"></div>
    <div class="options-hp">
      <div class="homepage-title">
        <h1>Choose an option you want to view.</h1>
      </div>
      <div class="home-links">
        <RouterLink to="/chat" class="home-btn">Chat</RouterLink>
        <RouterLink to="/settings" class="home-btn">Settings</RouterLink>
        <RouterLink to="/chat" class="home-btn"
          >Third option leading to chat right now</RouterLink
        >
      </div>
    </div>
  </div>
</template>

<script setup>
import "./homepage.css";
</script>
