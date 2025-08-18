import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./app/router";
import "./assets/styles/main.css";

const app = createApp(App);
app.use(createPinia());
app.use(router);

router.isReady().then(() => {
  app.mount("#app");
});
