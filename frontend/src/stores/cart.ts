import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as { id: string; name: string; price: number }[]
  }),
  actions: {
    addToCart(product: { id: string; name: string; price: number }) {
      this.items.push(product)
    },
    removeFromCart(id: string) {
      this.items = this.items.filter(item => item.id !== id)
    }
  }
})
