// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const email = ref('')
  const name = ref('')
  const role = ref<'user' | 'admin' | ''>('')

  function setUser(userEmail: string, userRole: 'user' | 'admin', userName: string = '') {
    email.value = userEmail
    role.value = userRole
    name.value = userName
  }

  function logout() {
    email.value = ''
    role.value = ''
    name.value = ''
  }

  const isLoggedIn = computed(() => !!email.value)
  const isAdmin = computed(() => role.value === 'admin')

  return {
    email,
    name,
    role,
    isLoggedIn,
    isAdmin,
    setUser,
    logout,
  }
})
