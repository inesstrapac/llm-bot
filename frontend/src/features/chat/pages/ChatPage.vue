<template>
  <div class="main-container fill-parent">
    <section class="chat">
      <div class="chat__scroll" :ref="chatStore.setScrollEl">
        <ul class="chat__messages">
          <select
            v-model="chatStore.selectedCollectionName"
            class="chat__select"
            aria-label="Collection"
            :disabled="chatStore.conversationId !== null"
          >
            <option disabled value="">Select collection…</option>
            <option
              v-for="collection in chatStore.collections"
              :key="collection.id"
              :value="collection.name"
            >
              {{ collection.name }}
            </option>
          </select>
          <li :class="['msg', 'msg--bot']">
            <div class="msg__bubble">
              <p class="msg__text">Hi! How can I help you?</p>
            </div>
          </li>
          <li
            v-for="message in chatStore.messages"
            :key="message.id"
            :class="['msg', message.isPrompt ? 'msg--user' : 'msg--bot']"
          >
            <div class="msg__bubble">
              <MathMessage :content="message.content" class="msg__text" />
              <time class="msg__meta">{{
                chatStore.formatTime(message.dateCreated)
              }}</time>
            </div>
          </li>
        </ul>
      </div>

      <form class="chat__composer" @submit.prevent="chatStore.onSubmit">
        <textarea
          :ref="chatStore.setInputEl"
          v-model="chatStore.messageInput"
          class="chat__input"
          :placeholder="
            chatStore.selectedCollectionName
              ? 'Type a message…'
              : 'Please select a collection to send a message'
          "
          rows="1"
          :disabled="
            !chatStore.selectedCollectionName || chatStore.disableInputField
          "
          @input="chatStore.autoGrow"
          @keydown.enter.exact.prevent="chatStore.onSubmit"
          @keydown.enter.shift.exact.stop
          aria-label="Message"
        ></textarea>

        <button
          class="chat__send"
          type="submit"
          :disabled="!chatStore.messageInput.trim()"
        >
          Send
        </button>
      </form>
    </section>
  </div>
</template>

<script setup>
import { onBeforeUnmount } from "vue";
import { useChatStore } from "@/features/chat/store/chat.store";
import MathMessage from "../components/MathMessage.vue";
import "../styles/chat.css";
import "../../../assets/styles/main.css";
import router from "@/app/router";

const chatStore = useChatStore();

onBeforeUnmount(() => {
  if (router.currentRoute.value.name === "chat.new") {
    chatStore.startNewConversation();
  }
});
</script>
