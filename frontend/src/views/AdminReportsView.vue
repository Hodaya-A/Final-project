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
  const elementsToHide: HTMLElement[] = []

  // הסתרת רכיבי סל ידועים
  document.querySelectorAll('.cart-badge, .cart-summary, .cart-icon, .total').forEach((el) => {
    const htmlEl = el as HTMLElement
    elementsToHide.push(htmlEl)
    htmlEl.setAttribute('data-prev-display', htmlEl.style.display)
    htmlEl.style.display = 'none'
  })

  // הסתרת כל span שמכיל בדיוק ספרה אחת (0–9)
  document.querySelectorAll('span').forEach((el) => {
    const htmlEl = el as HTMLElement
    const content = htmlEl.textContent?.trim()
    if (/^\d$/.test(content || '')) {
      elementsToHide.push(htmlEl)
      htmlEl.setAttribute('data-prev-display', htmlEl.style.display)
      htmlEl.style.display = 'none'
    }
  })

  // ביצוע ההדפסה
  window.print()

  // החזרת כל האלמנטים למצבם המקורי
  setTimeout(() => {
    elementsToHide.forEach((el) => {
      const prev = el.getAttribute('data-prev-display')
      el.style.display = prev || ''
    })
  }, 1000)
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
  body * {
    visibility: hidden !important;
    height: 0 !important;
    overflow: hidden;
  }

  .print-area,
  .print-area * {
    visibility: visible !important;
    height: auto !important;
    overflow: visible;
  }

  .print-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    background: white;
    padding: 2rem;
  }

  .print-btn,
  .buttons,
  .admin-reports > h1,
  nav,
  header,
  footer,
  .navbar,
  .topbar,
  .cart-summary,
  .cart-badge,
  .cart-icon,
  .total {
    display: none !important;
    visibility: hidden !important;
  }

  span {
    color: black !important;
  }

  /* במקרה וקיים שימוש ב-::before או ::after למספרים */
  span::before,
  span::after {
    display: none !important;
    content: none !important;
  }

  /* הגנה נוספת על span עם ספרות שלא חלק מהדוח */
  span:has(:not(:empty)):not(.print-area):not(.keep-print) {
    display: none !important;
  }
}
</style>
