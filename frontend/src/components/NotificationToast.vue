<template>
  <Teleport to="body">
    <TransitionGroup name="toast-slide" tag="div" class="notification-toast-container">
      <div
        v-for="notification in visibleNotifications"
        :key="notification._id"
        :class="['notification-toast', notification.type]"
      >
        <div class="toast-content">
          <h4>{{ notification.title }}</h4>
          <p>{{ notification.message }}</p>
          <div v-if="notification.productData" class="toast-product-info">
            <span class="product-name">{{ notification.productData.name }}</span>
            <span class="product-price">₪{{ notification.productData.price }}</span>
            <span v-if="notification.productData.distance" class="product-distance">
              {{ (notification.productData.distance / 1000).toFixed(1) }} ק"מ
            </span>
          </div>
        </div>

        <div class="toast-actions">
          <button @click="handleView(notification)" class="btn-accept" title="קבל והצג מוצר">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            קבל
          </button>
          <button @click="handleDismiss(notification)" class="btn-dismiss" title="התעלם">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
            התעלם
          </button>
        </div>

        <button @click="handleClose(notification)" class="btn-close" title="סגור">×</button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { NotificationData } from '@/services/notifications'

const visibleNotifications = ref<NotificationData[]>([])

// הוספת התראה חדשה
const showNotification = (notification: NotificationData) => {
  visibleNotifications.value.push(notification)

  // אין הסרה אוטומטית - ההתראה תישאר עד שהמשתמש יבחר "קבל" או "התעלם"
}

// צפייה במוצר (קבלה)
const handleView = (notification: NotificationData) => {
  // שליחת אירוע שההתראה נקראה
  window.dispatchEvent(
    new CustomEvent('notification-action', {
      detail: { notification, action: 'accept' },
    }),
  )

  // רק סוגר את ההתראה ללא ניווט
  handleClose(notification)
}

// התעלמות
const handleDismiss = (notification: NotificationData) => {
  // שליחת אירוע שהתעלמו מההתראה (לא נקראה)
  window.dispatchEvent(
    new CustomEvent('notification-action', {
      detail: { notification, action: 'dismiss' },
    }),
  )

  handleClose(notification)
}

// סגירה
const handleClose = (notification: NotificationData) => {
  const index = visibleNotifications.value.findIndex((n) => n._id === notification._id)
  if (index !== -1) {
    visibleNotifications.value.splice(index, 1)
  }
}

// האזנה לאירועים גלובליים
const handleGlobalNotification = (event: CustomEvent) => {
  showNotification(event.detail)
}

onMounted(() => {
  window.addEventListener('show-notification', handleGlobalNotification as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('show-notification', handleGlobalNotification as EventListener)
})

// חשיפת הפונקציה לשימוש חיצוני
defineExpose({ showNotification })
</script>

<style scoped>
.notification-toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  pointer-events: none;
}

.notification-toast {
  pointer-events: all;
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow:
    0 8px 24px rgba(139, 92, 246, 0.15),
    0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 12px;
  position: relative;
  border-right: 4px solid;
  animation: slideIn 0.3s ease-out;
}

.notification-toast.newProduct {
  border-right-color: #8b5cf6;
}

.notification-toast.discount {
  border-right-color: #ec4899;
}

.notification-toast.expiringSoon {
  border-right-color: #f59e0b;
}

.notification-toast.priceAlert {
  border-right-color: #10b981;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-content h4 {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px;
}

.toast-content p {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 8px;
  line-height: 1.4;
}

.toast-product-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  margin-top: 8px;
}

.product-name {
  font-weight: 600;
  color: #8b5cf6;
}

.product-price {
  color: #059669;
  font-weight: 600;
}

.product-distance {
  color: #6b7280;
}

.toast-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.toast-actions button {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-accept {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.btn-accept:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-dismiss {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-dismiss:hover {
  background: #e5e7eb;
  color: #374151;
}

.btn-close {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #9ca3af;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s;
  padding: 0;
}

.btn-close:hover {
  color: #374151;
}

/* אנימציות */
.toast-slide-enter-active {
  animation: slideIn 0.3s ease-out;
}

.toast-slide-leave-active {
  animation: slideOut 0.3s ease-in;
}

@keyframes slideIn {
  from {
    transform: translateX(120%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(120%);
    opacity: 0;
  }
}

@media (max-width: 640px) {
  .notification-toast-container {
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
