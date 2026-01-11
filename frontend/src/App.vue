<template>
  <div id="app">
    <!-- 🔝 שורת עליונה: לוגו, חיפוש, התחברות -->
    <TopBar />

    <!-- 🔽 שורת קטגוריות -->
    <Navbar />

    <!-- 🧱 פריסת עמוד: צד שמאל סל | צד ימין תוכן -->
    <div class="layout">
      <main class="main-content">
        <router-view />
      </main>
    </div>

    <footer class="footer">
      <p>&copy; 2025 Fresh End</p>
    </footer>

    <!-- ⭐ התראות קופצות -->
    <NotificationToast ref="toastRef" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onBeforeUnmount } from 'vue'
import TopBar from '@/components/TopBar.vue'
import Navbar from '@/components/NavbarA.vue'
import NotificationToast from '@/components/NotificationToast.vue'
import { useUserStore } from '@/stores/user'
import { fetchNotifications, markAsRead } from '@/services/notifications'
import type { NotificationData } from '@/services/notifications'

const userStore = useUserStore()
const toastRef = ref()
const lastCheckedTime = ref<Date>(new Date())
let pollingInterval: number | null = null

// בדיקת התראות חדשות
const checkForNewNotifications = async () => {
  if (!userStore.uid) return

  try {
    // קבלת כל ההתראות שלא נקראו שנוצרו מאז הבדיקה האחרונה
    const data = await fetchNotifications(userStore.uid, {
      limit: 50,
      unreadOnly: true,
    })

    // סינון התראות שנוצרו אחרי הבדיקה האחרונה
    const newNotifications = data.notifications.filter((notif: NotificationData) => {
      const createdAt = new Date(notif.createdAt)
      return createdAt > lastCheckedTime.value
    })

    // הצגת התראות חדשות
    newNotifications.forEach((notification: NotificationData) => {
      if (toastRef.value && toastRef.value.showNotification) {
        toastRef.value.showNotification(notification)
      }
    })

    // עדכון זמן הבדיקה האחרונה
    if (newNotifications.length > 0) {
      lastCheckedTime.value = new Date()
    }
  } catch (error) {
    console.error('Error checking for new notifications:', error)
  }
}

// האזנה לאירוע קבלת/התעלמות מהתראה
const handleNotificationAction = async (event: Event) => {
  const customEvent = event as CustomEvent
  const { notification, action } = customEvent.detail

  if (action === 'accept') {
    // סימון כנקרא
    try {
      await markAsRead(notification._id)
      // שליחת אירוע לעדכון הפעמון
      window.dispatchEvent(new CustomEvent('notifications-updated'))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }
  // אם action === 'dismiss', לא עושים כלום - נשאר לא נקרא
}

onMounted(() => {
  userStore.initializeUser()

  // התחלת polling כל 30 שניות
  if (userStore.uid) {
    checkForNewNotifications()
  }

  pollingInterval = window.setInterval(() => {
    if (userStore.uid) {
      checkForNewNotifications()
    }
  }, 30000) // כל 30 שניות

  // האזנה לאירועים מהתראות קופצות
  window.addEventListener('notification-action', handleNotificationAction)
})

onBeforeUnmount(() => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
  }
  window.removeEventListener('notification-action', handleNotificationAction)
})
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: 'Courier New', Courier, monospace;
  background-color: #fff;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

/* 🔽 Layout ראשי */
.layout {
  display: grid;
  grid-template-columns: 1fr; /* סל צר + תוכן */
  flex: 1;
  min-height: calc(100vh - 160px); /* סך הכל פחות topbar + navbar + footer */
  overflow: hidden;
}

/* 🛒 צד שמאל - סל קבוע */
.cart-sidebar {
  background: #fffbe6;
  border-left: 1px solid #ddd;
  overflow-y: hidden;
  height: 100%;
  position: sticky;
  top: 160px; /* גובה TopBar + Navbar */
}

/* 🧺 תוכן ראשי */
.main-content {
  background: var(--bg-secondary);
  overflow-y: auto;
  padding: 1.5rem;
  width: 100%;
  min-height: calc(100vh - 250px);
  margin-top: 180px; /* TopBar (70px) + NavbarA (110px) = 180px */
}

/* 🔻 תחתית הדף */
.footer {
  background: var(--gradient-primary);
  padding: 2rem;
  text-align: center;
  font-size: 0.95rem;
  color: white;
  font-weight: 600;
  font-weight: 500;
  box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.05);
}

/* 📱 רספונסיביות */
@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .cart-sidebar {
    display: none;
  }

  .main-content {
    padding: 1rem;
    width: 100%;
  }
}
</style>
