import { defineStore } from 'pinia'
import api from '@/services/api'

// ✅ טיפוס מוצר (מתואם עם השרת והאקסל החדש)
export interface Product {
  _id: string
  name: string
  // ⭐ הוספנו את השדות החסרים כדי למנוע שגיאות ב-TypeScript:
  brand?: string
  description?: string

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
    { name: 'לחם ומאפים טריים', keywords: ['לחם', 'מאפה', 'באגט', 'פיתה', 'חלה', 'לחמניה'] },
    { name: 'פארם ותינוקות', keywords: ['חיתול', 'תינוק', 'תרופה', 'שמפו', 'משחה', 'מגבונים'] },
    { name: 'חד פעמי ומטבח', keywords: ['צלחת', 'כוס', 'סכו"ם', 'חד פעמי', 'נייר', 'מגבת'] },
    {
      name: 'אחזקת הבית ובע"ח',
      keywords: ['מטאטא', 'חומר ניקוי', 'מזון לחיות', 'אקונומיקה', "ג'ל"],
    },
    { name: 'חטיפים ומתוקים', keywords: ['חטיף', 'שוקולד', 'עוגיה', 'במבה', 'ביסלי', 'ופל'] },
    { name: 'קטניות ודגנים', keywords: ['אורז', 'עדשים', 'פסטה', 'קוסקוס', 'פתיתים', 'קמח'] },
    { name: 'שימורים ובישול', keywords: ['שימורים', 'רסק', 'שמן', 'טונה', 'תירס', 'זיתים'] },
    { name: 'קפואים', keywords: ['גלידה', 'פיצה', 'קפוא', 'שניצל', 'בורקס'] },
    {
      name: 'אורגני ובריאות',
      keywords: ['אורגני', 'בריאות', 'טבעי', 'ללא גלוטן', 'סויה', 'שקדים'],
    },
    { name: 'משקאות', keywords: ['קולה', 'מים', 'מיץ', 'בירה', 'סודה', 'שתייה'] },
    { name: 'בשר ודגים', keywords: ['בשר', 'דג', 'עוף', 'נקניק', 'סטייק', 'סלמון'] },
    {
      name: 'חלב, ביצים וסלטים',
      keywords: ['חלב', 'ביצה', 'סלט', 'גבינה', 'יוגורט', 'קוטג', 'חמאה'],
    },
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
