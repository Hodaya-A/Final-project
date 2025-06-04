import { db } from './firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import type { CartItem } from '@/stores/cart'

export async function saveOrder(email: string, items: CartItem[], total: number) {
  const ref = collection(db, 'orders') // ✅ לא תת־collection

  const orderData = {
    items,
    total,
    userEmail: email,           // ✅ זה השדה שהשאילתה שלך דורשת
    date: Timestamp.now()
  }

  await addDoc(ref, orderData)
}
