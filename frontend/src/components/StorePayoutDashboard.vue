<template>
  <div class="store-payout-dashboard">
    <h1>💳 הכנסה שלי החודש</h1>
    <p class="subtitle">כמה כסף אקבל בסוף החודש</p>

    <!-- Date Range Filter -->
    <div class="filter-section">
      <div class="date-inputs">
        <div class="form-group">
          <label for="startDate">מתאריך:</label>
          <input id="startDate" v-model="filters.startDate" type="date" @change="loadPayouts" />
        </div>
        <div class="form-group">
          <label for="endDate">עד תאריך:</label>
          <input id="endDate" v-model="filters.endDate" type="date" @change="loadPayouts" />
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
      <button @click="loadPayouts" class="btn-primary">נסה שוב</button>
    </div>

    <!-- Main Payout Card -->
    <div v-else class="payout-section">
      <div class="payout-card">
        <div class="payout-value">
          <span class="currency">₪</span>
          <span class="amount">{{ formatCurrency(payout.total) }}</span>
        </div>
        <p class="label">סה"כ הכנסה (לפני עמלות)</p>
        <div class="stats-row">
          <div class="stat">
            <span class="stat-value">{{ payout.ordersCount }}</span>
            <span class="stat-label">הזמנות</span>
          </div>
          <div class="stat">
            <span class="stat-value">-₪{{ formatCurrency(payout.platformFeeDeducted) }}</span>
            <span class="stat-label">עמלת פלטפורמה</span>
          </div>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="table-section" v-if="orders.length > 0">
        <h2>📋 פירוט הזמנות</h2>
        <div class="table-wrapper">
          <table class="orders-table">
            <thead>
              <tr>
                <th>מספר הזמנה</th>
                <th>תאריך</th>
                <th>סה"כ מחיר</th>
                <th>עמלת פלטפורמה</th>
                <th>הכנסה שלי</th>
                <th>מצב</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in orders" :key="order.orderId">
                <td class="order-id">{{ order.orderId }}</td>
                <td>{{ formatDate(order.date) }}</td>
                <td class="amount">₪{{ formatCurrency(order.totalPrice) }}</td>
                <td class="fee">-₪{{ formatCurrency(order.platformFee) }}</td>
                <td class="payout-amount">₪{{ formatCurrency(order.storePayout) }}</td>
                <td>
                  <span class="status" :class="getStatusClass(order.status)">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="pagination.pages > 1">
          <button :disabled="pagination.page === 1" @click="previousPage" class="btn-secondary">
            ◀ הקודם
          </button>
          <span>עמוד {{ pagination.page }} מתוך {{ pagination.pages }}</span>
          <button
            :disabled="pagination.page === pagination.pages"
            @click="nextPage"
            class="btn-secondary"
          >
            הבא ▶
          </button>
        </div>
      </div>

      <!-- No Orders Message -->
      <div v-else class="no-data">
        <p>📭 אין הזמנות בתקופה זו</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

interface Order {
  orderId: string
  date: string
  totalPrice: number
  storePayout: number
  platformFee: number
  status: string
  itemsCount: number
}

interface Payout {
  total: number
  ordersCount: number
  platformFeeDeducted: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const userStore = useUserStore()
const loading = ref(false)
const error = ref('')
const payout = ref<Payout>({
  total: 0,
  ordersCount: 0,
  platformFeeDeducted: 0,
})
const orders = ref<Order[]>([])
const pagination = ref<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  pages: 0,
})

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
  pagination.value.page = 1
  loadPayouts()
}

// Set last month
const setLastMonth = () => {
  const now = new Date()
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  filters.value.startDate = firstDayLastMonth.toISOString().split('T')[0]
  filters.value.endDate = lastDayLastMonth.toISOString().split('T')[0]
  pagination.value.page = 1
  loadPayouts()
}

// Load payouts data
const loadPayouts = async () => {
  loading.value = true
  error.value = ''

  try {
    const params = new URLSearchParams()
    if (filters.value.startDate) params.append('startDate', filters.value.startDate)
    if (filters.value.endDate) params.append('endDate', filters.value.endDate)

    // Fetch payout summary
    const response = await fetch(`/api/analytics/store/${userStore.storeId}/payout?${params}`)
    if (!response.ok) throw new Error('Failed to fetch payout')
    const data = await response.json()
    payout.value = data.payout

    // Fetch orders with pagination
    params.append('page', pagination.value.page.toString())
    params.append('limit', pagination.value.limit.toString())

    const ordersResponse = await fetch(
      `/api/analytics/store/${userStore.storeId}/payout/orders?${params}`,
    )
    if (!ordersResponse.ok) throw new Error('Failed to fetch orders')
    const ordersData = await ordersResponse.json()
    orders.value = ordersData.orders
    pagination.value = ordersData.pagination
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error loading payouts:', err)
  } finally {
    loading.value = false
  }
}

// Pagination handlers
const nextPage = () => {
  if (pagination.value.page < pagination.value.pages) {
    pagination.value.page++
    loadPayouts()
  }
}

const previousPage = () => {
  if (pagination.value.page > 1) {
    pagination.value.page--
    loadPayouts()
  }
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

// Get status label
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'ממתין',
    confirmed: 'אושר',
    in_delivery: 'בדרך',
    delivered: 'הגיע',
    cancelled: 'בוטל',
  }
  return labels[status] || status
}

// Get status CSS class
const getStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    pending: 'status-pending',
    confirmed: 'status-confirmed',
    in_delivery: 'status-in-delivery',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled',
  }
  return classes[status] || ''
}

onMounted(() => {
  setCurrentMonth()
})
</script>

<style scoped>
.store-payout-dashboard {
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

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.payout-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.payout-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.payout-value {
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
  font-size: 1.3rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.8;
}

.table-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-section h2 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.table-wrapper {
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table thead {
  background-color: #f0f0f0;
}

.orders-table th {
  padding: 1rem;
  text-align: right;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #ddd;
  font-size: 0.9rem;
}

.orders-table td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #ddd;
}

.orders-table tr:hover {
  background-color: #f9f9f9;
}

.order-id {
  color: #3498db;
  font-weight: 600;
}

.amount {
  color: #2c3e50;
  font-weight: 600;
}

.fee {
  color: #e74c3c;
}

.payout-amount {
  color: #27ae60;
  font-weight: bold;
}

.status {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-confirmed {
  background-color: #cce5ff;
  color: #004085;
}

.status-in-delivery {
  background-color: #d1ecf1;
  color: #0c5460;
}

.status-delivered {
  background-color: #d4edda;
  color: #155724;
}

.status-cancelled {
  background-color: #f8d7da;
  color: #721c24;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #ddd;
}

.no-data {
  background-color: #f0f0f0;
  padding: 3rem;
  border-radius: 8px;
  text-align: center;
  color: #7f8c8d;
  font-size: 1.1rem;
}
</style>
