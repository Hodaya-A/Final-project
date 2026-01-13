<template>
  <div class="order-status-container">
    <div class="status-display" :class="statusClass">
      <h2 class="status-text">{{ statusText }}</h2>
      <p v-if="statusSubtext" class="status-subtext">{{ statusSubtext }}</p>

      <button v-if="showNavigateButton" class="btn-navigate" @click="navigateToStore">
        נווט לחנות
      </button>
    </div>

    <div v-if="order" class="order-details">
      <div class="detail-row">
        <span class="label">מספר הזמנה:</span>
        <span class="value">{{ orderNumber }}</span>
      </div>
      <div class="detail-row">
        <span class="label">סכום:</span>
        <span class="value">₪{{ order.totalPrice.toFixed(2) }}</span>
      </div>
      <div class="detail-row">
        <span class="label">שיטת משלוח:</span>
        <span class="value">{{ deliveryMethodText }}</span>
      </div>
      <div v-if="order.createdAt" class="detail-row">
        <span class="label">תאריך הזמנה:</span>
        <span class="value">{{ formatDate(order.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { getSocket } from '@/services/socket'

interface Order {
  _id: string
  status: string
  totalPrice: number
  deliveryMethod: 'delivery' | 'pickup'
  createdAt?: Date
  shopId?: string
}

const props = defineProps<{
  order: Order | null
}>()

const currentStatus = ref(props.order?.status || 'PENDING')

watch(
  () => props.order?.status,
  (newStatus) => {
    if (newStatus) currentStatus.value = newStatus
  },
)

const orderNumber = computed(() => {
  if (!props.order?._id) return ''
  return props.order._id.slice(-8).toUpperCase()
})

const deliveryMethodText = computed(() => {
  if (!props.order) return ''
  return props.order.deliveryMethod === 'delivery' ? 'משלוח' : 'איסוף עצמי'
})

const statusClass = computed(() => {
  const status = currentStatus.value
  if (status === 'PENDING') return 'status-pending'
  if (status === 'APPROVED' || status === 'PREPARING') return 'status-approved'
  if (status === 'COURIER_ASSIGNED' || status === 'IN_DELIVERY') return 'status-courier'
  if (status === 'READY_FOR_PICKUP') {
    return props.order?.deliveryMethod === 'pickup' ? 'status-ready-pickup' : 'status-warning'
  }
  if (status === 'DELIVERED') return 'status-delivered'
  if (status === 'REJECTED') return 'status-rejected'
  return 'status-pending'
})

const statusText = computed(() => {
  const status = currentStatus.value
  if (status === 'PENDING') return 'ממתין לאישור'
  if (status === 'APPROVED' || status === 'PREPARING') return 'מכינים את ההזמנה שלך'
  if (status === 'COURIER_ASSIGNED') return 'שליח בדרך אליך'
  if (status === 'IN_DELIVERY') return 'ההזמנה בדרך'
  if (status === 'READY_FOR_PICKUP') {
    if (props.order?.deliveryMethod === 'pickup') {
      return 'ההזמנה מוכנה לאיסוף'
    }
    return 'לא נמצא שליח - עבר לאיסוף עצמי'
  }
  if (status === 'DELIVERED') return 'ההזמנה נמסרה בהצלחה'
  if (status === 'REJECTED') return 'ההזמנה נדחתה'
  return 'מעדכן מצב...'
})

const statusSubtext = computed(() => {
  const status = currentStatus.value
  if (status === 'PENDING') return 'בקרוב תקבל עדכון'
  if (status === 'APPROVED') return 'ההזמנה בהכנה כעת'
  if (status === 'COURIER_ASSIGNED') return 'השליח אסף את ההזמנה'
  if (status === 'READY_FOR_PICKUP' && props.order?.deliveryMethod === 'pickup') {
    return 'ניתן לאסוף את ההזמנה בחנות'
  }
  return null
})

const showNavigateButton = computed(() => {
  return currentStatus.value === 'READY_FOR_PICKUP' && props.order?.deliveryMethod === 'pickup'
})

function navigateToStore() {
  if (!props.order?.shopId) return
  // Implement navigation to store location
  alert('ניווט לחנות - יש להטמיע מפה/ניווט')
}

function formatDate(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleString('he-IL', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  const socket = getSocket()

  socket.on('order-approved', (data: { orderId: string; status: string }) => {
    if (data.orderId === props.order?._id) {
      currentStatus.value = data.status
    }
  })

  socket.on('order-ready', (data: { orderId: string; status: string }) => {
    if (data.orderId === props.order?._id) {
      currentStatus.value = data.status
    }
  })

  socket.on('courier-assigned', (data: { orderId: string; status: string }) => {
    if (data.orderId === props.order?._id) {
      currentStatus.value = data.status
    }
  })

  socket.on('order-converted-to-pickup', (data: { orderId: string; status: string }) => {
    if (data.orderId === props.order?._id) {
      currentStatus.value = data.status
    }
  })

  socket.on('order-delivered', (data: { orderId: string; status: string }) => {
    if (data.orderId === props.order?._id) {
      currentStatus.value = data.status
    }
  })

  socket.on('order-rejected', (data: { orderId: string; status: string }) => {
    if (data.orderId === props.order?._id) {
      currentStatus.value = data.status
    }
  })
})

onBeforeUnmount(() => {
  const socket = getSocket()
  socket.off('order-approved')
  socket.off('order-ready')
  socket.off('courier-assigned')
  socket.off('order-converted-to-pickup')
  socket.off('order-delivered')
  socket.off('order-rejected')
})
</script>

<style scoped>
.order-status-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.status-display {
  padding: 32px 24px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.status-text {
  font-size: 28px;
  font-weight: 900;
  margin: 0 0 8px;
  line-height: 1.3;
  font-family: var(--font-family, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif);
}

.status-subtext {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  opacity: 0.9;
}

.status-pending {
  background: var(--bg-muted, #f3f4f6);
  color: var(--text-muted, #6b7280);
}

.status-approved {
  background: linear-gradient(135deg, var(--success, #10b981) 0%, var(--primary, #3b82f6) 100%);
  color: white;
}

.status-courier {
  background: linear-gradient(135deg, var(--info, #3b82f6) 0%, var(--secondary, #8b5cf6) 100%);
  color: white;
}

.status-ready-pickup {
  background: var(--success, #10b981);
  color: white;
}

.status-warning {
  background: linear-gradient(135deg, var(--warning, #f59e0b) 0%, var(--error, #ef4444) 100%);
  color: white;
  animation: pulse 2s infinite;
}

.status-delivered {
  background: var(--success, #10b981);
  color: white;
}

.status-rejected {
  background: var(--error, #ef4444);
  color: white;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

.btn-navigate {
  margin-top: 16px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 700;
  background: white;
  color: var(--primary, #3b82f6);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-navigate:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.order-details {
  background: var(--bg-secondary, #f8f9fa);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid var(--border, #e5e7eb);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border, #e5e7eb);
  font-size: 15px;
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
}

.value {
  font-weight: 700;
  color: var(--text-primary, #1f2937);
}
</style>
