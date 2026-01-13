<template>
  <div class="pending-orders-container">
    <h1>הזמנות ממתינות לאישור</h1>

    <div v-if="loading" class="loading">טוען הזמנות...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="pendingOrders.length === 0" class="empty">
      אין הזמנות ממתינות - כל הזמנות אושרו!
    </div>

    <div v-else class="orders-grid">
      <div v-for="order in pendingOrders" :key="order._id" class="order-card">
        <div class="order-header">
          <h3>הזמנה #{{ order._id.slice(-6) }}</h3>
          <span class="time">{{ formatTime(order.createdAt) }}</span>
        </div>

        <div class="order-details">
          <p><strong>סכום:</strong> ₪{{ order.totalPrice.toFixed(2) }}</p>
          <p><strong>פריטים:</strong> {{ order.items.length }}</p>
          <p>
            <strong>אופן משלוח:</strong>
            <span class="delivery-badge" :class="order.deliveryMethod || 'delivery'">
              {{ order.deliveryMethod === 'pickup' ? 'איסוף עצמי' : 'משלוח' }}
            </span>
          </p>
          <p>
            <strong>סטטוס:</strong>
            <span class="status-badge" :class="getStatusClass(order)">
              {{ getStatusText(order) }}
            </span>
          </p>
        </div>

        <div class="items-list">
          <h4>פרטים:</h4>
          <ul>
            <li v-for="(item, idx) in order.items" :key="idx">
              {{ item.name }} × {{ item.quantity }}
            </li>
          </ul>
        </div>

        <!-- כפתורים לפי מצב -->
        <div class="action-buttons">
          <button
            v-if="!order.approvedAt"
            @click="approveOrder(order._id)"
            :disabled="approvingId === order._id"
            class="approve-btn"
          >
            {{ approvingId === order._id ? 'מאשר...' : 'אישור הזמנה' }}
          </button>

          <button
            v-else-if="order.approvedAt && !order.readyForPickup"
            @click="markReady(order._id)"
            :disabled="readyingId === order._id"
            class="ready-btn"
          >
            {{ readyingId === order._id ? 'מסמן...' : 'מוכן לאיסוף' }}
          </button>

          <div v-else class="completed-badge">הושלם</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { sendOrderConfirmation } from '@/services/email'

interface Order {
  _id: string
  shopId: string
  userId: string
  userEmail: string
  items: Array<{ name: string; quantity: number; price: number }>
  totalPrice: number
  createdAt: string
  approvedAt?: string
  deliveryMethod?: 'delivery' | 'pickup'
  readyForPickup?: boolean
  readyAt?: string
}

const userStore = useUserStore()
const pendingOrders = ref<Order[]>([])
const loading = ref(true)
const error = ref('')
const approvingId = ref<string | null>(null)
const readyingId = ref<string | null>(null)
const pollInterval = ref<ReturnType<typeof setInterval> | null>(null)

async function fetchPendingOrders() {
  try {
    loading.value = true
    error.value = ''

    const shopId = userStore.storeId || '' // מזהה החנות (storeId)

    if (!shopId) {
      error.value = 'אין מזהה חנות (storeId)'
      return
    }

    const response = await axios.get('http://localhost:3000/api/orders/pending/store', {
      params: { shopId },
    })

    pendingOrders.value = response.data.orders || []
  } catch (err: unknown) {
    console.error('Error fetching orders:', err)
    error.value = 'שגיאה בטעינת הזמנות'
  } finally {
    loading.value = false
  }
}

async function approveOrder(orderId: string) {
  if (!confirm('אתה בטוח שאתה רוצה לאשר הזמנה זו?')) return

  try {
    approvingId.value = orderId

    // מאשר את ההזמנה בשרת
    const response = await axios.post(`http://localhost:3000/api/orders/approve/${orderId}`, {
      managerId: userStore.uid,
    })

    const approvedOrder = response.data.order

    // שלח מייל ללקוח דרך EmailJS
    if (approvedOrder.userEmail) {
      try {
        await sendOrderConfirmation(
          approvedOrder.userEmail,
          approvedOrder.totalPrice,
          approvedOrder.items,
          approvedOrder.id,
        )
        alert('ההזמנה אושרה בהצלחה! מייל נשלח ללקוח')
      } catch (emailErr) {
        console.error('Email error:', emailErr)
        alert('ההזמנה אושרה, אבל היתה שגיאה בשליחת המייל')
      }
    } else {
      alert('ההזמנה אושרה בהצלחה!')
    }

    // הסר מהרשימה רק אם מוכן לאיסוף
    if (approvedOrder.readyForPickup) {
      pendingOrders.value = pendingOrders.value.filter((o) => o._id !== orderId)
    } else {
      // עדכן את ההזמנה ברשימה
      const orderIndex = pendingOrders.value.findIndex((o) => o._id === orderId)
      if (orderIndex !== -1) {
        pendingOrders.value[orderIndex].approvedAt = approvedOrder.approvedAt
      }
    }
  } catch (err: unknown) {
    console.error('Error approving:', err)
    alert('שגיאה באישור ההזמנה')
  } finally {
    approvingId.value = null
  }
}

async function markReady(orderId: string) {
  if (!confirm('האם לסמן הזמנה זו כמוכנה לאיסוף?')) return

  try {
    readyingId.value = orderId

    const response = await axios.post(`http://localhost:3000/api/orders/ready/${orderId}`)

    if (response.data.success) {
      alert('ההזמנה סומנה כמוכנה לאיסוף!')
      // הסר מהרשימה
      pendingOrders.value = pendingOrders.value.filter((o) => o._id !== orderId)
    }
  } catch (err: unknown) {
    console.error('Error marking as ready:', err)
    alert('שגיאה בסימון ההזמנה')
  } finally {
    readyingId.value = null
  }
}

function getStatusClass(order: Order) {
  if (order.readyForPickup) return 'ready'
  if (order.approvedAt) return 'approved'
  return 'pending'
}

function getStatusText(order: Order) {
  if (order.readyForPickup) return 'מוכן לאיסוף'
  if (order.approvedAt) return 'אושר'
  return 'ממתין לאישור'
}

function formatTime(createdAt: string) {
  const date = new Date(createdAt)
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  console.log('📦 PendingOrdersView mounted')
  console.log('🏪 Store ID:', userStore.storeId)

  // טען בעת כניסה
  fetchPendingOrders()

  // התחל polling אוטומטי כל 10 שניות (כבר מטופל ב-StoreOrderModal ב-App.vue)

  // פולינג כל 10 שניות
  pollInterval.value = setInterval(() => {
    fetchPendingOrders()
  }, 10000)
})

onUnmounted(() => {
  if (pollInterval.value) clearInterval(pollInterval.value)
})
</script>

<style scoped>
.pending-orders-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  direction: rtl;
  text-align: right;
}

h1 {
  color: var(--primary);
  margin-bottom: 2rem;
  font-size: 2rem;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  border-radius: 8px;
  background: #f5f5f5;
}

.error {
  background: #fef2f2;
  color: var(--danger);
  border: 1px solid var(--danger);
}

.empty {
  background: var(--bg-secondary);
  color: var(--success);
  border: 1px solid var(--success);
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

.order-card {
  background: white;
  border: 2px solid var(--primary-light);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-light);
}

.order-header h3 {
  margin: 0;
  color: var(--primary-dark);
}

.time {
  font-size: 0.9rem;
  color: #888;
}

.order-details {
  margin: 1rem 0;
  font-size: 0.95rem;
}

.order-details p {
  margin: 0.5rem 0;
}

.delivery-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: bold;
  margin-right: 0.5rem;
}

.delivery-badge.delivery {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  color: #0369a1;
  border: 1px solid #38bdf8;
}

.delivery-badge.pickup {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #7c3aed;
  border: 1px solid #a78bfa;
}

.status-badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: bold;
  margin-right: 0.5rem;
}

.status-badge.pending {
  background: linear-gradient(135deg, #fff3cd 0%, #ffe8a1 100%);
  color: #856404;
  border: 1px solid var(--warning);
}

.status-badge.approved {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  color: #155724;
  border: 1px solid var(--success);
}

.status-badge.ready {
  background: linear-gradient(135deg, #cfe2ff 0%, #9ec5fe 100%);
  color: #084298;
  border: 1px solid #0d6efd;
}

.items-list {
  margin: 1rem 0;
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 6px;
}

.items-list h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: #333;
}

.items-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.items-list li {
  padding: 0.3rem 0;
  font-size: 0.85rem;
  color: #555;
}

.action-buttons {
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
}

.approve-btn,
.ready-btn {
  flex: 1;
  padding: 1rem;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow);
}

.approve-btn {
  background: var(--gradient-primary);
}

.ready-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.approve-btn:hover:not(:disabled),
.ready-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  filter: brightness(1.05);
}

.approve-btn:disabled,
.ready-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.completed-badge {
  padding: 1rem;
  text-align: center;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4338ca;
  border-radius: 12px;
  font-weight: bold;
  border: 2px solid #818cf8;
}
</style>
