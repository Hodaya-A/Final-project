<template>
  <div class="store-payout-dashboard">
    <h1>הכנסה שלי החודש</h1>
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
        <div class="section-header">
          <h2>פירוט הזמנות</h2>
          <div class="status-info">
            <span class="info-icon">ℹ</span>
            <span class="info-text">מוצגות רק הזמנות שאושרו (אושר, בדרך, הגיע)</span>
          </div>
        </div>
        <div class="orders-grid">
          <div v-for="order in orders" :key="order.orderId" class="order-card">
            <div class="order-card-header">
              <div class="order-header-left">
                <span class="order-label-small">הזמנה מספר:</span>
                <div class="order-id-badge">{{ order.orderId }}</div>
              </div>
              <span class="status" :class="getStatusClass(order.status)">
                {{ getStatusLabel(order.status) }}
              </span>
            </div>
            <div class="order-card-body">
              <div class="order-row">
                <span class="order-label">תאריך:</span>
                <span class="order-value">{{ formatDate(order.date) }}</span>
              </div>
              <div class="order-row">
                <span class="order-label">סה"כ מחיר:</span>
                <span class="order-value amount">₪{{ formatCurrency(order.totalPrice) }}</span>
              </div>
              <div class="order-row">
                <span class="order-label">עמלת פלטפורמה:</span>
                <span class="order-value fee">-₪{{ formatCurrency(order.platformFee) }}</span>
              </div>
              <div class="order-row order-row-highlight">
                <span class="order-label">הכנסה שלי:</span>
                <span class="order-value payout-amount"
                  >₪{{ formatCurrency(order.storePayout) }}</span
                >
              </div>
            </div>
          </div>
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
        <p>אין הזמנות בתקופה זו</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

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
    // Check if storeId exists
    if (!userStore.storeId) {
      throw new Error('Store ID not found. Please log in again.')
    }

    const params = {
      startDate: filters.value.startDate,
      endDate: filters.value.endDate,
    }

    // Fetch payout summary with axios
    const response = await axios.get(`/api/analytics/store/${userStore.storeId}/payout`, {
      params,
      withCredentials: true,
    })
    payout.value = response.data.payout

    // Fetch orders with pagination
    const ordersResponse = await axios.get(
      `/api/analytics/store/${userStore.storeId}/payout/orders`,
      {
        params: {
          ...params,
          page: pagination.value.page,
          limit: pagination.value.limit,
        },
        withCredentials: true,
      },
    )
    orders.value = ordersResponse.data.orders
    pagination.value = ordersResponse.data.pagination
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
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 2rem;
  text-align: right;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 2rem;
  font-size: 1rem;
  text-align: right;
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
  transition: width 0.6s, height 0.6s;
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
  background: linear-gradient(135deg, #ffffff 0%, #f3e8ff 100%);
  color: #1f2937;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.2);
  direction: rtl;
  text-align: right;
  position: relative;
  overflow: hidden;
  border-right: 6px solid transparent;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.payout-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 6px;
  height: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  transition: width 0.4s ease;
}

.payout-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow: 0 16px 32px rgba(102, 126, 234, 0.3);
}

.payout-card:hover::before {
  width: 10px;
}

.payout-value {
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
  font-size: 1.2rem;
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
  font-size: 0.95rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 1.5rem;
  text-align: right;
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
  text-align: center;
}

.stat-value {
  font-size: 1.3rem;
  font-weight: bold;
  color: #667eea;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.table-section {
  background: linear-gradient(135deg, #ffffff 0%, #fefcff 100%);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  direction: rtl;
  border-right: 4px solid #a78bfa;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.table-section h2 {
  margin: 0;
  color: #2c3e50;
  text-align: right;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f3e8ff;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #6b7280;
  direction: rtl;
  flex-direction: row-reverse;
}

.info-icon {
  font-size: 1rem;
}

.info-text {
  font-weight: 500;
  text-align: right;
}

.table-wrapper {
  overflow-x: auto;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.order-card {
  background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);
  border: none;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-right: 4px solid transparent;
  position: relative;
}

.order-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #a78bfa 0%, #8b5cf6 100%);
  transition: width 0.4s ease;
}

.order-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 28px rgba(139, 92, 246, 0.25);
}

.order-card:hover::before {
  width: 8px;
}

.order-card-header {
  background: linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%);
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  direction: rtl;
  position: relative;
  z-index: 1;
}

.order-header-left {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.order-label-small {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.order-id-badge {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
}

.order-card:hover .order-id-badge {
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
  transform: scale(1.05);
}

.order-card-body {
  padding: 1rem;
  direction: rtl;
  position: relative;
  z-index: 1;
  background: linear-gradient(135deg, #ffffff 0%, #fefcff 100%);
}

.order-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.order-row:last-child {
  border-bottom: none;
}

.order-row-highlight {
  background: #f3e8ff;
  padding: 0.8rem;
  border-radius: 6px;
  margin-top: 0.5rem;
  border: none;
}

.order-label {
  color: #6b7280;
  font-weight: 500;
  font-size: 0.9rem;
}

.order-value {
  color: #2c3e50;
  font-weight: 600;
  text-align: left;
}

.order-value.amount {
  color: #2c3e50;
  font-weight: 700;
}

.order-value.fee {
  color: #ef4444;
  font-weight: 600;
}

.order-value.payout-amount {
  color: #8b5cf6;
  font-weight: 700;
  font-size: 1.05rem;
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
  direction: rtl;
}

.pagination button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

.pagination button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.pagination span {
  text-align: center;
  min-width: 120px;
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
