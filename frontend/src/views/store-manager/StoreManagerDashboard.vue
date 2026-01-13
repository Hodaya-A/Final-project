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
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.actions button {
  padding: 2.5rem;
  font-size: 1.3rem;
  font-weight: 700;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f3e8ff 100%);
  color: #1f2937;
  border: none;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-right: 4px solid transparent;
  position: relative;
  overflow: hidden;
}

.actions button::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #a78bfa 0%, #8b5cf6 100%);
  transition: width 0.4s ease;
}

.actions button:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 28px rgba(139, 92, 246, 0.25);
  color: #667eea;
}

.actions button:hover::before {
  width: 8px;
}

.actions button.urgent {
  background: linear-gradient(135deg, #ffffff 0%, #fff7ed 100%);
}

.actions button.urgent::before {
  background: linear-gradient(180deg, #fb923c 0%, #f59e0b 100%);
}

.actions button.urgent:hover {
  box-shadow: 0 12px 28px rgba(251, 146, 60, 0.25);
  color: #fb923c;
}

.financial-btn {
  background: linear-gradient(135deg, #ffffff 0%, #f3e8ff 100%) !important;
}

.financial-btn::before {
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%) !important;
}

.financial-btn:hover {
  box-shadow: 0 12px 28px rgba(102, 126, 234, 0.25) !important;
  color: #667eea !important;
}
</style>
