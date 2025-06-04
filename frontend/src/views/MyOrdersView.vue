<template>
  <div class="orders-page">
    <h1>היסטוריית רכישות</h1>

    <div v-if="loading">🔄 טוען הזמנות...</div>

    <div v-else-if="orders.length === 0">לא נמצאו הזמנות קודמות.</div>

    <ul v-else>
      <li v-for="(order, i) in orders" :key="i">
        <p><strong>תאריך:</strong> {{ formatDate(order.date) }}</p>
        <p><strong>סכום:</strong> ₪{{ order.total.toFixed(2) }}</p>
        <p><strong>מוצרים:</strong> {{ summarizeItems(order.items) }}</p>
        <hr />
      </li>
    </ul>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { db } from '@/services/firebase'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'

const orders = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const userStore = useUserStore()

watch(
  () => userStore.email,
  async (email) => {
    console.log('📧 email detected:', email)

    if (!email) {
      error.value = 'לא ניתן לטעון הזמנות – אין משתמש מחובר.'
      loading.value = false
      return
    }

    try {
      loading.value = true
      error.value = ''

      const q = query(
        collection(db, 'orders'),
        where('userEmail', '==', email),
        orderBy('date', 'desc')
      )

      const snapshot = await getDocs(q)
      orders.value = snapshot.docs.map(doc => doc.data())

      console.log('📦 מספר הזמנות שנמצאו:', orders.value.length)
      orders.value.forEach((order, i) => {
        console.log(`🔹 הזמנה ${i + 1}:`, order)
      })
    } catch (err: any) {
      console.error('❌ שגיאה בעת טעינת הזמנות:', err)
      error.value = 'אירעה שגיאה בעת טעינת ההזמנות.'
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)

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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

li {
  margin-bottom: 1rem;
}

.error {
  color: red;
  font-weight: bold;
  margin-top: 1rem;
  text-align: center;
}
</style>
