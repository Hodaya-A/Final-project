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
  const storeId = ref('')
  const role = ref<'user' | 'admin' | 'storeManager' | ''>('')
  const courierOptIn = ref(false)
  const initialized = ref(false)

  function setUser(
    userUid: string,
    userEmail: string,
    userRole: 'user' | 'admin' | 'storeManager',
    userName: string = '',
    userStoreId: string = '',
    userCourierOptIn: boolean = false,
  ) {
    uid.value = userUid
    email.value = userEmail
    role.value = userRole
    name.value = userName
    storeId.value = userStoreId
    courierOptIn.value = userCourierOptIn
  }

  async function logout() {
    const prevUid = uid.value

    // Save cart to server for this user so it will be restored on next login
    try {
      const m = await import('@/stores/cart')
      const cart = m.useCartStore()
      await cart.saveToServer(prevUid)
    } catch {
      /* ignore save errors */
    }

    // Clear local user state
    uid.value = ''
    email.value = ''
    role.value = ''
    name.value = ''
    courierOptIn.value = false

    // Clear local cart to avoid showing previous user's items to another user
    try {
      const m2 = await import('@/stores/cart')
      const cart2 = m2.useCartStore()
      cart2.clearCart()
    } catch {
      /* ignore */
    }
  }

  // טעינה אוטומטית של המשתמש בעת רענון הדף
  async function initializeUser() {
    if (initialized.value) return
    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const userRef = doc(db, 'users', user.uid)
          const snapshot = await getDoc(userRef)

          let role: 'user' | 'admin' | 'storeManager' = 'user'
          if (snapshot.exists()) {
            const docData = snapshot.data()
            if (docData.role === 'admin' || docData.role === 'storeManager') {
              role = docData.role
            } else {
              role = 'user'
            }
          }

          const docData = snapshot.exists() ? snapshot.data() : {}
          const sId = (docData && docData.storeId) || ''
          const courier = (docData && docData.courierOptIn) || false
          setUser(user.uid, user.email || '', role, user.displayName || '', sId, courier)
          // Load stored cart for this user (if any)
          try {
            const m = await import('@/stores/cart')
            const cart = m.useCartStore()
            await cart.loadFromServer(user.uid)
          } catch {
            /* ignore load errors */
          }
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
  const isStoreManager = computed(() => role.value === 'storeManager')
  const isUser = computed(() => role.value === 'user')
  const isCourier = computed(() => courierOptIn.value)

  return {
    uid,
    email,
    name,
    storeId,
    role,
    courierOptIn,
    initialized,
    isLoggedIn,
    isAdmin,
    isStoreManager,
    isUser,
    isCourier,
    setUser,
    logout,
    initializeUser,
  }
})
