// src/features/users/store/users.store.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { get } from "../api";

export const userListStore = defineStore("users", () => {
  const users = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // dialog/edit state (optional, for the Edit button)
  const showDialog = ref(false);

  async function loadUsers() {
    loading.value = true;
    error.value = null;
    try {
      const res = await get(); // <-- fetch ALL users
      // Accept common API shapes
      const list = res && res.data !== undefined ? res.data : res;
      users.value = Array.isArray(list) ? list : (list?.users ?? []);
    } catch (e) {
      console.error("Failed to load users", e);
      error.value = e;
      users.value = [];
    } finally {
      loading.value = false;
    }
  }

  function $resetState() {
    showDialog.value = false;
    loading.value = false;
    error.value = null;
  }

  // optional: quick count
  const total = computed(() => users.value.length);

  return {
    // state
    users,
    loading,
    error,
    total,
    showDialog,

    // actions
    loadUsers,
    $resetState,
  };
});
