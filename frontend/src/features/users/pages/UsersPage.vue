<template>
  <div class="main-container fill-parent">
    <div class="user-card user-card--flush user-card--edge">
      <div class="table-viewport">
        <table class="users-table">
          <colgroup>
            <col class="col-name" />
            <col class="col-name" />
            <col class="col-value" />
            <col class="col-value" />
            <col class="col-value" />
          </colgroup>

          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Surname</th>
              <th scope="col">Email</th>
              <th scope="col">Role</th>
              <th scope="col">Active</th>
            </tr>
          </thead>

          <!-- Loading / Empty states -->
          <tbody v-if="userStore.loading">
            <tr>
              <td colspan="6">Loading…</td>
            </tr>
          </tbody>
          <tbody v-else-if="userStore.users.length === 0">
            <tr>
              <td colspan="6">No users found.</td>
            </tr>
          </tbody>

          <!-- Users -->
          <tbody v-else>
            <tr v-for="u in userStore.users" :key="u.id ?? u.email">
              <td class="cell-name">{{ u.name || "—" }}</td>
              <td class="cell-name">{{ u.surname || "—" }}</td>
              <td class="cell-value">{{ u.email || "—" }}</td>
              <td class="cell-value">{{ u.role || "user" }}</td>
              <td class="cell-value">{{ u.isActive ? "Yes" : "No" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { userListStore } from "../store/users.store";
import "../styles/users.css";
import "../../../assets/styles/main.css";

const userStore = userListStore();

onMounted(() => {
  userStore.loadUsers();
});

onBeforeRouteLeave(() => {
  userStore.$resetState();
});
</script>
