<template>
  <nav class="navbar">
    <router-link to="/" class="logo">🍽️ Fresh End</router-link>

    <div class="nav-actions">
      <template v-if="userStore.currentUser">
        <span class="welcome">
          שלום, {{ userStore.currentUser.displayName || userStore.currentUser.email }}
        </span>
        <button class="btn logout-btn" @click="handleLogout">התנתק</button>
      </template>
      <template v-else>
        <router-link to="/login" class="btn">התחבר</router-link>
        <router-link to="/register" class="btn btn-secondary">הרשמה</router-link>
      </template>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { signOut } from 'firebase/auth'
import { auth } from '@/services/firebase'

const userStore = useUserStore()
const router = useRouter()

const handleLogout = async () => {
  await signOut(auth)
  userStore.logout()
  router.push('/')
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #2c3e50;
  color: white;
}

.logo {
  font-size: 1.5rem;
  color: white;
  text-decoration: none;
  font-weight: bold;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome {
  font-weight: bold;
}

.btn {
  padding: 0.4rem 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  text-decoration: none;
  cursor: pointer;
}

.btn:hover {
  background-color: #217dbb;
}

.btn-secondary {
  background-color: #1abc9c;
}

.btn-secondary:hover {
  background-color: #16a085;
}

.logout-btn {
  background-color: #e74c3c;
}

.logout-btn:hover {
  background-color: #c0392b;
}
</style>
