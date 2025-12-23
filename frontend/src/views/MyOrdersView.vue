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
          <button class="details-btn">
            {{ expandedOrder === i ? 'הסתר פרטים' : 'הצג פרטים' }}
          </button>
        </div>

        <transition name="fade">
          <div v-if="expandedOrder === i" class="order-details">
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
import { ref, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import axios from 'axios'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

interface Order {
  date: Date
  total: number
  items: OrderItem[]
  rating?: number
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
  createdAt?: string | number | Date
  totalPrice?: number
  items?: BackendOrderItem[]
}

const userStore = useUserStore()
const cartStore = useCartStore()

const orders = ref<Order[]>([])
const loading = ref(true)
const error = ref('')
const expandedOrder = ref<number | null>(null)

async function fetchOrders(uid?: string) {
  if (!uid) {
    orders.value = []
    error.value = 'לא ניתן לטעון הזמנות – אין משתמש מחובר.'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = ''

    console.log('MyOrdersView: fetching orders for uid=', uid)
    // first try by UID
    let resp = await axios.get(`http://localhost:3000/api/orders/${encodeURIComponent(uid)}`)
    console.log('MyOrdersView: received response', resp.status, resp.data)

    orders.value = (resp.data as BackendOrder[]).map((o: BackendOrder) => ({
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
    }))

    // fallback: if no orders found for uid, try fetching by email (some orders may have been saved using email)
    if (orders.value.length === 0 && userStore.email) {
      try {
        console.log('MyOrdersView: no orders for uid, retrying with email=', userStore.email)
        resp = await axios.get(
          `http://localhost:3000/api/orders/${encodeURIComponent(userStore.email)}`,
        )
        console.log('MyOrdersView: received response for email', resp.status, resp.data)
        const byEmail = (resp.data as BackendOrder[]).map((o: BackendOrder) => ({
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
    error.value = 'אירעה שגיאה בעת טעינת ההזמנות.'
  } finally {
    loading.value = false
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
