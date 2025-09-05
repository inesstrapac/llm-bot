<template>
  <div ref="root" v-html="safeHtml"></div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, computed } from "vue";
import DOMPurify from "dompurify";
import { defineProps } from "vue";

const props = defineProps({ content: { type: String, required: true } });
const root = ref(null);

const safeHtml = computed(() => DOMPurify.sanitize(props.content));

function waitForMathJax() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.MathJax?.startup?.promise) {
        window.MathJax.startup.promise.then(() => resolve());
      } else if (window.MathJax) {
        resolve();
      } else {
        setTimeout(check, 50);
      }
    };
    check();
  });
}

async function typeset() {
  await nextTick();
  await waitForMathJax();
  if (!root.value) return;
  if (window.MathJax.typesetClear) {
    window.MathJax.typesetClear([root.value]);
  }
  await window.MathJax.typesetPromise([root.value]);
}

onMounted(typeset);
watch(() => props.content, typeset, { flush: "post" });
</script>
