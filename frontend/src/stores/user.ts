// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/services/firebase'

type Role = '' | 'user' | 'admin' | 'storeManager'

export const useUserStore = defineStore('user', () => {
  // --- state ---
  const email = ref<string>('')
  const name = ref<string>('')
  const role = ref<Role>('')
  const storeId = ref<string>('') // 👈 חדש
  const ready = ref<boolean>(false) // 👈 אות שהחנות נטענה

  // --- getters ---
  const isLoggedIn = computed(() => !!email.value)
  const isAdmin = computed(() => role.value === 'admin')
  const isStoreManager = computed(() => role.value === 'storeManager')
  const isUser = computed(() => role.value === 'user')

  // --- actions ---
  function setUser(userEmail: string, userRole: Role, userName = '', userStoreId = '') {
    email.value = userEmail || ''
    role.value = userRole || ''
    name.value = userName || ''
    storeId.value = userStoreId || ''
    saveToLocalStorage()
  }

  function clearUser() {
    email.value = ''
    role.value = ''
    name.value = ''
    storeId.value = ''
    saveToLocalStorage()
  }

  function saveToLocalStorage() {
    const payload = {
      email: email.value,
      name: name.value,
      role: role.value,
      storeId: storeId.value,
    }
    localStorage.setItem('userStore', JSON.stringify(payload))
  }

  function loadFromLocalStorage() {
    const raw = localStorage.getItem('userStore')
    if (!raw) return
    try {
      const obj = JSON.parse(raw) as Partial<{
        email: string
        name: string
        role: Role
        storeId: string
      }>
      email.value = obj.email ?? ''
      name.value = obj.name ?? ''
      role.value = (obj.role as Role) ?? ''
      storeId.value = obj.storeId ?? ''
    } catch {
      /* ignore */
    }
  }

  // נטען מה-Firestore לפי המשתמש המחובר (ה־router קורא לזה לפני בדיקות הרשאה)
  async function hydrateFromAuth() {
    loadFromLocalStorage() // ננסה לתת משהו מהר
    const u = auth.currentUser
    if (!u) {
      ready.value = true
      return
    }

    try {
      const snap = await getDoc(doc(db, 'users', u.uid))
      if (snap.exists()) {
        // const data = snap.data() as any
        type UserDoc = {
          email?: string
          name?: string
          role?: '' | 'user' | 'admin' | 'storeManager'
          storeId?: string
        }

        const data = snap.data() as UserDoc

        setUser(
          data.email ?? u.email ?? '',
          (data.role as Role) ?? '',
          data.name ?? '',
          data.storeId ?? '',
        )
      } else {
        // אין מסמך משתמש — ננקה כדי לא להטעות
        clearUser()
      }
    } finally {
      ready.value = true
    }
  }

  async function logout() {
    try {
      await auth.signOut()
    } catch {}
    clearUser()
  }

  return {
    // state
    email,
    name,
    role,
    storeId,
    ready,
    // getters
    isLoggedIn,
    isAdmin,
    isStoreManager,
    isUser,
    // actions
    setUser,
    clearUser,
    saveToLocalStorage,
    loadFromLocalStorage,
    hydrateFromAuth,
    logout,
  }
})
