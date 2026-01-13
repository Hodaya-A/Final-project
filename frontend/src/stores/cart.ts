import { defineStore } from 'pinia'
import { db } from '@/services/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  shopId?: string // ✅ מזהה החנות
  shopName?: string // ✅ שם החנות
  sellerId?: string // ✅ מזהה המוכר (Firebase UID)
}

interface CartState {
  items: CartItem[]
  isCartOpen: boolean
}

const CART_STORAGE_KEY = 'fresh_end_cart'

type ShopConflictDetail = {
  resolve: (accept: boolean) => void
  existingShopId?: string
  incomingShopId?: string
  existingShopName?: string
  incomingShopName?: string
}

function requestSingleShopApproval(
  existingShopId?: string,
  incomingShopId?: string,
  existingShopName?: string,
  incomingShopName?: string,
) {
  return new Promise<boolean>((resolve) => {
    const timeoutId = window.setTimeout(() => resolve(false), 20000)

    const guardedResolve = (value: boolean) => {
      window.clearTimeout(timeoutId)
      resolve(value)
    }

    window.dispatchEvent(
      new CustomEvent<ShopConflictDetail>('single-shop-cart-conflict', {
        detail: {
          resolve: guardedResolve,
          existingShopId,
          incomingShopId,
          existingShopName,
          incomingShopName,
        },
      }),
    )
  })
}

export const useCartStore = defineStore('cart', {
  state: (): CartState => {
    // טען מ-localStorage בעת אתחול
    let items: CartItem[] = []
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        items = JSON.parse(stored) as CartItem[]
      }
    } catch {
      /* ignore parse/storage errors */
    }
    return {
      items,
      isCartOpen: false,
    }
  },

  getters: {
    totalItems: (state): number => state.items.reduce((sum, item) => sum + item.quantity, 0),

    totalPrice: (state): number =>
      state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  },

  actions: {
    // שמור לוקאלי ב-localStorage
    persistToLocal() {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items))
      } catch {
        /* ignore storage quota errors */
      }
    },
    // בקשה להוספה לסל — בלי quantity חובה
    async addToCart(payload: {
      id: string
      name: string
      price: number
      imageUrl?: string
      shopId?: string // ✅ מזהה החנות
      shopName?: string // ✅ שם החנות
      sellerId?: string // ✅ מזהה המוכר
      quantity?: number
    }) {
      console.log('🛒 [Cart] addToCart called with:', payload)

      const existingShopId = this.items[0]?.shopId
      const existingShopName = this.items[0]?.shopName
      const incomingShopId = payload.shopId
      const incomingShopName = payload.shopName

      console.log('🛒 [Cart] Shop validation:', {
        existingShopId,
        incomingShopId,
        itemsInCart: this.items.length,
        match: existingShopId === incomingShopId,
      })

      // חנות אחת בכל פעם: אם יש סל קיים מחנויות אחרת, הצג אישור לפני מחיקה
      if (
        this.items.length > 0 &&
        existingShopId &&
        incomingShopId &&
        existingShopId !== incomingShopId
      ) {
        const shouldReset = await requestSingleShopApproval(
          existingShopId,
          incomingShopId,
          existingShopName,
          incomingShopName,
        )
        if (!shouldReset) return

        this.clearCart()
      }

      const qty = payload.quantity ?? 1
      const image = payload.imageUrl ?? ''

      const existing = this.items.find((item) => item.id === payload.id)

      if (existing) {
        existing.quantity += qty
      } else {
        const newItem = {
          id: payload.id,
          name: payload.name,
          price: payload.price,
          imageUrl: image,
          shopId: payload.shopId, // ✅
          shopName: payload.shopName, // ✅
          sellerId: payload.sellerId, // ✅
          quantity: qty,
        }
        console.log('🛒 [Cart] Created new item:', newItem)
        this.items.push(newItem)
      }

      // שמור לוקאלי + spoon in server save
      this.persistToLocal()
      console.log('🛒 [Cart] After persist, items in localStorage:', this.items)

      try {
        this.autoSave?.()
      } catch {
        /* ignore */
      }
    },

    removeFromCart(id: string) {
      this.items = this.items.filter((item) => item.id !== id)
      this.persistToLocal()
      try {
        this.autoSave?.()
      } catch {
        /* ignore */
      }
    },

    increaseQuantity(id: string) {
      const item = this.items.find((item) => item.id === id)
      if (item) item.quantity++
      this.persistToLocal()
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
      this.persistToLocal()
      try {
        this.autoSave?.()
      } catch {
        /* ignore */
      }
    },

    clearCart() {
      this.items = []
      this.persistToLocal()
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
              const serverCart = d.cart as CartItem[]
              // מזג עם localStorage: שמור items מהserver + שמור locally חדשים
              const localIds = new Set(this.items.map((i) => i.id))
              const newItems = serverCart.filter((item) => !localIds.has(item.id))
              this.items = [...this.items, ...newItems]
              this.persistToLocal()
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
