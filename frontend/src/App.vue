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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import TopBar from '@/components/TopBar.vue'
import Navbar from '@/components/NavbarA.vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

onMounted(() => {
  userStore.initializeUser()
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
