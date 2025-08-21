<template>
  <!-- 1) Portal to body -->
  <teleport to="body">
    <TransitionRoot :show="open" as="template">
      <Dialog as="div" class="hdui" @close="emit('close')">
        <!-- overlay -->
        <TransitionChild
          as="template"
          enter="ease-out duration-150"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-100"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="modal-overlay" />
        </TransitionChild>

        <!-- 2) fixed full-screen wrapper that centers the panel -->
        <div class="hdui__wrap">
          <TransitionChild
            as="template"
            enter="ease-out duration-150"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="ease-in duration-100"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel class="modal">
              <header class="modal__header">
                <DialogTitle class="modal__title">{{ title }}</DialogTitle>
                <button
                  class="btn btn--ghost modal__close"
                  @click="emit('close')"
                  aria-label="Close"
                >
                  ×
                </button>
              </header>

              <div class="modal__body">
                <slot />
              </div>

              <footer class="modal__footer">
                <slot name="footer" />
              </footer>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>
  </teleport>
</template>

<script setup>
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { toRefs } from "vue";
import { defineEmits, defineProps } from "vue";
import "./editdialog.css";

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "Edit" },
});
const { open, title } = toRefs(props);
const emit = defineEmits(["close"]);
</script>
