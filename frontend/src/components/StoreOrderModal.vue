<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="order-modal-overlay" @click.self="playSound">
        <div class="order-modal">
          <div class="order-header">
            <h1 class="order-title">הזמנה חדשה התקבלה</h1>
            <p class="order-number">מספר הזמנה: {{ orderNumber }}</p>
          </div>

          <div class="order-content">
            <div class="section">
              <h2>פרטי לקוח</h2>
              <p class="detail-text">דוא"ל: {{ order?.userEmail || 'לא זמין' }}</p>
              <p class="detail-text">שיטת משלוח: {{ deliveryMethodText }}</p>
            </div>

            <div class="section">
              <h2>פריטים בהזמנה</h2>
              <div class="items-list">
                <div v-for="(item, index) in order?.items" :key="index" class="item-row">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-qty">x{{ item.quantity }}</span>
                  <span class="item-price">₪{{ (item.price * item.quantity).toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div class="section total-section">
              <h2>סכום כולל</h2>
              <p class="total-price">₪{{ order?.totalPrice?.toFixed(2) }}</p>
            </div>
          </div>

          <div class="order-actions">
            <button class="btn-reject" @click="handleReject" :disabled="isProcessing">
              דחה הזמנה
            </button>
            <button class="btn-approve" @click="handleApprove" :disabled="isProcessing">
              אשר והכן
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { getSocket } from '@/services/socket'
import axios from 'axios'

interface OrderItem {
  productId?: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

interface Order {
  _id: string
  userId: string
  userEmail?: string
  shopId: string
  items: OrderItem[]
  totalPrice: number
  deliveryMethod: 'delivery' | 'pickup'
  status: string
  createdAt: Date
}

const isOpen = ref(false)
const order = ref<Order | null>(null)
const isProcessing = ref(false)
let audioElement: HTMLAudioElement | null = null

const orderNumber = computed(() => {
  if (!order.value?._id) return ''
  return order.value._id.slice(-8).toUpperCase()
})

const deliveryMethodText = computed(() => {
  if (!order.value) return ''
  return order.value.deliveryMethod === 'delivery' ? 'משלוח' : 'איסוף עצמי'
})

function playSound() {
  if (!audioElement) {
    audioElement = new Audio('/notification.mp3')
    audioElement.loop = true
  }
  audioElement.play().catch((e) => console.warn('Cannot play sound:', e))
}

function stopSound() {
  if (audioElement) {
    audioElement.pause()
    audioElement.currentTime = 0
  }
}

function handleNewOrder(data: { orderId: string; order: Order }) {
  order.value = data.order
  isOpen.value = true
  playSound()
}

async function handleApprove() {
  if (!order.value || isProcessing.value) return

  isProcessing.value = true
  try {
    await axios.post(`/api/orders/approve/${order.value._id}`)
    stopSound()
    isOpen.value = false
    order.value = null
  } catch (error) {
    console.error('Error approving order:', error)
    alert('שגיאה באישור ההזמנה')
  } finally {
    isProcessing.value = false
  }
}

async function handleReject() {
  if (!order.value || isProcessing.value) return

  isProcessing.value = true
  try {
    await axios.post(`/api/orders/reject/${order.value._id}`)
    stopSound()
    isOpen.value = false
    order.value = null
  } catch (error) {
    console.error('Error rejecting order:', error)
    alert('שגיאה בדחיית ההזמנה')
  } finally {
    isProcessing.value = false
  }
}

onMounted(() => {
  const socket = getSocket()

  // Ensure socket is connected
  if (!socket.connected) {
    socket.connect()
  }

  // Set up listener
  socket.on('new-order', handleNewOrder)
})

onBeforeUnmount(() => {
  const socket = getSocket()
  socket.off('new-order', handleNewOrder)
  stopSound()
})
</script>

<style scoped>
.order-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: grid;
  place-items: center;
  z-index: 10001;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.order-modal {
  background: var(--bg-primary, #ffffff);
  width: min(650px, 100%);
  max-height: 90vh;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--font-family, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
}

.order-header {
  background: var(--primary, #4a90e2);
  color: white;
  padding: 24px;
  text-align: center;
}

.order-title {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.order-number {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  opacity: 0.95;
}

.order-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.section {
  margin-bottom: 24px;
}

.section h2 {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #1a1a1a);
  border-bottom: 2px solid var(--border, #e0e0e0);
  padding-bottom: 8px;
}

.detail-text {
  margin: 6px 0;
  font-size: 16px;
  color: var(--text-secondary, #4a4a4a);
  line-height: 1.6;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 6px;
  font-size: 15px;
}

.item-name {
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
}

.item-qty {
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
}

.item-price {
  font-weight: 700;
  color: var(--success, #10b981);
  text-align: left;
}

.total-section {
  border-top: 3px solid var(--border, #e0e0e0);
  padding-top: 16px;
}

.total-price {
  font-size: 32px;
  font-weight: 900;
  color: var(--primary, #4a90e2);
  margin: 8px 0 0;
  text-align: center;
}

.order-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 20px 24px;
  background: var(--bg-secondary, #f8f9fa);
  border-top: 1px solid var(--border, #e0e0e0);
}

.btn-approve,
.btn-reject {
  padding: 16px 24px;
  font-size: 17px;
  font-weight: 700;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-approve {
  background: var(--primary, #4a90e2);
  color: white;
}

.btn-approve:hover:not(:disabled) {
  background: var(--primary-dark, #357abd);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
}

.btn-reject {
  background: transparent;
  color: var(--error, #ef4444);
  border: 2px solid var(--error, #ef4444);
}

.btn-reject:hover:not(:disabled) {
  background: var(--error, #ef4444);
  color: white;
}

.btn-approve:disabled,
.btn-reject:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .order-modal,
.modal-fade-leave-active .order-modal {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .order-modal,
.modal-fade-leave-to .order-modal {
  transform: scale(0.9);
}
</style>
