import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./app/router";
import "./assets/styles/main.css"; // includes the layout CSS via @import

createApp(App).use(createPinia()).use(router).mount("#app");
