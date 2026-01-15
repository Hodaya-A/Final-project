<template>
  <div class="store-reports">
    <h1 class="page-title">דוחות לחנות שלך</h1>

    <div class="buttons">
      <button @click="loadReport('sales')" :class="{ active: reportType === 'sales' }">
        דוח מכירות ומלאי
      </button>
      <button @click="loadReport('expiring')" :class="{ active: reportType === 'expiring' }">
        מוצרים בתוקף קרוב
      </button>
      <button @click="loadReport('unsold')" :class="{ active: reportType === 'unsold' }">
        מוצרים שלא נמכרו
      </button>
    </div>

    <div v-if="loading" class="loading-state">טוען נתונים...</div>

    <div v-if="reportType === 'sales' && reportData" class="report-section fade-in">
      <div class="summary-cards">
        <div class="card">
          <span>סה"כ הכנסות</span>
          <strong>₪{{ getSafeTotalRevenue() }}</strong>
        </div>
        <div class="card">
          <span>סה"כ הזמנות</span>
          <strong>{{ getSafeOrderCount() }}</strong>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>מוצר</th>
              <th>במלאי כרגע</th>
              <th>כמות שנמכרה</th>
              <th>סה"כ הכנסה</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in getSalesItems()" :key="index">
              <td>{{ item.name }}</td>
              <td>
                <span class="stock-badge">
                  {{ item.currentStock ?? '-' }}
                </span>
              </td>
              <td>{{ item.sold ?? 0 }}</td>
              <td>₪{{ (item.total ?? 0).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="reportType === 'expiring' && reportData" class="report-section fade-in">
      <h2>מוצרים שתוקפם קרוב</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>שם המוצר</th>
              <th>מחיר</th>
              <th>מלאי</th>
              <th>תאריך תפוגה</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in reportData" :key="item._id">
              <td>{{ item.name }}</td>
              <td>₪{{ (item.priceDiscounted || item.price || 0).toFixed(2) }}</td>
              <td>
                <span class="stock-badge">
                  {{ item.quantity ?? item.countInStock ?? item.stock ?? '-' }}
                </span>
              </td>
              <td class="expiry-date">{{ formatDate(item.expiryDate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="reportType === 'unsold' && reportData" class="report-section fade-in">
      <h2>מוצרים שלא נמכרו כלל</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>שם המוצר</th>
              <th>מחיר</th>
              <th>מלאי נוכחי</th>
              <th>קטגוריה</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in reportData" :key="item._id">
              <td>{{ item.name }}</td>
              <td>₪{{ (item.priceDiscounted || item.price || 0).toFixed(2) }}</td>
              <td>
                <span class="stock-badge" :class="{ 'missing-data': getStock(item) === '-' }">
                  {{ getStock(item) }}
                </span>
              </td>
              <td>{{ item.category }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

const userStore = useUserStore()

// ✅ התיקון הגדול: פונקציה נקייה ללא שגיאות טיפוסים
const sellerId = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const store: any = userStore
  return store.email || store.uid || (store.user && store.user.email) || ''
})

const reportType = ref('')
const loading = ref(false)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const reportData = ref<any>(null)

async function loadReport(type: string) {
  reportType.value = type
  loading.value = true
  reportData.value = null

  try {
    const id = sellerId.value
    if (!id) {
      console.error('לא נמצא מזהה מוכר')
      return
    }

    console.log('🔍 טוען דוח:', type, 'עבור מוכר:', id)
    const { data } = await axios.get(`/api/reports/${type}?sellerId=${id}`)
    console.log('📊 תגובה מהשרת:', data)
    reportData.value = data
  } catch (err) {
    console.error('שגיאה בטעינת דוח', err)
  } finally {
    loading.value = false
  }
}

// פונקציית עזר למציאת המלאי בצורה בטוחה
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStock(item: any) {
  // בודק את כל האפשרויות לשם של שדה המלאי
  const val = item.quantity ?? item.countInStock ?? item.stock
  // אם הערך לא קיים (undefined/null), מחזיר מקף. אם הוא 0, מחזיר 0.
  return val !== undefined && val !== null ? val : '-'
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('he-IL')
}

// פונקציות עזר לדוח מכירות
function getSafeTotalRevenue() {
  if (!reportData.value) return '0.00'
  const revenue = reportData.value.totalRevenue ?? reportData.value.total ?? 0
  return Number(revenue).toFixed(2)
}

function getSafeOrderCount() {
  if (!reportData.value) return 0
  return reportData.value.orderCount ?? reportData.value.count ?? 0
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSalesItems(): any[] {
  if (!reportData.value) return []

  // אם יש productStats כאובייקט - להמיר למערך
  if (reportData.value.productStats && typeof reportData.value.productStats === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.entries(reportData.value.productStats).map(([name, data]: [string, any]) => ({
      name,
      currentStock: data.quantity ?? data.currentStock ?? data.stock ?? '-',
      sold: data.sold ?? 0,
      total: data.total ?? 0,
    }))
  }

  // אם זה כבר מערך
  if (Array.isArray(reportData.value.productStats)) {
    return reportData.value.productStats
  }

  // אם reportData עצמו הוא מערך
  if (Array.isArray(reportData.value)) {
    return reportData.value
  }

  return []
}
</script>

<style scoped>
.store-reports {
  max-width: 1000px;
  margin: 2rem auto;
  padding: 2rem;
  direction: rtl;
  background-color: #f9f9f9;
  border-radius: 16px;
  min-height: 80vh;
}

.page-title {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2rem;
}

.buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

button {
  background: white;
  color: #555;
  border: 1px solid #ddd;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

button:hover {
  transform: translateY(-2px);
  border-color: #8e44ad;
  color: #8e44ad;
}

button.active {
  background: linear-gradient(135deg, #8e44ad, #9b59b6);
  color: white;
  border: none;
  box-shadow: 0 4px 10px rgba(142, 68, 173, 0.3);
}

.loading-state {
  text-align: center;
  font-size: 1.2rem;
  color: #888;
  margin-top: 2rem;
}

.report-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.5s ease-in-out;
}

.report-section h2 {
  margin-top: 0;
  color: #8e44ad;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
}

.summary-cards {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 12px;
  flex: 1;
  text-align: center;
  border: 1px solid #eee;
}

.card strong {
  display: block;
  font-size: 1.5rem;
  color: #2c3e50;
  margin-top: 0.5rem;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}

th,
td {
  padding: 1rem;
  text-align: right;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f4fb;
  color: #8e44ad;
  font-weight: 700;
  white-space: nowrap;
}

.stock-badge {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.stock-badge.missing-data {
  background-color: #f1f1f1;
  color: #999;
}

.expiry-date {
  color: #e74c3c;
  font-weight: bold;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
