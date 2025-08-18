import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/features/auth/store/auth.store";
import DefaultLayout from "@/layouts/default/DefaultLayout.vue";
import HomePage from "../../components/base/home/HomePage.vue";
import ChatPage from "../../features/chat/pages/ChatPage.vue";

const routes = [
  {
    path: "/authentication",
    name: "authentication",
    component: () => import("../../features/auth/pages/AuthenticationPage.vue"),
    meta: { layout: "authentication" },
  },
  {
    path: "/",
    component: DefaultLayout,
    meta: { layout: "default", requiresAuth: true },
    children: [
      { path: "", redirect: { name: "homepage" } }, // <— default child
      { path: "homepage", name: "homepage", component: HomePage },
      { path: "chat", name: "chat", component: ChatPage },
    ],
  },
  /* {
    path: "/chat",
    name: "chat",
    component: () => import("../../features/chat/pages/ChatPage.vue"),
    meta: { requiresAuth: true, layout: "default" },
  }, */
  /* {
    path: "/homepage",
    name: "homepage",
    component: () => import("../../components/base/home/HomePage.vue"),
    meta: { requiresAuth: true, layout: "default" },
  }, */
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
