<template>
  <div class="store-manager-dashboard">
    <h1>לוח ניהול חנות</h1>

    <div class="actions">
      <button @click="goTo('/store/pending-orders')">הזמנות ממתינות לאישור</button>
      <button @click="goTo('/store/products')">ניהול מוצרים</button>
      <button @click="goTo('/store/reports')">דוחות אישיים</button>
      <button class="financial-btn" @click="goTo('/store/payouts')">ניהול כספים</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

function goTo(path: string) {
  router.push(path)
}

// אם לא מנהל חנות – ניתוב הביתה
if (userStore.role !== 'storeManager') {
  router.push('/')
}
</script>

<style scoped>
.store-manager-dashboard {
  max-width: 1200px;
  margin: auto;
  padding: 3rem 2rem;
  direction: rtl;
  text-align: center;
  background-color: #f9fafb;
  min-height: 100vh;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-top: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.actions button {
  padding: 1.5rem 2.5rem;
  font-size: 1.3rem;
  font-weight: 600;
  border-radius: 16px;
  background: white;
  color: #8b5cf6;
  border: 3px solid #8b5cf6;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
}

.actions button:hover {
  background: #f3e8ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .store-manager-dashboard {
    padding: 2rem 1rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  .actions {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: 100%;
  }

  .actions button {
    padding: 1.2rem 1.5rem;
    font-size: 1rem;
  }
}
</style>
