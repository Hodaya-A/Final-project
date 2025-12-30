<template>
  <div class="courier-page">
    <h1>מרכז שליחים</h1>

    <div class="cards">
      <section class="card">
        <h2>הזמנות ממתינות</h2>
        <p v-if="loadingAvailable">טוען הזמנות...</p>
        <p v-else-if="availableOrders.length === 0" class="muted">אין כרגע הזמנות ממתינות</p>
        <ul v-else class="order-list">
          <li v-for="o in availableOrders" :key="o._id" class="order-item">
            <div class="order-main">
              <strong>#{{ o._id.slice(-6) }}</strong>
              <span>₪{{ o.totalPrice }}</span>
              <span class="badge">סטטוס: {{ labelStatus(o.status) }}</span>
            </div>
            <div class="order-actions">
              <button @click="accept(o._id)" :disabled="actionBusy">קח הזמנה</button>
            </div>
          </li>
        </ul>
      </section>

      <section class="card">
        <h2>ההזמנות שלי</h2>
        <p v-if="loadingMine">טוען הזמנות...</p>
        <p v-else-if="myOrders.length === 0" class="muted">אין הזמנות פעילות</p>
        <ul v-else class="order-list">
          <li v-for="o in myOrders" :key="o._id" class="order-item">
            <div class="order-main">
              <strong>#{{ o._id.slice(-6) }}</strong>
              <span>₪{{ o.totalPrice }}</span>
              <span class="badge">סטטוס: {{ labelStatus(o.status) }}</span>
            </div>
            <div class="order-actions">
              <button
                v-if="o.status === 'assigned'"
                @click="updateStatus(o._id, 'out_for_delivery')"
                :disabled="actionBusy"
              >
                יציאה למשלוח
              </button>
              <button
                v-if="o.status === 'out_for_delivery'"
                @click="updateStatus(o._id, 'delivered')"
                :disabled="actionBusy"
              >
                סמן כנמסר
              </button>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import axios from 'axios'
import { io, Socket } from 'socket.io-client'
import { useUserStore } from '@/stores/user'

interface OrderDto {
  _id: string
  totalPrice: number
  status: 'pending' | 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled'
}

const userStore = useUserStore()
const uid = userStore.uid

const availableOrders = ref<OrderDto[]>([])
const myOrders = ref<OrderDto[]>([])
const loadingAvailable = ref(false)
const loadingMine = ref(false)
const actionBusy = ref(false)
let socket: Socket | null = null

function labelStatus(s: OrderDto['status']) {
  return s === 'pending'
    ? 'ממתינה'
    : s === 'assigned'
      ? 'שויכה'
      : s === 'out_for_delivery'
        ? 'בדרך'
        : s === 'delivered'
          ? 'נמסרה'
          : 'בוטלה'
}

async function fetchAvailable() {
  loadingAvailable.value = true
  try {
    const { data } = await axios.get('http://localhost:3000/api/orders/available/list')
    availableOrders.value = data
  } finally {
    loadingAvailable.value = false
  }
}

async function fetchMine() {
  loadingMine.value = true
  try {
    const { data } = await axios.get(`http://localhost:3000/api/orders/courier/${uid}`)
    myOrders.value = data
  } finally {
    loadingMine.value = false
  }
}

async function accept(orderId: string) {
  actionBusy.value = true
  try {
    await axios.post(`http://localhost:3000/api/orders/${orderId}/accept`, { courierId: uid })
    await Promise.all([fetchAvailable(), fetchMine()])
  } catch (e) {
    console.error(e)
  } finally {
    actionBusy.value = false
  }
}

async function updateStatus(
  orderId: string,
  status: 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled',
) {
  actionBusy.value = true
  try {
    await axios.post(`http://localhost:3000/api/orders/${orderId}/status`, { status })
    await fetchMine()
  } finally {
    actionBusy.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchAvailable(), fetchMine()])
  socket = io('http://localhost:3000', {
    transports: ['websocket'],
    withCredentials: true,
  })

  socket.on('order:new', (order: OrderDto) => {
    if (order.status === 'pending') fetchAvailable()
  })

  socket.on('order:assigned', () => {
    fetchAvailable()
    fetchMine()
  })

  socket.on('order:status', (order: OrderDto) => {
    fetchMine()
    if (order.status === 'pending') fetchAvailable()
  })
})

onBeforeUnmount(() => {
  socket?.disconnect()
})
</script>

<style scoped>
.courier-page {
  max-width: 1000px;
  margin: 0 auto;
}
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.card {
  background: #fff;
  border-radius: 16px;
  padding: 1rem 1.2rem;
  box-shadow: var(--shadow, 0 4px 6px rgba(0, 0, 0, 0.1));
}
.order-list {
  list-style: none;
}
.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
}
.order-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.order-actions button + button {
  margin-inline-start: 0.5rem;
}
.badge {
  background: var(--bg-secondary, #f9fafb);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  font-size: 0.85rem;
}
.muted {
  color: var(--neutral, #6b7280);
}
@media (max-width: 900px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
