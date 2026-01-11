<template>
  <div class="notification-center">
    <div class="notification-header">
      <h2>התראות</h2>
      <div class="header-actions">
        <button
          v-if="unreadNotifications.length > 0"
          @click="markAllAsReadHandler"
          class="btn-text"
        >
          סמן הכל כנקרא
        </button>
        <router-link to="/notification-settings" class="btn-icon" title="הגדרות התראות">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path
              d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
            />
          </svg>
        </router-link>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>טוען התראות...</p>
    </div>

    <div v-else-if="notifications.length === 0" class="empty-state">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 24 24"
        width="64"
        height="64"
      >
        <path
          d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
        />
      </svg>
      <h3>אין התראות חדשות</h3>
      <p>כשיהיו מוצרים חדשים קרובים אליך, תראה אותם כאן</p>
      <router-link to="/notification-settings" class="btn-primary">הגדר התראות</router-link>
    </div>

    <div v-else class="notifications-list">
      <div class="filter-tabs">
        <button
          v-for="tab in ['all', 'unread'] as const"
          :key="tab"
          @click="currentFilter = tab"
          :class="['filter-tab', { active: currentFilter === tab }]"
        >
          {{ tab === 'all' ? 'הכל' : 'לא נקראו' }}
          <span v-if="tab === 'unread' && unreadNotifications.length > 0" class="count">
            {{ unreadNotifications.length }}
          </span>
        </button>
      </div>

      <transition-group name="notification-list" tag="div">
        <div
          v-for="notification in filteredNotifications"
          :key="notification._id"
          :class="['notification-item', { unread: !notification.isRead }]"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon" :class="notification.type">
            <svg
              v-if="notification.type === 'newProduct'"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              />
            </svg>
            <svg
              v-else-if="notification.type === 'discount'"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path
                d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"
              />
            </svg>
            <svg
              v-else-if="notification.type === 'expiringSoon'"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path
                d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
              />
            </svg>
          </div>

          <div class="notification-content">
            <h4>{{ notification.title }}</h4>
            <p>{{ notification.message }}</p>
            <div v-if="notification.productData" class="product-preview">
              <img
                v-if="notification.productData.imageUrl"
                :src="notification.productData.imageUrl"
                :alt="notification.productData.name"
              />
              <div class="product-info">
                <span class="product-name">{{ notification.productData.name }}</span>
                <span class="product-price">{{ notification.productData.price }} ₪</span>
                <span v-if="notification.productData.location?.city" class="product-location">
                  {{ notification.productData.location.city }}
                </span>
              </div>
            </div>
            <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
          </div>

          <div class="notification-actions">
            <button
              @click.stop="markAsReadHandler(notification._id)"
              v-if="!notification.isRead"
              class="btn-mark-read"
              title="סמן כנקרא"
            >
              ✓
            </button>
            <button
              @click.stop="deleteNotificationHandler(notification._id)"
              class="btn-delete"
              title="מחק"
            >
              ✕
            </button>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from 'vue-toastification'
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type NotificationData,
} from '@/services/notifications'

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()

const notifications = ref<NotificationData[]>([])
const loading = ref(true)
const currentFilter = ref<'all' | 'unread'>('all')

const unreadNotifications = computed(() => notifications.value.filter((n) => !n.isRead))

const filteredNotifications = computed(() => {
  if (currentFilter.value === 'unread') {
    return unreadNotifications.value
  }
  return notifications.value
})

const loadNotifications = async () => {
  if (!userStore.uid) {
    router.push('/auth')
    return
  }

  loading.value = true
  try {
    const data = await fetchNotifications(userStore.uid, { limit: 50 })
    notifications.value = data.notifications
  } catch (error) {
    console.error('Error loading notifications:', error)
    toast.error('שגיאה בטעינת ההתראות')
  } finally {
    loading.value = false
  }
}

const handleNotificationClick = async (notification: NotificationData) => {
  if (!notification.isRead) {
    await markAsReadHandler(notification._id)
  }

  if (notification.productId) {
    router.push(`/product/${notification.productId}`)
  }
}

const markAsReadHandler = async (notificationId: string) => {
  try {
    await markAsRead(notificationId)
    const index = notifications.value.findIndex((n) => n._id === notificationId)
    if (index !== -1) {
      notifications.value[index].isRead = true
    }
    // ⭐ רענון ספירת התראות בפעמון
    await loadNotifications()
    // ⭐ שליחת אירוע גלובלי לעדכון הפעמון
    window.dispatchEvent(new CustomEvent('notifications-updated'))
  } catch (error) {
    console.error('Error marking as read:', error)
  }
}

const markAllAsReadHandler = async () => {
  if (!userStore.uid) return
  try {
    await markAllAsRead(userStore.uid)
    notifications.value.forEach((n) => (n.isRead = true))
    toast.success('כל ההתראות סומנו כנקראו')
    // ⭐ רענון ספירת התראות בפעמון
    await loadNotifications()
    // ⭐ שליחת אירוע גלובלי לעדכון הפעמון
    window.dispatchEvent(new CustomEvent('notifications-updated'))
  } catch (error) {
    console.error('Error marking all as read:', error)
    toast.error('שגיאה בסימון ההתראות')
  }
}

const deleteNotificationHandler = async (notificationId: string) => {
  try {
    await deleteNotification(notificationId)
    notifications.value = notifications.value.filter((n) => n._id !== notificationId)
    toast.success('ההתראה נמחקה')
  } catch (error) {
    console.error('Error deleting notification:', error)
    toast.error('שגיאה במחיקת ההתראה')
  }
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'עכשיו'
  if (minutes < 60) return `לפני ${minutes} דקות`
  if (hours < 24) return `לפני ${hours} שעות`
  if (days < 7) return `לפני ${days} ימים`
  return date.toLocaleDateString('he-IL')
}

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notification-center {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.notification-header h2 {
  font-size: 1.8rem;
  font-weight: bold;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-text {
  background: none;
  border: none;
  color: #8b5cf6;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.btn-text:hover {
  background: #f5f3ff;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f5f5f5;
  color: #666;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #e0e0e0;
  color: #333;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-state svg {
  color: #ccc;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #999;
  margin-bottom: 2rem;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 600;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.filter-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e0e0e0;
}

.filter-tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: #666;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-tab:hover {
  color: #333;
}

.filter-tab.active {
  color: #8b5cf6;
  border-bottom-color: #8b5cf6;
}

.filter-tab .count {
  background: #ff4757;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: bold;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.notification-item {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.notification-item:hover {
  border-color: #8b5cf6;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
  transform: translateX(-4px);
}

.notification-item.unread {
  background: #f5f3ff;
  border-color: #8b5cf6;
}

.notification-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.notification-icon.newProduct {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.notification-icon.discount {
  background: linear-gradient(135deg, #ff4757 0%, #ff6348 100%);
}

.notification-icon.expiringSoon {
  background: linear-gradient(135deg, #ffa502 0%, #ff7f00 100%);
}

.notification-icon.priceAlert {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.notification-content {
  flex: 1;
}

.notification-content h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.notification-content p {
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.product-preview {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.product-preview img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.product-name {
  font-weight: 600;
  color: #333;
}

.product-price {
  color: #8b5cf6;
  font-weight: bold;
  font-size: 1.1rem;
}

.product-location {
  color: #999;
  font-size: 0.85rem;
}

.notification-time {
  font-size: 0.85rem;
  color: #999;
}

.notification-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-mark-read,
.btn-delete {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-mark-read {
  background: #f5f3ff;
  color: #8b5cf6;
}

.btn-mark-read:hover {
  background: #8b5cf6;
  color: white;
}

.btn-delete {
  background: #f5f3ff;
  color: #8b5cf6;
}

.btn-delete:hover {
  background: #8b5cf6;
  color: white;
}

.notification-list-move,
.notification-list-enter-active,
.notification-list-leave-active {
  transition: all 0.3s ease;
}

.notification-list-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.notification-list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.notification-list-leave-active {
  position: absolute;
}
</style>
