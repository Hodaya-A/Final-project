<template>
  <div class="admin-reports">
    <h1>📊 דוחות מנהל</h1>

    <div class="buttons">
      <button @click="loadReport('sales')">📈 דוח מכירות</button>
      <button @click="loadReport('expiring')">⏰ מוצרים קרובים לתפוגה</button>
      <button @click="loadReport('unsold')">🚫 מוצרים שלא נמכרו</button>
    </div>

    <div v-if="loading">⏳ טוען דוח...</div>

    <div v-if="reportType === 'sales' && reportData" class="report-section print-area">
      <h2>📈 דוח מכירות</h2>
      <p><strong>סה"כ הכנסות:</strong> ₪{{ reportData.totalRevenue.toFixed(2) }}</p>
      <p><strong>סה"כ הזמנות:</strong> {{ reportData.orderCount }}</p>

      <table>
        <thead>
          <tr>
            <th>מוצר</th>
            <th>נמכר (כמות)</th>
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

    <div v-if="reportType === 'expiring' && reportData" class="report-section print-area">
      <h2>⏰ מוצרים שקרובים לתפוגה</h2>
      <table>
        <thead>
          <tr>
            <th>שם</th>
            <th>מחיר</th>
            <th>תאריך תפוגה</th>
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

    <div v-if="reportType === 'unsold' && reportData" class="report-section print-area">
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

    <div v-if="reportType && reportData" class="print-btn">
      <button @click="printReport">🖨️ הדפס דוח</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { fetchSalesReport, fetchExpiringProducts, fetchUnsoldProducts } from '@/services/reports'

const reportData = ref<any>(null)
const reportType = ref<string>('')
const loading = ref(false)

async function loadReport(type: string) {
  reportType.value = type
  loading.value = true

  if (type === 'sales') {
    reportData.value = await fetchSalesReport()
  } else if (type === 'expiring') {
    reportData.value = await fetchExpiringProducts()
  } else if (type === 'unsold') {
    reportData.value = await fetchUnsoldProducts()
  }

  loading.value = false
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('he-IL')
}
function printReport() {
  window.print()
}
</script>

<style scoped>
.admin-reports {
  max-width: 1000px;
  margin: auto;
  padding: 2rem;
  direction: rtl;
  text-align: right;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

button {
  padding: 0.75rem 1.2rem;
  font-weight: bold;
  font-size: 1rem;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
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
}

th {
  background-color: #f0f0f0;
}

.print-btn {
  margin-top: 2rem;
}
@media print {
  /* הסתרת כל מה שלא בדוח */
  body * {
    visibility: hidden;
  }

  .print-area,
  .print-area * {
    visibility: visible;
  }

  .print-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background: white;
    padding: 1rem;
  }

  /* הסתרת כפתור הדפסה */
  .print-btn {
    display: none !important;
  }

  /* הסתרת כפתורים / ניווט */
  .buttons,
  nav,
  header,
  footer {
    display: none !important;
  }
}
</style>
