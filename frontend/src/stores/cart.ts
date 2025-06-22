import { defineStore } from 'pinia'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    isCartOpen: false,
  }),

  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),

    totalPrice: (state) => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  },

  actions: {
    addToCart(product: { id: string; name: string; price: number; imageUrl?: string }) {
      const existing = this.items.find((item) => item.id === product.id)
      if (existing) existing.quantity++
      else this.items.push({ ...product, quantity: 1 })
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
      if (item && item.quantity > 1) {
        item.quantity--
      } else {
        this.removeFromCart(id)
      }
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
