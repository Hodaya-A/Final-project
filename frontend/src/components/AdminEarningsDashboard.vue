<template>
  <div class="admin-earnings-dashboard">
    <h1>הרווחים שלנו החודש</h1>
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
      <p>טוען נתונים...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="loadEarnings" class="btn-primary">נסה שוב</button>
    </div>

    <!-- Main Earnings Card -->
    <div v-else class="earnings-section">
      <div class="earnings-card">
        <div class="earnings-value">
          <span class="currency">₪</span>
          <span class="amount">{{ formatCurrency(earnings.total) }}</span>
        </div>
        <p class="label">סה"כ רווחים</p>
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
        <h2>התפלגות יומית</h2>
        <div class="chart-container">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </div>

      <!-- Daily Breakdown Table -->
      <div class="table-section" v-if="dailyEarnings.length > 0">
        <h2>פירוט יומי</h2>
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
  padding: 3rem 2rem;
  background-color: #f9fafb;
  border-radius: 10px;
  direction: rtl;
  text-align: right;
  min-height: 100vh;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  font-weight: 500;
}

.filter-section {
  background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);
  padding: 2rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.1);
  border-right: 4px solid #a78bfa;
  transition: all 0.3s ease;
}

.filter-section:hover {
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.15);
}

.date-inputs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  align-items: flex-end;
  direction: rtl;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: right;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
  text-align: right;
}

.form-group input {
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  text-align: right;
  direction: rtl;
  transition: all 0.3s ease;
  background: white;
}

.form-group input:focus {
  outline: none;
  border-color: #a78bfa;
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.btn-primary::before,
.btn-secondary::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition:
    width 0.6s,
    height 0.6s;
}

.btn-primary:hover::before,
.btn-secondary:hover::before {
  width: 300px;
  height: 300px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  color: white;
}

.btn-secondary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
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
  background: linear-gradient(135deg, #ffffff 0%, #f3e8ff 100%);
  color: #1f2937;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.2);
  position: relative;
  overflow: hidden;
  border-right: 6px solid transparent;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.earnings-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  transition: width 0.4s ease;
}

.earnings-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 16px 32px rgba(102, 126, 234, 0.3);
}

.earnings-card:hover::before {
  width: 10px;
}

.earnings-value {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-direction: row-reverse;
  position: relative;
  z-index: 1;
}

.currency {
  font-size: 1.5rem;
  color: #667eea;
  font-weight: 600;
}

.amount {
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.label {
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 1.5rem;
  position: relative;
  z-index: 1;
}

.stats-row {
  display: flex;
  gap: 2rem;
  justify-content: flex-end;
  position: relative;
  z-index: 1;
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
  color: #667eea;
}

.stat-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.chart-section,
.table-section {
  background: linear-gradient(135deg, #ffffff 0%, #fefcff 100%);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-right: 4px solid #a78bfa;
}

.chart-section h2,
.table-section h2 {
  margin-bottom: 1.5rem;
  color: #1f2937;
  font-weight: 700;
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
  background: linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%);
}

.earnings-table th {
  padding: 1rem;
  text-align: right;
  font-weight: 700;
  color: #1f2937;
  border-bottom: 2px solid #e5e7eb;
}

.earnings-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.earnings-table tr:hover {
  background-color: #faf5ff;
}

.earnings-table .amount {
  color: #667eea;
  font-weight: 700;
  font-size: 1.05rem;
}
</style>
