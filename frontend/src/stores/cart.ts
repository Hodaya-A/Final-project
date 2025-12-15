import { defineStore } from 'pinia'
import { db } from '@/services/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

interface CartState {
  items: CartItem[]
  isCartOpen: boolean
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    items: [],
    isCartOpen: false,
  }),

  getters: {
    totalItems: (state): number => state.items.reduce((sum, item) => sum + item.quantity, 0),

    totalPrice: (state): number =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  },

  actions: {
    // בקשה להוספה לסל — בלי quantity חובה
    addToCart(payload: {
      id: string
      name: string
      price: number
      imageUrl?: string
      quantity?: number
    }) {
      const qty = payload.quantity ?? 1
      const image = payload.imageUrl ?? ''

      const existing = this.items.find((item) => item.id === payload.id)

      if (existing) {
        existing.quantity += qty
      } else {
        this.items.push({
          id: payload.id,
          name: payload.name,
          price: payload.price,
          imageUrl: image,
          quantity: qty,
        })
      }
      // try to persist change for logged-in user
      try {
        this.autoSave?.()
      } catch {
        /* ignore */
      }
    },

    removeFromCart(id: string) {
      this.items = this.items.filter((item) => item.id !== id)
      try {
        this.autoSave?.()
      } catch {
        /* ignore */
      }
    },

    increaseQuantity(id: string) {
      const item = this.items.find((item) => item.id === id)
      if (item) item.quantity++
      try {
        this.autoSave?.()
      } catch {
        /* ignore */
      }
    },

    decreaseQuantity(id: string) {
      const item = this.items.find((item) => item.id === id)
      if (item && item.quantity > 1) item.quantity--
      else this.removeFromCart(id)
      try {
        this.autoSave?.()
      } catch {
        /* ignore */
      }
    },

    clearCart() {
      this.items = []
      try {
        this.autoSave?.()
      } catch {
        /* ignore */
      }
    },

    async saveToServer(uid: string) {
      if (!uid) return
      try {
        await setDoc(doc(db, 'users', uid), { cart: this.items }, { merge: true })
      } catch (err) {
        console.error('Failed to save cart to server', err)
      }
    },

    async loadFromServer(uid: string) {
      if (!uid) return
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        if (snap.exists()) {
          const data = snap.data() as unknown
          if (data && typeof data === 'object') {
            const d = data as { cart?: unknown }
            if (Array.isArray(d.cart)) {
              this.items = d.cart as CartItem[]
            }
          }
        }
      } catch (err) {
        console.error('Failed to load cart from server', err)
      }
    },

    // attempt to auto-save current cart for logged-in user (uses dynamic import to avoid circular deps)
    async autoSave() {
      try {
        const mu = await import('@/stores/user')
        const userStore = mu.useUserStore()
        const uid = (userStore as unknown as { uid?: { value: string } }).uid?.value || ''
        if (uid) await this.saveToServer(uid)
      } catch {
        /* ignore */
      }
    },

    toggleCart() {
      this.isCartOpen = !this.isCartOpen
    },

    openCart() {
      this.isCartOpen = true
    },

    closeCart() {
      this.isCartOpen = false
    },
  },
})
