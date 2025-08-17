import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/features/auth/store/auth.store";

const routes = [
  {
    path: "/",
    name: "authentication",
    component: () => import("../../features/auth/pages/AuthenticationPage.vue"),
    meta: { layout: "authentication" },
  },
  {
    path: "/chat",
    name: "chat",
    component: () => import("../../features/chat/pages/ChatPage.vue"),
    meta: { requiresAuth: true, layout: "default" },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  if (!to.meta.requiresAuth) return;
  const authentication = useAuthStore();
  if (!authentication.isAuthenticated) {
    return { name: "authentication", query: { next: to.fullPath } };
  }
});

export default router;
