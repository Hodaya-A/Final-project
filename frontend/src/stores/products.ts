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
  shopName?: string
  sellerId?: string
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
        const res: ApiResponse = await api.get('/products', { params })
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

// Utility function to detect category based on product name
function detectCategory(productName: string): string {
  const categories = [
    { name: 'לחם ומאפים טריים', keywords: ['לחם', 'מאפה', 'באגט'] },
    { name: 'פארם ותינוקות', keywords: ['חיתול', 'תינוק', 'תרופה'] },
    { name: 'חד פעמי או מטבח', keywords: ['צלחת', 'כוס', 'סכו"ם'] },
    { name: 'אחזקת הבית ובעלי חיים', keywords: ['מטאטא', 'חומר ניקוי', 'מזון לחיות'] },
    { name: 'חטיפים ומתוקים', keywords: ['חטיף', 'שוקולד', 'עוגיה'] },
    { name: 'קטניות ודגנים שימורים ובישול', keywords: ['אורז', 'עדשים', 'שימורים'] },
    { name: 'קפואים', keywords: ['גלידה', 'פיצה', 'קפוא'] },
    { name: 'אורגני ובריאות', keywords: ['אורגני', 'בריאות', 'טבעי'] },
    { name: 'עשירים השקעות', keywords: ['השקעה', 'עשיר'] },
    { name: 'בשר ודגים', keywords: ['בשר', 'דג', 'עוף'] },
    { name: 'חלב ביצים וסלטים', keywords: ['חלב', 'ביצה', 'סלט'] },
  ]

  for (const category of categories) {
    if (category.keywords.some((keyword) => productName.includes(keyword))) {
      return category.name
    }
  }

  return 'לא מוגדר'
}

// Export the function for use in other components
export { detectCategory }
