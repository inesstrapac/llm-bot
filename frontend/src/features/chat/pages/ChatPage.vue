<template>
  <div class="main-container fill-parent">
    <section class="chat">
      <div class="chat__scroll" ref="chatStore.scrollEl">
        <ul class="chat__messages">
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
              <p class="msg__text">{{ message.content }}</p>
              <time class="msg__meta">{{
                chatStore.formatTime(message.dateCreated)
              }}</time>
            </div>
          </li>
        </ul>
      </div>

      <form class="chat__composer" @submit.prevent="chatStore.onSubmit">
        <textarea
          ref="chatStore.inputEl"
          v-model="chatStore.messageInput"
          class="chat__input"
          placeholder="Type a message…"
          rows="1"
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
import { onMounted, onBeforeUnmount } from "vue";
import { useChatStore } from "@/features/chat/store/chat.store";
import "../styles/chat.css";
import "../../../assets/styles/main.css";
import router from "@/app/router";

const chatStore = useChatStore();

onMounted(() => {
  if (chatStore.scrollEl)
    chatStore.scrollEl.scrollTop = chatStore.scrollEl.scrollHeight;
});
onBeforeUnmount(() => {
  if (router.currentRoute.value.name === "chat.new") {
    console.log("onBeforeUnmount");
    chatStore.startNewConversation();
  }
});
</script>
