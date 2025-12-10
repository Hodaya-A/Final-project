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
import TopBar from '@/components/TopBar.vue'
import Navbar from '@/components/NavbarA.vue'
// import Cart from '@/components/CartA.vue'
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: Arial, sans-serif;
  background-color: #fff;
  width: 100vw;
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
  background-color: #f8f9fa;
  overflow-y: auto;
  padding: 2rem;
  width: 100%;
}

/* 🔻 תחתית הדף */
.footer {
  background-color: #f5f5f5;
  padding: 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: #666;
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
