// src/services/orders.ts
import axios from 'axios'
import type { CartItem } from '@/stores/cart'

export async function saveOrder(
  userId: string,
  userEmail: string,
  shopId: string,
  sellerId: string,
  items: CartItem[],
  totalPrice: number,
  deliveryMethod: 'delivery' | 'pickup' = 'delivery',
) {
  console.log('📤 [saveOrder] Sending POST to backend with:', {
    userId,
    userEmail,
    shopId,
    itemsCount: items.length,
    totalPrice,
  })

  try {
    const response = await axios.post('http://localhost:3000/api/orders', {
      userId,
      userEmail, // ✅ שלח את הדוא"ל
      shopId,
      sellerId,
      items,
      totalPrice,
      deliveryMethod,
    })

    console.log('📥 [saveOrder] Success! Response:', response.status, response.data)
    return response
  } catch (error: unknown) {
    console.error('❌ [saveOrder] Error:', error)
    throw error
  }
}
