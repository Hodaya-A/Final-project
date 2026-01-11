<template>
  <div class="courier-page">
    <h1>מרכז שליחים</h1>

    <div class="cards">
      <section class="card">
        <h2>משלוחים ממתינים</h2>
        <p v-if="loadingAvailable">טוען משלוחים...</p>
        <p v-else-if="availableOrders.length === 0" class="muted">אין כרגע משלוחים ממתינים</p>
        <ul v-else class="order-list">
          <li v-for="o in availableOrders" :key="o._id" class="order-item">
            <div class="order-main">
              <strong>#{{ o._id.slice(-6) }}</strong>
              <span>₪{{ o.totalPrice }}</span>
              <span class="badge">סטטוס: {{ labelStatus(o) }}</span>
            </div>
            <div class="order-actions">
              <button @click="accept(o._id)" :disabled="actionBusy">קבל משלוח</button>
            </div>
          </li>
        </ul>
      </section>

      <section class="card">
        <h2>המשלוחים שלי</h2>
        <p v-if="loadingMine">טוען משלוחים...</p>
        <p v-else-if="myOrders.length === 0" class="muted">אין משלוחים פעילים</p>
        <ul v-else class="order-list">
          <li v-for="o in myOrders" :key="o._id" class="order-item">
            <div class="order-main">
              <strong>#{{ o._id.slice(-6) }}</strong>
              <span>₪{{ o.totalPrice }}</span>
              <span class="badge">סטטוס: {{ labelStatus(o) }}</span>
            </div>
            <div class="order-actions">
              <button
                v-if="!o.deliveredAt"
                @click="completeDelivery(o._id)"
                :disabled="actionBusy"
                class="complete-btn"
              >
                סמן כנאסף
              </button>
              <span v-else class="completed-text">נאסף בהצלחה</span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import {
  getAvailableDeliveries,
  acceptDelivery as acceptDeliveryAPI,
  getMyDeliveries,
} from '@/services/courier'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface OrderDto {
  _id: string
  totalPrice: number
  items: OrderItem[]
  userId: string
  deliveryMethod: string
  approvedAt: string
  readyForPickup: boolean
  courierAssignedAt?: string
  deliveredAt?: string
}

const userStore = useUserStore()
const uid = userStore.uid

const availableOrders = ref<OrderDto[]>([])
const myOrders = ref<OrderDto[]>([])
const loadingAvailable = ref(false)
const loadingMine = ref(false)
const actionBusy = ref(false)

function labelStatus(order: OrderDto): string {
  if (order.courierAssignedAt) {
    return 'שויכה'
  }
  if (order.readyForPickup) {
    return 'מוכנה'
  }
  return 'ממתינה'
}

async function fetchAvailable() {
  loadingAvailable.value = true
  try {
    console.log('📦 Fetching available deliveries...')
    const result = await getAvailableDeliveries()
    console.log('📦 Result:', result)
    availableOrders.value = result.orders || []
    console.log('📦 Available orders:', availableOrders.value.length)
  } catch (e) {
    console.error('❌ Error fetching available:', e)
  } finally {
    loadingAvailable.value = false
  }
}

async function fetchMine() {
  loadingMine.value = true
  try {
    const result = await getMyDeliveries(uid!)
    myOrders.value = result.orders || []
  } catch (e) {
    console.error('Error fetching mine:', e)
  } finally {
    loadingMine.value = false
  }
}

async function accept(orderId: string) {
  if (!confirm('האם לקבל משלוח זה?')) return

  actionBusy.value = true
  try {
    await acceptDeliveryAPI(orderId, uid!)
    alert('משלוח התקבל בהצלחה!')
    await Promise.all([fetchAvailable(), fetchMine()])
  } catch (e) {
    console.error('Error accepting:', e)
    alert('שגיאה בקבלת המשלוח')
  } finally {
    actionBusy.value = false
  }
}

async function completeDelivery(orderId: string) {
  if (!confirm('סמן את המשלוח כנאסף?')) return

  actionBusy.value = true
  try {
    await axios.post(`http://localhost:3000/api/orders/complete-delivery/${orderId}`)

    alert('משלוח סומן כנאסף!')
    await fetchMine()
  } catch (e) {
    console.error('Error completing delivery:', e)
    alert('שגיאה בסיום המשלוח')
  } finally {
    actionBusy.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchAvailable(), fetchMine()])
  // רענן כל 30 שניות
  setInterval(() => {
    fetchAvailable()
    fetchMine()
  }, 30000)
})
</script>

<style scoped>
.courier-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  direction: rtl;
  text-align: right;
}

h1 {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: 700;
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  border: 2px solid var(--border);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.card h2 {
  color: var(--neutral-dark);
  margin-bottom: 1.5rem;
  font-size: 1.3rem;
  font-weight: 600;
}

.order-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.order-item:hover {
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  box-shadow: var(--shadow);
}

.order-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.order-main strong {
  font-size: 1.1rem;
  color: var(--neutral-dark);
  min-width: 80px;
}

.order-main span:nth-child(2) {
  color: var(--success);
  font-weight: 600;
  min-width: 80px;
}

.badge {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 1px solid var(--primary-light);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
  color: var(--primary-dark);
  font-weight: 500;
}

.order-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.order-actions button {
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: var(--shadow);
}

.order-actions button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  filter: brightness(1.1);
}

.order-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.complete-btn {
  background: linear-gradient(135deg, var(--success) 0%, #059669 100%) !important;
}

.completed-text {
  color: var(--success);
  font-size: 0.9rem;
  font-weight: 600;
  min-width: 100px;
  text-align: center;
}

.info-text {
  color: var(--neutral);
  font-size: 0.9rem;
  font-weight: 500;
  min-width: 100px;
  text-align: center;
}

.muted {
  color: var(--neutral);
  font-style: italic;
  text-align: center;
  padding: 2rem;
}

@media (max-width: 900px) {
  .cards {
    grid-template-columns: 1fr;
  }

  .courier-page {
    padding: 1rem;
  }

  .card {
    padding: 1.5rem;
  }
}
</style>
