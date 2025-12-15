import { defineStore } from 'pinia'

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
    },

    removeFromCart(id: string) {
      this.items = this.items.filter((item) => item.id !== id)
    },

    increaseQuantity(id: string) {
      const item = this.items.find((item) => item.id === id)
      if (item) item.quantity++
    },

    decreaseQuantity(id: string) {
      const item = this.items.find((item) => item.id === id)
      if (item && item.quantity > 1) item.quantity--
      else this.removeFromCart(id)
    },

    clearCart() {
      this.items = []
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
