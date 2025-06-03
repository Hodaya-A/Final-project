import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const email = ref('')
  const role = ref<'user' | 'admin' | ''>('') // 👈 טיפוס מדויק

  function setUser(userEmail: string, userRole: 'user' | 'admin') {
    email.value = userEmail
    role.value = userRole
  }

  function logout() {
    email.value = ''
    role.value = ''
  }

  const isLoggedIn = computed(() => !!email.value)
  const isAdmin = computed(() => role.value === 'admin')

  return {
    email,
    role,
    isLoggedIn,
    isAdmin,
    setUser,
    logout,
  }
})
