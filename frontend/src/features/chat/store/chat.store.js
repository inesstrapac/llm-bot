import { defineStore } from "pinia";
import { ref, nextTick, computed, onMounted, watch } from "vue";
import {
  createMessage,
  findAllConversationsForUser,
  findAllMessagesByConversationId,
  findAllCollections,
} from "../api";
import router from "@/app/router";
import { useRoute } from "vue-router";

export const useChatStore = defineStore("chat", () => {
  const inputEl = ref(null);
  const scrollEl = ref(null);
  const conversationId = ref();
  const conversations = ref([]);
  const messages = ref([]);
  const collections = ref([]);
  const selectedCollectionName = ref();
  const messageInput = ref("");
  const disableInputField = ref();

  function $resetConversation() {
    conversationId.value = null;
    messages.value = [];
    selectedCollectionName.value = "";
    disableInputField.value = false;
  }
  const route = useRoute();

  onMounted(async () => {
    collections.value = await findAllCollections();
    const currentConvoId = route.params.id;
    if (currentConvoId) {
      await fetchMessages(currentConvoId);
      scrollToBottom();
    } else {
      $resetConversation();
    }
  });

  watch(
    () => route.params.id,
    async (newId) => {
      if (newId) {
        await fetchMessages(newId);
      } else {
        $resetConversation();
      }
      scrollToBottom();
    }
  );

  async function startNewConversation() {
    $resetConversation();
  }

  async function fetchConversations() {
    conversations.value = await findAllConversationsForUser();
  }
  async function fetchMessages(convoId) {
    setConversationId(convoId);
    messages.value = await findAllMessagesByConversationId(Number(convoId));
    if (messages.value.length !== 0) {
      if (messages.value[0].collectionName != null) {
        selectedCollectionName.value = messages.value[0].collectionName;
      }
    }
  }

  function setConversationId(convoId) {
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

  function setInputEl(el) {
    inputEl.value = el;
  }

  function setScrollEl(el) {
    scrollEl.value = el;
  }

  function scrollToBottom() {
    scrollEl.value.scrollTop = scrollEl.value.scrollHeight;
  }

  function autoGrow(e) {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  async function onSubmit() {
    if (inputEl.value) {
      inputEl.value.style.height = "auto";
    }
    await send();
    await nextTick();
  }

  async function send() {
    disableInputField.value = true;
    const text = messageInput.value.trim();
    if (!text) return;
    messageInput.value = "";
    if (!conversationId.value) {
      const savedMessage = await createMessage({
        content: text,
        isPrompt: true,
        collectionName: selectedCollectionName.value,
      });
      setConversationId(savedMessage.conversation.id);
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
        collectionName: selectedCollectionName.value,
      });
      await fetchConversations();
    }
    await fetchMessages(conversationId.value);
    scrollToBottom();
    await createMessage({
      content: text,
      isPrompt: false,
      conversationId: Number(conversationId.value),
      collectionName: selectedCollectionName.value,
    });
    disableInputField.value = false;
    await fetchMessages(conversationId.value);
    scrollToBottom();
  }

  return {
    messages,
    collections,
    selectedCollectionName,
    conversationId,
    messageInput,
    scrollEl,
    inputEl,
    conversations,
    sortedConversations,
    disableInputField,
    setInputEl,
    setScrollEl,
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
