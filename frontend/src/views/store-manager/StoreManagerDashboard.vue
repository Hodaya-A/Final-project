<template>
  <div class="store-manager-dashboard">
    <h1>לוח ניהול חנות</h1>

    <div class="actions">
      <button class="urgent" @click="goTo('/store/pending-orders')">הזמנות ממתינות לאישור</button>
      <button @click="goTo('/store/products')">ניהול מוצרים</button>
      <button @click="goTo('/store/reports')">דוחות אישיים</button>
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
  max-width: 800px;
  margin: auto;
  padding: 2rem;
  direction: rtl;
  text-align: center;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
}

.actions button {
  padding: 1rem;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 8px;
  background-color: #2c3e50;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.actions button:hover {
  background-color: #34495e;
}

.actions button.urgent {
  background-color: #e74c3c;
  font-weight: bold;
  box-shadow: 0 0 10px rgba(231, 76, 60, 0.5);
}

.actions button.urgent:hover {
  background-color: #c0392b;
  box-shadow: 0 0 15px rgba(231, 76, 60, 0.7);
}
</style>
