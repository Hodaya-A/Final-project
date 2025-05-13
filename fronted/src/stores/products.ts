import { defineStore } from 'pinia'
import api from '@/services/api' // ודאי שהנתיב נכון

// הגדרת טיפוס בסיסי למוצר
interface Product {
  _id: string
  name: string
  price: number
}

export const useProductStore = defineStore('products', {
  state: () => ({
    items: [] as Product[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchProducts() {
      this.loading = true
      this.error = null

      try {
        const res = await api.get('/products')
        this.items = res.data
      } catch (err: any) {
        console.error('Error fetching products:', err)
        this.error = 'Failed to load products'
      } finally {
        this.loading = false
      }
    },
  },
})
