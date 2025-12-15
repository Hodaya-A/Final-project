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
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
  background: #f8fef9;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  font-family: 'Arial', sans-serif;
  color: #24452b;
}
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.order-card {
  background: #ffffff;
  border: 1px solid #d7e8dc;
  border-radius: 10px;
  padding: 1rem;
  transition: box-shadow 0.2s;
}
.order-card:hover {
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.details-btn {
  background-color: #24452b;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s;
}
.details-btn:hover {
  background-color: #1b3623;
}
.order-details {
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #ddd;
}
.item-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.item-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.item-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #ccc;
}
.item-info {
  font-size: 0.9rem;
  color: #333;
}
.mini-btn {
  font-size: 0.8rem;
  padding: 0.3rem 0.6rem;
  margin-top: 0.3rem;
  border: none;
  border-radius: 4px;
  background-color: #e1f3e8;
  color: #24452b;
  cursor: pointer;
}
.mini-btn:hover {
  background-color: #d0ebdb;
}
.rating {
  margin-top: 0.5rem;
}
.star {
  font-size: 1.2rem;
  cursor: pointer;
  color: #ccc;
}
.star.filled {
  color: #ffcc00;
}
.repeat-btn {
  margin-top: 0.8rem;
  background-color: #24452b;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: bold;
}
.repeat-btn:hover {
  background-color: #1b3623;
}
.error {
  color: red;
  font-weight: bold;
  margin-top: 1rem;
  text-align: center;
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
