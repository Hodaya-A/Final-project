import { defineStore } from 'pinia'
import api from '@/services/api'

// ✅ טיפוס מוצר (מתואם עם השרת)
export interface Product {
  _id: string
  name: string
  price: number
  salePrice?: number
  quantity?: number
  category?: string
  expiryDate?: string
  imageUrl?: string
  shopId?: string
  updatedAt?: string
}

// ✅ טיפוס לתשובה מהשרת
interface ApiResponse {
  data: Product[]
}

export const useProductStore = defineStore('products', {
  state: () => ({
    items: [] as Product[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchProducts(params: Record<string, string | number> = {}): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const res: ApiResponse = await api.get('/api/inventory', { params })
        this.items = res.data
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('❌ Error fetching products:', err.message)
          this.error = err.message
        } else {
          console.error('❌ Unknown error fetching products:', err)
          this.error = 'שגיאה לא צפויה בטעינת מוצרים'
        }
      } finally {
        this.loading = false
      }
    },
  },
})
