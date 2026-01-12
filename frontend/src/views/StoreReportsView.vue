<template>
  <div class="store-reports" v-if="isStoreManager">
    <h1>דוחות לחנות שלך</h1>

    <div class="buttons">
      <button @click="loadReport('pending')">הזמנות ממתינות לאישור</button>
      <button @click="loadReport('sales')">דוח מכירות</button>
      <button @click="loadReport('expiring')">מוצרים בתוקף קרוב</button>
      <button @click="loadReport('unsold')">מוצרים שלא נמכרו</button>
    </div>

    <div v-if="loading">⏳ טוען...</div>

    <!-- דוח הזמנות ממתינות -->
    <div v-if="reportType === 'pending' && reportData" class="report-section">
      <h2>📋 הזמנות ממתינות לאישור</h2>
      <p v-if="reportData.count === 0" class="empty-message">אין הזמנות ממתינות</p>
      <table v-else>
        <thead>
          <tr>
            <th>מספר הזמנה</th>
            <th>לקוח</th>
            <th>סכום</th>
            <th>תאריך</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in reportData.orders" :key="order._id">
            <td>{{ order._id.substring(0, 8) }}</td>
            <td>{{ order.userEmail }}</td>
            <td>₪{{ order.totalPrice.toFixed(2) }}</td>
            <td>{{ formatDate(order.createdAt) }}</td>
            <td><button @click="approveOrder(order._id)">אישור</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- דוח מכירות -->
    <div v-if="reportType === 'sales' && reportData" class="report-section">
      <h2>📈 דוח מכירות</h2>
      <p><strong>סה"כ הכנסות:</strong> ₪{{ reportData.totalRevenue.toFixed(2) }}</p>
      <p><strong>סה"כ הזמנות:</strong> {{ reportData.orderCount }}</p>

      <table>
        <thead>
          <tr>
            <th>מוצר</th>
            <th>כמות</th>
            <th>סה"כ הכנסה</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, name) in reportData.productStats" :key="name">
            <td>{{ name }}</td>
            <td>{{ item.sold }}</td>
            <td>₪{{ item.total.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- דוח תפוגה -->
    <div v-if="reportType === 'expiring' && reportData" class="report-section">
      <h2>⏰ מוצרים שתוקפם קרוב</h2>
      <table>
        <thead>
          <tr>
            <th>שם</th>
            <th>מחיר</th>
            <th>תפוגה</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in reportData" :key="item._id">
            <td>{{ item.name }}</td>
            <td>₪{{ item.priceDiscounted }}</td>
            <td>{{ formatDate(item.expiryDate) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- דוח מוצרים לא נמכרו -->
    <div v-if="reportType === 'unsold' && reportData" class="report-section">
      <h2>🚫 מוצרים שלא נמכרו כלל</h2>
      <table>
        <thead>
          <tr>
            <th>שם</th>
            <th>מחיר</th>
            <th>קטגוריה</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in reportData" :key="item._id">
            <td>{{ item.name }}</td>
            <td>₪{{ item.priceDiscounted }}</td>
            <td>{{ item.category }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

const userStore = useUserStore()
const isStoreManager = computed(() => userStore.role === 'storeManager')
const sellerId = userStore.uid // שתמש ב-uid של מנהל החנות, לא ב-email

const reportType = ref('')
const loading = ref(false)
const reportData = ref<any>(null)

async function loadReport(type: string) {
  reportType.value = type
  loading.value = true

  try {
    const { data } = await axios.get(`/api/reports/${type}?sellerId=${sellerId}`)
    reportData.value = data
  } catch (err) {
    console.error('שגיאה בטעינת דוח', err)
  } finally {
    loading.value = false
  }
}

async function approveOrder(orderId: string) {
  try {
    await axios.post(`/api/orders/${orderId}/approve`, {})
    // טען מחדש את הדוח
    loadReport('pending')
  } catch (err) {
    console.error('שגיאה באישור הזמנה', err)
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('he-IL')
}
</script>

<style scoped>
.store-reports {
  max-width: 1000px;
  margin: auto;
  padding: 2rem;
  direction: rtl;
}

.buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

button {
  background: #2c3e50;
  color: white;
  border: none;
  padding: 0.75rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

button:hover {
  background: #34495e;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: white;
}

th,
td {
  border: 1px solid #ddd;
  padding: 0.75rem;
  text-align: right;
}

th {
  background-color: #f0f0f0;
}
</style>
