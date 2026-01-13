<template>
  <div class="courier-wallet">
    <h1>💰 הארנק שלי</h1>
    <p class="subtitle">כמה כסף זמין לי להוצאה</p>

    <!-- Date Range Filter -->
    <div class="filter-section">
      <div class="date-inputs">
        <div class="form-group">
          <label for="startDate">מתאריך:</label>
          <input id="startDate" v-model="filters.startDate" type="date" @change="loadWallet" />
        </div>
        <div class="form-group">
          <label for="endDate">עד תאריך:</label>
          <input id="endDate" v-model="filters.endDate" type="date" @change="loadWallet" />
        </div>
        <button @click="setAllTime" class="btn-secondary">כל הזמן</button>
        <button @click="setCurrentMonth" class="btn-secondary">החודש הנוכחי</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <p>⏳ טוען נתונים...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-message">
      <p>❌ {{ error }}</p>
      <button @click="loadWallet" class="btn-primary">נסה שוב</button>
    </div>

    <!-- Main Wallet Card -->
    <div v-else class="wallet-section">
      <div class="wallet-card">
        <div class="wallet-balance">
          <span class="currency">₪</span>
          <span class="amount">{{ formatCurrency(wallet.balance) }}</span>
        </div>
        <p class="label">סה"כ הכנסה</p>
        <div class="stats-row">
          <div class="stat">
            <span class="stat-value">{{ wallet.deliveries }}</span>
            <span class="stat-label">משלוחים</span>
          </div>
          <div class="stat">
            <span class="stat-value">₪{{ wallet.avgPerDelivery }}</span>
            <span class="stat-label">ממוצע למשלוח</span>
          </div>
        </div>
      </div>

      <!-- Wallet Actions -->
      <div class="wallet-actions">
        <button class="btn-success">📤 בקש משיכה</button>
        <button class="btn-info">📊 ראה עמלות</button>
      </div>

      <!-- Deliveries Table -->
      <div class="table-section" v-if="deliveries.length > 0">
        <h2>📋 פירוט משלוחים</h2>
        <div class="table-wrapper">
          <table class="deliveries-table">
            <thead>
              <tr>
                <th>מספר הזמנה</th>
                <th>תאריך</th>
                <th>יעד</th>
                <th>עמלת משלוח</th>
                <th>הכנסה שלי</th>
                <th>מצב</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="delivery in deliveries" :key="delivery.orderId">
                <td class="order-id">{{ delivery.orderId }}</td>
                <td>{{ formatDate(delivery.date) }}</td>
                <td>{{ delivery.destination }}</td>
                <td class="amount">₪{{ formatCurrency(delivery.shippingAmount) }}</td>
                <td class="earning">₪{{ formatCurrency(delivery.courierPayout) }}</td>
                <td>
                  <span class="status" :class="getStatusClass(delivery.status)">
                    {{ getStatusLabel(delivery.status) }}
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

      <!-- No Deliveries Message -->
      <div v-else class="no-data">
        <p>📭 אין משלוחים בתקופה זו</p>
      </div>

      <!-- Withdraw Section -->
      <div class="withdraw-section" v-if="wallet.balance > 0">
        <h2>💳 בקשת משיכה</h2>
        <form @submit.prevent="submitWithdrawal">
          <div class="form-group">
            <label for="withdrawAmount">סכום לתיגבול (₪):</label>
            <input
              id="withdrawAmount"
              v-model.number="withdrawalForm.amount"
              type="number"
              :max="wallet.balance"
              min="10"
              step="0.01"
              placeholder="הכנס סכום"
            />
          </div>
          <div class="form-group">
            <label for="bankAccount">חשבון בנק להעברה:</label>
            <input
              id="bankAccount"
              v-model="withdrawalForm.bankAccount"
              type="text"
              placeholder="מס' חשבון בנק"
            />
          </div>
          <div class="form-info">
            <p>💡 הסכום המינימלי לתיגבול: <strong>₪10</strong></p>
            <p>⏱️ עיבוד הבקשה יתבצע בתוך 2-3 ימי עסקים</p>
          </div>
          <button type="submit" class="btn-success" :disabled="!canSubmitWithdrawal">
            אשר בקשת משיכה
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'

interface Delivery {
  orderId: string
  date: string
  shippingAmount: number
  courierPayout: number
  status: string
  destination: string
  deliveredAt: string | null
}

interface Wallet {
  balance: number
  deliveries: number
  avgPerDelivery: string
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
const wallet = ref<Wallet>({
  balance: 0,
  deliveries: 0,
  avgPerDelivery: '0.00',
})
const deliveries = ref<Delivery[]>([])
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

const withdrawalForm = ref({
  amount: 0,
  bankAccount: '',
})

// Computed property to check if form is valid
const canSubmitWithdrawal = computed(() => {
  return (
    withdrawalForm.value.amount > 0 &&
    withdrawalForm.value.amount <= wallet.value.balance &&
    withdrawalForm.value.bankAccount.trim().length > 0
  )
})

// Set all time
const setAllTime = () => {
  filters.value.startDate = ''
  filters.value.endDate = ''
  pagination.value.page = 1
  loadWallet()
}

// Set current month
const setCurrentMonth = () => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  filters.value.startDate = firstDay.toISOString().split('T')[0]
  filters.value.endDate = now.toISOString().split('T')[0]
  pagination.value.page = 1
  loadWallet()
}

// Load wallet data
const loadWallet = async () => {
  loading.value = true
  error.value = ''

  try {
    const params = new URLSearchParams()
    if (filters.value.startDate) params.append('startDate', filters.value.startDate)
    if (filters.value.endDate) params.append('endDate', filters.value.endDate)

    // Fetch wallet summary
    const response = await fetch(`/api/analytics/courier/${userStore.uid}/wallet?${params}`)
    if (!response.ok) throw new Error('Failed to fetch wallet')
    const data = await response.json()
    wallet.value = data.wallet

    // Fetch deliveries with pagination
    params.append('page', pagination.value.page.toString())
    params.append('limit', pagination.value.limit.toString())

    const deliveriesResponse = await fetch(
      `/api/analytics/courier/${userStore.uid}/wallet/deliveries?${params}`,
    )
    if (!deliveriesResponse.ok) throw new Error('Failed to fetch deliveries')
    const deliveriesData = await deliveriesResponse.json()
    deliveries.value = deliveriesData.deliveries
    pagination.value = deliveriesData.pagination
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
    console.error('Error loading wallet:', err)
  } finally {
    loading.value = false
  }
}

// Pagination handlers
const nextPage = () => {
  if (pagination.value.page < pagination.value.pages) {
    pagination.value.page++
    loadWallet()
  }
}

const previousPage = () => {
  if (pagination.value.page > 1) {
    pagination.value.page--
    loadWallet()
  }
}

// Submit withdrawal request
const submitWithdrawal = async () => {
  try {
    const response = await fetch(`/api/analytics/courier/${userStore.uid}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(withdrawalForm.value),
    })

    if (!response.ok) throw new Error('Failed to submit withdrawal')

    alert('✅ בקשת המשיכה נשלחה בהצלחה')
    withdrawalForm.value = { amount: 0, bankAccount: '' }
    loadWallet()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error'
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
  setAllTime()
})
</script>

<style scoped>
.courier-wallet {
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

h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  margin-top: 2rem;
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
.btn-secondary,
.btn-success,
.btn-info {
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

.btn-success {
  background-color: #27ae60;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #229954;
}

.btn-success:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-info {
  background-color: #3498db;
  color: white;
}

.btn-info:hover {
  background-color: #2980b9;
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

.wallet-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.wallet-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.wallet-balance {
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

.wallet-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.wallet-actions button {
  flex: 1;
  max-width: 200px;
}

.table-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-wrapper {
  overflow-x: auto;
}

.deliveries-table {
  width: 100%;
  border-collapse: collapse;
}

.deliveries-table thead {
  background-color: #f0f0f0;
}

.deliveries-table th {
  padding: 1rem;
  text-align: right;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #ddd;
  font-size: 0.9rem;
}

.deliveries-table td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #ddd;
}

.deliveries-table tr:hover {
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

.earning {
  color: #27ae60;
  font-weight: bold;
  font-size: 1.1rem;
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

.withdraw-section {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-right: 4px solid #27ae60;
}

.withdraw-section form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-info {
  background-color: #e8f5e9;
  padding: 1rem;
  border-radius: 6px;
  border-right: 3px solid #27ae60;
}

.form-info p {
  margin: 0.5rem 0;
  color: #1b5e20;
  font-size: 0.95rem;
}

.form-info strong {
  color: #27ae60;
}
</style>
