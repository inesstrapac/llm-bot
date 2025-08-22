import { useAuthStore } from "@/features/auth/store/auth.store";
import { ref, computed, nextTick } from "vue";
import { defineStore } from "pinia";
import { update } from "../api";

export const useSettingsStore = defineStore("settings", () => {
  const authStore = useAuthStore();
  const showDialog = ref(false);
  const editingRow = ref(null);
  const inputText = ref("");
  const oldPassword = ref("");
  const valueBool = ref(false);
  const inputRef = ref(null);
  const loading = ref(false);
  const showNewPassword = ref(false);
  const showOldPassword = ref(false);
  function $resetState() {
    editingRow.value = null;
    inputText.value = "";
    oldPassword.value = "";
    valueBool.value = false;
    inputRef.value = null;
    loading.value = false;
    showNewPassword.value = false;
    showOldPassword.value = false;
  }

  function startEdit(row) {
    $resetState();
    editingRow.value = row;
    if (row.key === "isActive") {
      valueBool.value = !!authStore.user?.isActive;
    } else if (row.key === "password") {
      inputText.value = "";
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

    if (oldPassword.value) {
      await updateUser({ oldPassword: oldPassword.value, [key]: next });
    } else {
      await updateUser({ [key]: next });
    }
    cancelEdit();
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
    oldPassword,
    showOldPassword,
    showNewPassword,
    rows,
    startEdit,
    cancelEdit,
    saveEdit,
    updateUser,
    $resetState,
  };
});
