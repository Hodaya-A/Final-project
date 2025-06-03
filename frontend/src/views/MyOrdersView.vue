<template>
  <div class="orders-page">
    <h1>היסטוריית רכישות</h1>

    <div v-if="orders.length === 0">לא נמצאו הזמנות קודמות.</div>

    <ul v-else>
      <li v-for="(order, i) in orders" :key="i">
        <p><strong>תאריך:</strong> {{ formatDate(order.date) }}</p>
        <p><strong>סכום:</strong> ₪{{ order.total.toFixed(2) }}</p>
        <p><strong>מוצרים:</strong> {{ summarizeItems(order.items) }}</p>
        <hr />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { db } from '@/services/firebase'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import {  addDoc, Timestamp } from 'firebase/firestore'



import type { CartItem } from '@/stores/cart'




const orders = ref<any[]>([])
const userStore = useUserStore()

onMounted(async () => {
  console.log('📧 email:', userStore.email)
  if (!userStore.email) return

  const q = query(
    collection(db, 'orders'),
    where('userEmail', '==', userStore.email),
    orderBy('date', 'desc')
  )

  const snapshot = await getDocs(q)
  orders.value = snapshot.docs.map(doc => doc.data())
})

function formatDate(ts: any) {
  return ts?.toDate?.().toLocaleString('he-IL') || ''
}

function summarizeItems(items: any[]) {
  return items.map(i => `${i.name} (${i.quantity})`).join(', ')
}
</script>

<style scoped>
.orders-page {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

li {
  margin-bottom: 1rem;
}
</style>
