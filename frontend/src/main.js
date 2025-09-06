import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./app/router";
import "./assets/styles/main.css";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import { toastOptions } from "./app/toast/toastOptions";

const app = createApp(App).use(Toast, toastOptions);
app.use(createPinia());
app.use(router);

router.isReady().then(() => {
  app.mount("#app");
});
