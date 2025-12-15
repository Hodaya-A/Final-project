// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, db } from '@/services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export const useUserStore = defineStore('user', () => {
  const uid = ref('')
  const email = ref('')
  const name = ref('')
  const role = ref<'user' | 'admin' | ''>('')
  const initialized = ref(false)

  function setUser(
    userUid: string,
    userEmail: string,
    userRole: 'user' | 'admin',
    userName: string = '',
  ) {
    uid.value = userUid
    email.value = userEmail
    role.value = userRole
    name.value = userName
  }

  function logout() {
    uid.value = ''
    email.value = ''
    role.value = ''
    name.value = ''
  }

  // טעינה אוטומטית של המשתמש בעת רענון הדף
  async function initializeUser() {
    if (initialized.value) return
    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userRef = doc(db, 'users', user.uid)
          const snapshot = await getDoc(userRef)

          let role: 'user' | 'admin' = 'user'
          if (snapshot.exists()) {
            const docData = snapshot.data()
            role = docData.role === 'admin' ? 'admin' : 'user'
          }

          setUser(user.uid, user.email || '', role, user.displayName || '')
        } else {
          logout()
        }
        initialized.value = true
        if (typeof unsubscribe === 'function') unsubscribe()
        resolve()
      })
    })
  }

  const isLoggedIn = computed(() => !!uid.value)
  const isAdmin = computed(() => role.value === 'admin')

  return {
    uid,
    email,
    name,
    role,
    initialized,
    isLoggedIn,
    isAdmin,
    setUser,
    logout,
    initializeUser,
  }
})
