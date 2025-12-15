// src/services/orders.ts
import axios from 'axios'
import type { CartItem } from '@/stores/cart'

export async function saveOrder(userId: string, items: CartItem[], totalPrice: number) {
  console.log('📤 [saveOrder] Sending POST to backend with:', {
    userId,
    itemsCount: items.length,
    totalPrice,
  })

  try {
    const response = await axios.post('http://localhost:3000/api/orders', {
      userId,
      items,
      totalPrice,
    })

    console.log('📥 [saveOrder] Success! Response:', response.status, response.data)
    return response
  } catch (error: unknown) {
    console.error('❌ [saveOrder] Error:', error)
    throw error
  }
}
