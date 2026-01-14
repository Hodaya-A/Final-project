<template>
  <div class="courier-page">
    <div class="header-section">
      <h1>מרכז שליחים</h1>
      <button @click="goToWallet" class="financial-btn">הארנק שלי</button>
    </div>

    <Transition name="warning-fade">
      <div v-if="userStore.courierOptIn && !hasPaymentDetails && isLoaded" class="warning-banner">
        <div class="warning-content">
          <div class="warning-text">
            <p class="warning-title">עדכון חשוב - פרטי תשלום חסרים</p>
            <p class="warning-desc">
              כדי שנוכל להעביר לך כספים, עליך להוסיף פרטי חשבון בנק בפרופיל.
            </p>
          </div>
        </div>
        <button type="button" class="btn-warning" @click="goToProfile">עדכן פרטי בנק</button>
      </div>
    </Transition>

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
            <div class="order-addresses" v-if="o.shippingAddress || o.shopAddress">
              <div class="address-box pickup" v-if="o.shopAddress">
                <strong>איסוף מ:</strong>
                <p>{{ o.shopName || 'החנות' }}</p>
                <p class="small">{{ o.shopAddress }}</p>
              </div>
              <div class="arrow">→</div>
              <div class="address-box delivery" v-if="o.shippingAddress">
                <strong>משלוח ל:</strong>
                <p>{{ o.shippingAddress.fullName }}</p>
                <p class="small">{{ o.shippingAddress.street }}, {{ o.shippingAddress.city }}</p>
                <p class="small">טלפון: {{ o.shippingAddress.phone }}</p>
                <p class="notes" v-if="o.shippingAddress.notes">{{ o.shippingAddress.notes }}</p>
              </div>
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
            <div class="order-addresses" v-if="o.shippingAddress || o.shopAddress">
              <div class="address-box pickup" v-if="o.shopAddress">
                <strong>איסוף מ:</strong>
                <p>{{ o.shopName || 'החנות' }}</p>
                <p class="small">{{ o.shopAddress }}</p>
              </div>
              <div class="arrow">→</div>
              <div class="address-box delivery" v-if="o.shippingAddress">
                <strong>משלוח ל:</strong>
                <p>{{ o.shippingAddress.fullName }}</p>
                <p class="small">{{ o.shippingAddress.street }}, {{ o.shippingAddress.city }}</p>
                <p class="small">טלפון: {{ o.shippingAddress.phone }}</p>
                <p class="notes" v-if="o.shippingAddress.notes">{{ o.shippingAddress.notes }}</p>
              </div>
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
import { onMounted, ref, onUnmounted } from 'vue'
import axios from 'axios'

import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import {
  getAvailableDeliveries,
  acceptDelivery as acceptDeliveryAPI,
  getMyDeliveries,
} from '@/services/courier'
const router = useRouter()
interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface ShippingAddress {
  fullName: string
  phone: string
  street: string
  city: string
  zip: string
  notes?: string
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
  shippingAddress?: ShippingAddress
  shopId?: string
  shopName?: string
  shopAddress?: string
}

const userStore = useUserStore()
const uid = userStore.uid

const availableOrders = ref<OrderDto[]>([])
const myOrders = ref<OrderDto[]>([])
const loadingAvailable = ref(false)
const loadingMine = ref(false)
const actionBusy = ref(false)
const hasPaymentDetails = ref(false)
const isLoaded = ref(false)

let unsubscribe: (() => void) | null = null

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
    const result = await getAvailableDeliveries()
    availableOrders.value = result.orders || []
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

function goToWallet() {
  // ✅ Navigate to financial wallet dashboard
  router.push('/courier/wallet')
}

function goToProfile() {
  router.push('/profile')
}

async function loadPaymentDetails() {
  try {
    const { doc, onSnapshot } = await import('firebase/firestore')
    const { db } = await import('@/services/firebase')

    const userRef = doc(db, 'users', userStore.uid || '')

    // Subscribe to real-time updates
    unsubscribe = onSnapshot(userRef, (userSnap) => {
      if (userSnap.exists()) {
        const data = userSnap.data()
        hasPaymentDetails.value = !!data.bankCode
      }
      isLoaded.value = true
    })
  } catch {
    // אם יש שגיאה, נניח שאין פרטים
    hasPaymentDetails.value = false
    isLoaded.value = true
  }
}

onMounted(async () => {
  await Promise.all([fetchAvailable(), fetchMine(), loadPaymentDetails()])
  // רענן כל 30 שניות
  setInterval(() => {
    fetchAvailable()
    fetchMine()
  }, 30000)
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
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

.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
}

.financial-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  white-space: nowrap;
}

.financial-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  filter: brightness(1.05);
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
  flex-direction: column;
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
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
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

.order-addresses {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
}

.address-box {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  background: white;
  border: 2px solid var(--border);
}

.address-box.pickup {
  border-color: var(--primary-light);
}

.address-box.delivery {
  border-color: var(--success);
}

.address-box strong {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--primary-dark);
  font-size: 0.9rem;
}

.address-box p {
  margin: 0.25rem 0;
  color: var(--neutral-dark);
}

.address-box .small {
  font-size: 0.85rem;
  color: var(--neutral);
}

.address-box .notes {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #fff3cd;
  border-radius: 4px;
  font-size: 0.85rem;
  color: #856404;
}

.arrow {
  font-size: 1.5rem;
  color: var(--primary);
  font-weight: bold;
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

/* Warning Banner Styles */
.warning-banner {
  background: #fef3c7;
  border: 1.5px solid #fbbf24;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.warning-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

.warning-text {
  flex: 1;
}

.warning-title {
  margin: 0;
  color: #92400e;
  font-weight: 700;
  font-size: 0.95rem;
}

.warning-desc {
  margin: 0.25rem 0 0;
  color: #b45309;
  font-size: 0.9rem;
}

.btn-warning {
  background: #f97316;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 0.6rem 1rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
}

.btn-warning:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.35);
}

.btn-warning:active {
  transform: translateY(0);
}

/* Warning Banner Transition */
.warning-fade-enter-active,
.warning-fade-leave-active {
  transition: all 0.3s ease;
}

.warning-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.warning-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
