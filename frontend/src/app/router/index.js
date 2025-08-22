import { createRouter, createWebHistory } from "vue-router";

import { useAuthStore } from "@/features/auth/store/auth.store";

import DefaultLayout from "@/layouts/default/DefaultLayout.vue";

import AuthenticationPage from "../../features/auth/pages/AuthenticationPage.vue";
import HomePage from "../../components/base/home/HomePage.vue";
import ChatPage from "../../features/chat/pages/ChatPage.vue";
import SettingsPage from "@/features/settings/pages/SettingsPage.vue";
import UsersPage from "@/features/users/pages/UsersPage.vue";

const routes = [
  { path: "/", redirect: { name: "authentication" } },
  {
    path: "/authentication",
    name: "authentication",
    component: AuthenticationPage,
    meta: { layout: "authentication" },
  },
  {
    path: "/",
    component: DefaultLayout,
    meta: { layout: "default", requiresAuth: true },
    children: [
      { path: "homepage", name: "homepage", component: HomePage },
      { path: "chat", name: "chat", component: ChatPage },
      { path: "settings", name: "settings", component: SettingsPage },
      { path: "users", name: "users", component: UsersPage },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth);

  if (requiresAuth && !auth.isAuthenticated) {
    return { name: "authentication", query: { next: to.fullPath } };
  }
});

export default router;
