<template>
  <nav
    class="c-sidebar"
    :class="{ 'c-sidebar--centered': !isChatRoute }"
    aria-label="Primary"
  >
    <ul v-if="!isChatRoute" class="c-sidebar__list">
      <li>
        <router-link
          :to="{ name: 'chat.new' }"
          class="c-sidebar__link c-sidebar__link--filled"
        >
          Chat
        </router-link>
      </li>

      <li v-if="isAdmin">
        <router-link
          to="/users"
          class="c-sidebar__link c-sidebar__link--filled"
        >
          Users
        </router-link>
      </li>

      <li>
        <router-link
          to="/settings"
          class="c-sidebar__link c-sidebar__link--filled"
        >
          Settings
        </router-link>
      </li>
    </ul>

    <div v-else>
      <ul class="c-sidebar__list">
        <li>
          <router-link
            :to="{ name: 'chat.new' }"
            @click="chatStore.startNewConversation()"
            class="c-sidebar__link"
          >
            New conversation
          </router-link>
        </li>
      </ul>

      <h1>History</h1>
      <ul v-if="chatStore.sortedConversations.length" class="c-sidebar__list">
        <li
          v-for="conversation in chatStore.sortedConversations"
          :key="conversation.id"
        >
          <router-link
            :to="{ name: 'chat', params: { id: conversation.id } }"
            class="c-sidebar__link"
          >
            {{ conversation.name || `Conversation #${conversation.id}` }}
          </router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useAuthStore } from "@/features/auth/store/auth.store";
import router from "@/app/router";
import { useChatStore } from "@/features/chat/store/chat.store";
import "./sidebar.css";

const auth = useAuthStore();
const chatStore = useChatStore();

const isAdmin = computed(() => auth.user?.role === "admin");
const isChatRoute = computed(() =>
  ["chat.new", "chat"].includes(router.currentRoute.value.name)
);
onMounted(() => chatStore.fetchConversations());
</script>
