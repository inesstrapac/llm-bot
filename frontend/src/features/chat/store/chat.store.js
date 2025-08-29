import { defineStore } from "pinia";
import { ref, nextTick, computed } from "vue";
import {
  createMessage,
  findAllConversationsForUser,
  findAllMessagesByConversationId,
} from "../api";
import router from "@/app/router";

export const useChatStore = defineStore("chat", () => {
  const inputEl = ref(null);
  const scrollEl = ref(null);
  const conversationId = ref();
  const conversations = ref([]);
  const messages = ref([]);
  const messageInput = ref("");

  function $resetConversation() {
    conversationId.value = null;
    messages.value = [];
  }

  async function startNewConversation() {
    $resetConversation();
  }

  async function fetchConversations() {
    conversations.value = await findAllConversationsForUser();
  }
  async function fetchMessages(convoId) {
    setConversationId(convoId);
    console.log("convoId", convoId);
    messages.value = await findAllMessagesByConversationId(Number(convoId));
  }
  async function setConversationId(convoId) {
    conversationId.value = convoId;
  }

  const sortedConversations = computed(() =>
    [...conversations.value].sort(
      (a, b) =>
        new Date(b.dateCreated ?? b.createdAt ?? 0) -
        new Date(a.dateCreated ?? a.createdAt ?? 0)
    )
  );

  function formatTime(d) {
    return new Date(d).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function autoGrow(e) {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  async function onSubmit() {
    await send();
    await nextTick();
  }

  async function send() {
    const text = messageInput.value.trim();
    if (!text) return;
    messageInput.value = "";

    if (!conversationId.value) {
      const savedMessage = await createMessage({
        content: text,
        isPrompt: true,
      });
      await setConversationId(savedMessage.conversation.id);
      console.log(savedMessage);
      await fetchConversations();
      await router.push({
        name: "chat",
        params: { id: savedMessage.conversation.id },
      });
    } else {
      await createMessage({
        content: text,
        isPrompt: true,
        conversationId: Number(conversationId.value),
      });
      await fetchConversations();
    }
    await fetchMessages(conversationId.value);
  }

  return {
    messages,
    messageInput,
    scrollEl,
    inputEl,
    conversations,
    sortedConversations,
    startNewConversation,
    fetchConversations,
    fetchMessages,
    send,
    formatTime,
    autoGrow,
    onSubmit,
    $resetConversation,
  };
});
