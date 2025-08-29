<template>
  <nav class="c-sidebar" aria-label="Primary">
    <ul
      v-if="
        router.currentRoute.value.name !== 'chat.new' &&
        router.currentRoute.value.name !== 'chat'
      "
      class="c-sidebar__list"
    >
      <li>
        <router-link to="/chat.new" class="c-sidebar__link"
          >💬 Chat</router-link
        >
      </li>
      <li v-if="isAdmin">
        <router-link to="/users" class="c-sidebar__link">👥 Users</router-link>
      </li>
      <li>
        <router-link to="/settings" class="c-sidebar__link"
          >⚙️ Settings</router-link
        >
      </li>
    </ul>

    <div
      v-if="
        router.currentRoute.value.name === 'chat.new' ||
        router.currentRoute.value.name === 'chat'
      "
    >
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
            @click="chatStore.fetchMessages(Number(conversation.id))"
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
import "./sidebar.css";
import router from "@/app/router";
import { useChatStore } from "@/features/chat/store/chat.store";

const auth = useAuthStore();
const chatStore = useChatStore();
const isAdmin = computed(() => auth.user?.role === "admin");
onMounted(() => chatStore.fetchConversations());
</script>
