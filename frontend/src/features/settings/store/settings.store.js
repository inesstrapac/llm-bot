import { useAuthStore } from "@/features/auth/store/auth.store";
import { ref, computed, nextTick } from "vue";
import { defineStore } from "pinia";
import { update } from "../api";

export const useSettingsStore = defineStore("settings", () => {
  const authStore = useAuthStore();
  const showDialog = ref(false);
  const editingRow = ref(null);
  const inputText = ref("");
  const valueBool = ref(false);
  const inputRef = ref(null);
  const loading = ref(false);
  function $resetState() {
    showDialog.value = false;
    editingRow.value = null;
    inputText.value = "";
    valueBool.value = false;
    inputRef.value = null;
    loading.value = false;
  }

  async function updateUser(dataToUpdate) {
    loading.value = true;
    try {
      const updatedUser = await update(authStore.user.id, dataToUpdate);
      authStore.user = updatedUser;
    } catch (e) {
      //throw e;
    } finally {
      loading.value = false;
    }
  }

  function startEdit(row) {
    editingRow.value = row;
    if (row.key === "isActive") {
      valueBool.value = !!authStore.user?.isActive;
    } else {
      inputText.value = (row.value ?? "").toString();
      nextTick(() => inputRef.value?.focus());
    }
    showDialog.value = true;
  }
  function cancelEdit() {
    showDialog.value = false;
    editingRow.value = null;
  }
  async function saveEdit() {
    if (!editingRow.value) return;
    const key = editingRow.value.key;
    const next =
      key === "isActive" ? !!valueBool.value : inputText.value.trim();
    await updateUser({ [key]: next });
    cancelEdit();
  }

  const rows = computed(() => [
    {
      key: "name",
      label: "Name",
      value: authStore.user?.name ?? "",
      deletable: false,
      editable: true,
    },
    {
      key: "surname",
      label: "Surname",
      value: authStore.user?.surname ?? "",
      deletable: true,
      editable: true,
    },
    {
      key: "email",
      label: "Email",
      value: authStore.user?.email ?? "",
      deletable: false,
      editable: true,
    },
    {
      key: "password",
      label: "Password",
      value: "•".repeat(10),
      deletable: false,
      editable: true,
    },
    {
      key: "role",
      label: "Role",
      value: authStore.user?.role ?? "user",
      deletable: false,
      editable: false,
    },
    {
      key: "isActive",
      label: "Active",
      value: authStore.user?.isActive ? "Yes" : "No",
      deletable: false,
      editable: false,
    },
  ]);

  return {
    showDialog,
    editingRow,
    inputText,
    rows,
    startEdit,
    cancelEdit,
    saveEdit,
    updateUser,
    $resetState,
  };
});
