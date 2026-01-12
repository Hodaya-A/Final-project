<template>
  <div class="orders-page">
    <h1>ההזמנות שלי</h1>

    <div v-if="loading">טוען הזמנות...</div>

    <div v-else-if="orders.length === 0">לא נמצאו הזמנות קודמות.</div>

    <div v-else class="orders-list">
      <div class="orders-header">
        <div><strong>מספר הזמנות:</strong> {{ orders.length }}</div>
        <div>
          <button class="refresh-btn" @click="fetchOrders(userStore.uid)">רענן</button>
        </div>
      </div>
      <div v-for="(order, i) in orders" :key="i" class="order-card">
        <div class="order-header" @click="toggle(i)">
          <p><strong> תאריך:</strong> {{ formatDate(order.date) }}</p>
          <p><strong> סכום:</strong> ₪{{ order.total.toFixed(2) }}</p>
          <div class="status-badge" :class="getOrderStatusClass(order)">
            {{ getOrderStatusText(order) }}
          </div>
          <!-- התראה אם זה הומר ממשלוח לאיסוף -->
          <div v-if="wasConvertedToPickup(order)" class="timeout-warning">⚠️ הומר לאיסוף עצמי</div>
          <button class="details-btn">
            {{ expandedOrder === i ? 'הסתר פרטים' : 'הצג פרטים' }}
          </button>
        </div>

        <transition name="fade">
          <div v-if="expandedOrder === i" class="order-details">
            <!-- Real-time status display for active orders -->
            <CustomerOrderStatus
              v-if="!order.deliveredAt && order._id"
              :order="convertToStatusOrder(order)"
            />

            <ul class="item-list">
              <li v-for="(item, j) in order.items" :key="j" class="item-row">
                <img
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  alt="תמונה של {{ item.name }}"
                  class="item-image"
                />
                <div class="item-info">
                  <strong>{{ item.name }}</strong
                  ><br />
                  {{ item.quantity }} × ₪{{ item.price }}
                  <br />
                  <button class="mini-btn" @click.stop="addItemToCart(item)">הוסף שוב לסל</button>
                </div>
              </li>
            </ul>

            <!-- דירוג להזמנה -->
            <div class="rating">
              דירוג:
              <span
                v-for="star in 5"
                :key="star"
                class="star"
                :class="{ filled: (order.rating ?? 0) >= star }"
                @click.stop="setRating(i, star)"
                >★</span
              >
            </div>
            <div class="order-meta">
              <small>מס' הזמנה: {{ orderId(order) }}</small>
              <small> | </small>
              <small>נוצר ב־{{ formatDate(order.date) }}</small>
            </div>
            <!-- כפתור הזמנה חוזרת -->
            <button class="repeat-btn" @click.stop="repeatOrder(order.items)">
              בצע הזמנה חוזרת
            </button>
          </div>
        </transition>
      </div>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { useToast } from 'vue-toastification'
import axios from 'axios'
import CustomerOrderStatus from '@/components/CustomerOrderStatus.vue'
import { connectSocket, disconnectSocket, joinCustomer } from '@/services/socket'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  shopId?: string
  shopName?: string
}

interface Order {
  date: Date
  total: number
  items: OrderItem[]
  rating?: number
  approvedAt?: Date | null
  _id?: string
  readyForPickup?: boolean
  deliveryMethod?: 'delivery' | 'pickup'
  courierId?: string | null
  deliveredAt?: Date | null
  status?: string
  shopId?: string
}

interface BackendOrderItem {
  productId?: string
  id?: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

interface BackendOrder {
  _id?: string
  createdAt?: string | number | Date
  totalPrice?: number
  items?: BackendOrderItem[]
  approvedAt?: string | Date | null
  deliveredAt?: string | Date | null
  readyForPickup?: boolean
  deliveryMethod?: 'delivery' | 'pickup'
  courierId?: string | null
  status?: string
  shopId?: string
}

const userStore = useUserStore()
const cartStore = useCartStore()
const toast = useToast()

const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref('')
const expandedOrder = ref<number | null>(null)
const previousStatuses = ref<Map<string, string>>(new Map())
const mutedOrders = ref<Set<string>>(new Set())
let pollingInterval: number | null = null

function convertToStatusOrder(order: Order) {
  return {
    _id: order._id || '',
    status: order.status || 'PENDING',
    totalPrice: order.total,
    deliveryMethod: order.deliveryMethod || 'delivery',
    createdAt: order.date,
    shopId: order.shopId,
  }
}

async function fetchOrders(uid?: string, silent = false) {
  if (!uid) {
    orders.value = []
    error.value = 'לא ניתן לטעון הזמנות – אין משתמש מחובר.'
    loading.value = false
    return
  }

  try {
    if (!silent) loading.value = true
    error.value = ''

    // first try by UID
    let resp = await axios.get(`http://localhost:3000/api/orders/${encodeURIComponent(uid)}`)

    const newOrders = (resp.data as BackendOrder[]).map((o: BackendOrder) => ({
      _id: o._id,
      date: o.createdAt ? new Date(o.createdAt) : new Date(),
      total: o.totalPrice ?? 0,
      items: (o.items || []).map((it: BackendOrderItem) => ({
        id: it.productId || it.id || '',
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        imageUrl: it.imageUrl,
      })) as OrderItem[],
      rating: 0,
      approvedAt: o.approvedAt ? new Date(o.approvedAt) : null,
      readyForPickup: o.readyForPickup || false,
      deliveryMethod: o.deliveryMethod,
      courierId: o.courierId,
      deliveredAt: o.deliveredAt ? new Date(o.deliveredAt) : null,
    }))

    // בדוק שינויי סטטוס והצג התראות
    if (previousStatuses.value.size > 0) {
      checkStatusChanges(newOrders)
    }

    // עדכן את ה-map של הסטטוסים הקודמים
    newOrders.forEach((order: Order) => {
      const orderId = order._id || ''
      const currentStatus = getOrderStatusText(order)
      previousStatuses.value.set(orderId, currentStatus)
    })

    orders.value = newOrders

    // fallback: if no orders found for uid, try fetching by email (some orders may have been saved using email)
    if (orders.value.length === 0 && userStore.email) {
      try {
        resp = await axios.get(
          `http://localhost:3000/api/orders/${encodeURIComponent(userStore.email)}`,
        )
        const byEmail = (resp.data as BackendOrder[]).map((o: BackendOrder) => ({
          _id: o._id,
          date: o.createdAt ? new Date(o.createdAt) : new Date(),
          total: o.totalPrice ?? 0,
          items: (o.items || []).map((it: BackendOrderItem) => ({
            id: it.productId || it.id || '',
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            imageUrl: it.imageUrl,
          })) as OrderItem[],
          rating: 0,
          approvedAt: o.approvedAt ? new Date(o.approvedAt) : null,
          readyForPickup: o.readyForPickup || false,
          deliveryMethod: o.deliveryMethod,
        }))

        if (byEmail.length > 0) {
          orders.value = byEmail
          // clear any stale error
          error.value = ''
        }
      } catch (e: unknown) {
        console.warn('MyOrdersView: fallback by-email fetch failed', e)
      }
    }
  } catch (err: unknown) {
    console.error('Error fetching orders:', err)
    if (!silent) error.value = 'אירעה שגיאה בעת טעינת ההזמנות.'
  } finally {
    if (!silent) loading.value = false
  }
}

// בדיקת שינויי סטטוס והצגת התראות
function checkStatusChanges(newOrders: Order[]) {
  newOrders.forEach((order: Order) => {
    const orderId = order._id || ''
    const previousStatus = previousStatuses.value.get(orderId)
    const currentStatus = getOrderStatusText(order)

    if (previousStatus && previousStatus !== currentStatus) {
      // הסטטוס השתנה - הצג התראה!
      showStatusNotification(order, previousStatus, currentStatus)
    }
  })
}

// הצגת התראה על שינוי סטטוס
function showStatusNotification(order: Order, oldStatus: string, newStatus: string) {
  const orderId = (order._id || '').slice(-6)

  // אם הזמנה הומרה לאיסוף עצמי (timeout)
  if (wasConvertedToPickup(order)) {
    toast.warning(`⚠️ הזמנה ${orderId}: לא נמצא שליח זמין.\nההזמנה מוכנה לאיסוף עצמי בחנות.`, {
      timeout: 10000,
      closeOnClick: true,
      pauseOnHover: true,
    })
    return
  }

  // אל תשלח עוד התראות אחרי האישור הראשוני — למעט אזהרת timeout
  const fullOrderId = order._id || ''
  if (mutedOrders.value.has(fullOrderId)) {
    return
  }

  // התראות אחרות
  if (newStatus === 'אושר') {
    toast.success(`✅ הזמנה ${orderId} אושרה על ידי החנות!`, { timeout: 5000 })
    // השתק התראות נוספות עבור הזמנה זו (למנוע ספאם)
    mutedOrders.value.add(fullOrderId)
  } else if (newStatus === 'מוכן לאיסוף') {
    toast.info(`📦 הזמנה ${orderId} מוכנה לאיסוף!`, { timeout: 5000 })
  } else if (newStatus === 'בדרך אליך') {
    toast.info(`🚚 הזמנה ${orderId} בדרך אליך!`, { timeout: 5000 })
  } else if (newStatus === 'נאסף') {
    toast.success(`🎉 הזמנה ${orderId} נאספה בהצלחה!`, { timeout: 5000 })
  }
}

watch(
  () => userStore.uid,
  (uid) => {
    // load orders when uid changes
    fetchOrders(uid as string)
  },
  { immediate: true },
)

// Polling אוטומטי כל 10 שניות
onMounted(() => {
  // Connect to Socket.io for real-time updates
  if (userStore.uid) {
    connectSocket()
    joinCustomer(userStore.uid)
  }

  pollingInterval = window.setInterval(() => {
    if (userStore.uid) {
      fetchOrders(userStore.uid as string, true) // silent=true כדי לא להציג spinner
    }
  }, 10000) // כל 10 שניות
})

onBeforeUnmount(() => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
  }
  disconnectSocket()
})

function formatDate(dt: Date): string {
  try {
    return dt?.toLocaleString('he-IL') || ''
  } catch {
    return ''
  }
}

function toggle(index: number) {
  expandedOrder.value = expandedOrder.value === index ? null : index
}

function setRating(orderIndex: number, rating: number) {
  orders.value[orderIndex].rating = rating
  // ניתן להוסיף כאן שליחה ל־Firestore אם רוצים לשמור
}

function repeatOrder(items: OrderItem[]) {
  for (const item of items) {
    cartStore.addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      shopId: item.shopId,
      shopName: item.shopName,
    })
  }
}

function addItemToCart(item: OrderItem) {
  cartStore.addToCart({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: 1,
    imageUrl: item.imageUrl,
    shopId: item.shopId,
    shopName: item.shopName,
  })
}

function orderId(order: Order) {
  // backend returns _id in raw data but we mapped only specific fields;
  // try to read id from any available place if present
  // This function is defensive: if no id available, return empty string
  // when using BackendOrder we could expose raw _id; for now return first 8 chars of date/time
  try {
    return order.date ? order.date.getTime().toString().slice(-8) : ''
  } catch {
    return ''
  }
}

function getOrderStatusClass(order: Order) {
  if (order.deliveredAt) return 'delivered'
  if (order.readyForPickup) return 'ready'
  if (order.approvedAt) return 'approved'
  return 'pending'
}

function getOrderStatusText(order: Order) {
  if (order.deliveredAt) {
    return 'נאסף'
  }
  if (order.readyForPickup) {
    if (order.deliveryMethod === 'pickup') {
      return 'מוכן לאיסוף'
    }
    // משלוח: אם יש שליח — בדרך אליך; אחרת — מחכה למשלוח
    if (order.courierId) {
      return 'בדרך אליך'
    }
    return 'מחכה למשלוח'
  }
  if (order.approvedAt) return 'אושר'
  return 'ממתין לאישור'
}

// בדיקה אם הזמנה הומרה ממשלוח לאיסוף (timeout)
function wasConvertedToPickup(order: Order) {
  // אם ההזמנה מוכנה והיא איסוף, אבל אין courierId - כנראה הומרה
  return (
    order.readyForPickup &&
    order.deliveryMethod === 'pickup' &&
    !order.courierId &&
    !order.deliveredAt
  )
}
</script>

<style scoped>
.orders-page {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  font-family: 'Courier New', Courier, monospace;
}

.orders-page h1 {
  color: var(--primary);
  font-size: 2.5rem;
  margin: 0 0 2rem 0;
  font-weight: bold;
  text-align: center;
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 12px;
}

.orders-header strong {
  color: var(--primary);
  font-size: 1.2rem;
}

.refresh-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: bold;
  font-family: 'Courier New', Courier, monospace;
  box-shadow: 0 3px 8px rgba(99, 102, 241, 0.25);
  transition: all 0.3s;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.order-card {
  background: #ffffff;
  border: 2px solid #e8f0fe;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s;
}

.order-card:hover {
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.15);
  border-color: var(--primary);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  flex-wrap: wrap;
  gap: 1rem;
}

.order-header p {
  margin: 0;
  font-size: 1.05rem;
  color: #2d3748;
}

.order-header strong {
  color: var(--primary);
}

.status-badge {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
  text-align: center;
  white-space: nowrap;
}

.status-badge.pending {
  background: linear-gradient(135deg, #fff3cd 0%, #ffe8a1 100%);
  color: #856404;
  border: 2px solid var(--warning);
}

.status-badge.approved {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  color: #155724;
  border: 2px solid var(--success);
}

.status-badge.ready {
  background: linear-gradient(135deg, #cfe2ff 0%, #9ec5fe 100%);
  color: #084298;
  border: 2px solid #0d6efd;
}

.status-badge.delivered {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #1e293b;
  border: 2px solid #64748b;
}

.timeout-warning {
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: bold;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 2px solid #f59e0b;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
}

.details-btn {
  background: var(--gradient-primary);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.6rem 1.2rem;
  cursor: pointer;
  font-weight: bold;
  font-family: 'Courier New', Courier, monospace;
  transition: all 0.2s;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.2);
}

.details-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.order-details {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 2px solid #e8f0fe;
}

.item-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  transition: background 0.2s;
}

.item-row:hover {
  background: #e8f0fe;
}

.item-image {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
}

.item-info {
  font-size: 1rem;
  color: #2d3748;
  flex: 1;
}

.item-info strong {
  color: var(--primary);
  font-size: 1.05rem;
}

.mini-btn {
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  border: 2px solid var(--primary);
  border-radius: 8px;
  background-color: white;
  color: var(--primary);
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.mini-btn:hover {
  background-color: var(--primary);
  color: white;
}

.rating {
  margin: 1rem 0;
  font-size: 1.1rem;
  font-weight: bold;
  color: #2d3748;
}

.star {
  font-size: 1.5rem;
  cursor: pointer;
  color: #d0d0d0;
  transition: color 0.2s;
  margin: 0 0.1rem;
}

.star:hover {
  color: #ffd700;
}

.star.filled {
  color: #ffd700;
}

.order-meta {
  color: #718096;
  font-size: 0.9rem;
  margin: 1rem 0;
}

.repeat-btn {
  margin-top: 1rem;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  font-weight: bold;
  font-family: 'Courier New', Courier, monospace;
  box-shadow: 0 3px 8px rgba(99, 102, 241, 0.25);
  transition: all 0.3s;
  width: 100%;
  font-size: 1.05rem;
}

.repeat-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
}

.error {
  color: #e53e3e;
  font-weight: bold;
  margin-top: 1.5rem;
  text-align: center;
  background: #fee;
  padding: 1rem;
  border-radius: 12px;
  border: 2px solid #fcc;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
