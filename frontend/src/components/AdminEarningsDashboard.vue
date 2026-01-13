<template>
  <div class="admin-earnings-dashboard">
    <h1>📊 הרווחים שלנו החודש</h1>
    <p class="subtitle">כמה הרווחנו החודש</p>

    <!-- Date Range Filter -->
    <div class="filter-section">
      <div class="date-inputs">
        <div class="form-group">
          <label for="startDate">מתאריך:</label>
          <input id="startDate" v-model="filters.startDate" type="date" @change="loadEarnings" />
        </div>
        <div class="form-group">
          <label for="endDate">עד תאריך:</label>
          <input id="endDate" v-model="filters.endDate" type="date" @change="loadEarnings" />
        </div>
        <button @click="setCurrentMonth" class="btn-secondary">החודש הנוכחי</button>
        <button @click="setLastMonth" class="btn-secondary">החודש הקודם</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>⏳ טוען נתונים...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-message">
      <p>❌ {{ error }}</p>
      <button @click="loadEarnings" class="btn-primary">נסה שוב</button>
    </div>

    <!-- Main Earnings Card -->
    <div v-else class="earnings-section">
      <div class="earnings-card">
        <div class="earnings-value">
          <span class="currency">₪</span>
          <span class="amount">{{ formatCurrency(earnings.total) }}</span>
        </div>
        <p class="label">סה"כ רווחים מפלטפורמה</p>
        <div class="stats-row">
          <div class="stat">
            <span class="stat-value">{{ earnings.ordersCount }}</span>
            <span class="stat-label">הזמנות</span>
          </div>
          <div class="stat">
            <span class="stat-value">₪{{ earnings.avgOrderValue }}</span>
            <span class="stat-label">ממוצע הזמנה</span>
          </div>
        </div>
      </div>

      <!-- Daily Chart -->
      <div class="chart-section" v-if="dailyEarnings.length > 0">
        <h2>📈 התפלגות יומית</h2>
        <div class="chart-container">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>

      <!-- Daily Breakdown Table -->
      <div class="table-section" v-if="dailyEarnings.length > 0">
        <h2>📋 פירוט יומי</h2>
        <table class="earnings-table">
          <thead>
            <tr>
              <th>תאריך</th>
              <th>רווחים</th>
              <th>הזמנות</th>
              <th>ממוצע לזמנה</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in dailyEarnings" :key="day._id">
              <td>{{ formatDate(day._id) }}</td>
              <td class="amount">₪{{ formatCurrency(day.dailyFee) }}</td>
              <td>{{ day.ordersCount }}</td>
              <td>₪{{ (day.dailyFee / day.ordersCount).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Chart from 'chart.js/auto'

interface DailyEarning {
  _id: string
  dailyFee: number
  ordersCount: number
}

interface Earnings {
  total: number
  ordersCount: number
  avgOrderValue: string
}

const loading = ref(false)
const error = ref('')
const earnings = ref<Earnings>({
  total: 0,
  ordersCount: 0,
  avgOrderValue: '0.00',
})
const dailyEarnings = ref<DailyEarning[]>([])
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const filters = ref({
  startDate: '',
  endDate: '',
})

// Set current month
const setCurrentMonth = () => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  filters.value.startDate = firstDay.toISOString().split('T')[0]
  filters.value.endDate = now.toISOString().split('T')[0]
  loadEarnings()
}

// Set last month
const setLastMonth = () => {
  const now = new Date()
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  filters.value.startDate = firstDayLastMonth.toISOString().split('T')[0]
  filters.value.endDate = lastDayLastMonth.toISOString().split('T')[0]
  loadEarnings()
}

// Load earnings data
const loadEarnings = async () => {
  loading.value = true
  error.value = ''

  try {
    const params = new URLSearchParams()
    if (filters.value.startDate) params.append('startDate', filters.value.startDate)
    if (filters.value.endDate) params.append('endDate', filters.value.endDate)

    // Fetch summary
    const response = await fetch(`/api/analytics/admin/earnings?${params}`)
    if (!response.ok) throw new Error('Failed to fetch earnings')
    const data = await response.json()
    earnings.value = data.earnings

    // Fetch daily breakdown
    const dailyResponse = await fetch(`/api/analytics/admin/earnings/daily?${params}`)
    if (!dailyResponse.ok) throw new Error('Failed to fetch daily earnings')
    const dailyData = await dailyResponse.json()
    dailyEarnings.value = dailyData.daily

    // Update chart
    updateChart()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error loading earnings:', err)
  } finally {
    loading.value = false
  }
}

// Update chart
const updateChart = () => {
  if (!chartCanvas.value || dailyEarnings.value.length === 0) return

  // Destroy existing chart
  if (chart) {
    chart.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx) return

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: dailyEarnings.value.map((d) => formatDate(d._id)),
      datasets: [
        {
          label: 'רווחים יומיים (₪)',
          data: dailyEarnings.value.map((d) => d.dailyFee),
          backgroundColor: 'rgba(75, 192, 192, 0.7)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          labels: {
            font: { size: 14 },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'סכום (₪)',
          },
        },
      },
    },
  })
}

// Format currency
const formatCurrency = (value: number): string => {
  return value.toFixed(2)
}

// Format date
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('he-IL')
}

onMounted(() => {
  setCurrentMonth()
})
</script>

<style scoped>
.admin-earnings-dashboard {
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 10px;
  direction: rtl;
  text-align: right;
}

h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 2rem;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.filter-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.date-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  align-items: flex-end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.form-group input {
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 1.5rem;
  border-radius: 6px;
  margin-bottom: 2rem;
}

.error-message button {
  margin-top: 1rem;
}

.earnings-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.earnings-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.earnings-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
}

.currency {
  font-size: 1.5rem;
  opacity: 0.9;
}

.amount {
  font-size: 2.5rem;
  font-weight: bold;
}

.label {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
}

.stats-row {
  display: flex;
  gap: 2rem;
  justify-content: flex-end;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.8;
}

.chart-section,
.table-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-section h2,
.table-section h2 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.chart-container {
  position: relative;
  height: 300px;
  margin-bottom: 2rem;
}

.earnings-table {
  width: 100%;
  border-collapse: collapse;
}

.earnings-table thead {
  background-color: #f0f0f0;
}

.earnings-table th {
  padding: 1rem;
  text-align: right;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #ddd;
}

.earnings-table td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #ddd;
}

.earnings-table tr:hover {
  background-color: #f9f9f9;
}

.amount {
  color: #27ae60;
  font-weight: 600;
}
</style>
