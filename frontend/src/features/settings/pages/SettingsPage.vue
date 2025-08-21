<template>
  <div class="main-container fill-parent">
    <div class="card card--flush card--edge">
      <table class="settings-table">
        <colgroup>
          <col class="col-name" />
          <col class="col-value" />
          <col class="col-actions" />
        </colgroup>

        <thead>
          <tr>
            <th scope="col">Setting</th>
            <th scope="col">Value</th>
            <th scope="col" class="txt-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="row in settingsStore.rows" :key="row.key">
            <th scope="row" class="cell-name">{{ row.label }}</th>
            <td class="cell-value">
              <span
                v-if="
                  row.value !== null &&
                  row.value !== undefined &&
                  row.value !== ''
                "
              >
                {{ row.value }}
              </span>
              <span v-else class="muted">—</span>
            </td>
            <td class="cell-actions">
              <button
                class="btn"
                :disabled="!row.editable"
                @click="settingsStore.startEdit(row)"
              >
                Edit
              </button>
              <button class="btn btn--ghost" :disabled="!row.deletable">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <EditDialog
        :open="settingsStore.showDialog"
        :title="`Edit ${settingsStore.editingRow?.label ?? ''}`"
        @close="settingsStore.cancelEdit()"
      >
        <form @submit.prevent="settingsStore.saveEdit()" class="edit-form">
          <div
            v-if="
              settingsStore.editingRow &&
              settingsStore.editingRow.key !== 'isActive'
            "
          >
            <label
              class="form-label"
              :for="`field-${settingsStore.editingRow.key}`"
              >{{ settingsStore.editingRow?.label }}</label
            >
            <input
              :id="`field-${settingsStore.editingRow.key}`"
              ref="inputRef"
              class="form-input"
              type="text"
              v-model="settingsStore.inputText"
            />
          </div>
          <div class="modal-actions">
            <button class="btn" type="submit">Save</button>
            <button
              class="btn btn--ghost"
              type="button"
              @click="settingsStore.cancelEdit()"
            >
              Cancel
            </button>
          </div>
        </form>
      </EditDialog>
    </div>
  </div>
</template>

<script setup>
import { onBeforeRouteLeave } from "vue-router";
import EditDialog from "@/components/common/EditDialog.vue";
import { useSettingsStore } from "../store/settings.store";
import "../styles/settings.css";
import "../../../assets/styles/main.css";

const settingsStore = useSettingsStore();
onBeforeRouteLeave(() => {
  settingsStore.$resetState();
});
</script>
