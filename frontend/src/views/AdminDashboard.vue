<template>
  <div class="admin-dashboard" v-if="isAdmin">
    <h1>עמוד ניהול</h1>

    <div class="actions">
      <button @click="deleteAllProducts">מחק את כל המוצרים</button>
      <button @click="goToUserManagement">ניהול משתמשים</button>
      <button @click="goToReports">הנפקת דוחות</button>
      <button @click="goToInventory">ניהול מלאי</button>
    </div>
  </div>

  <div v-else class="unauthorized">
    <h2>אין לך הרשאה לגשת לעמוד זה</h2>
    <router-link to="/">חזרה לדף הבית</router-link>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import axios from 'axios'

const userStore = useUserStore()
const isAdmin = userStore.isAdmin
const router = useRouter()

function goToReports() {
  router.push('/admin/reports')
}

async function deleteAllProducts() {
  const confirmDelete = confirm('האם את בטוחה שברצונך למחוק את כל המוצרים? פעולה זו אינה הפיכה!')
  if (!confirmDelete) return

  try {
    await axios.delete('http://localhost:3000/api/products')
    alert('✅ כל המוצרים נמחקו בהצלחה!')
  } catch (err) {
    console.error(err)
    alert('❌ שגיאה במחיקת המוצרים')
  }
}

function goToUserManagement() {
  router.push('/admin/users')
}

function goToInventory() {
  // ✅ עדכון לפי האפשרות המומלצת — נתיב קיים ב-router שלך
  router.push('/shop/inventory')
}
</script>

<style scoped>
.admin-dashboard {
  max-width: 800px;
  margin: auto;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
  font-family: 'Courier New', Courier, monospace;
}

.admin-dashboard h1 {
  color: var(--primary);
  font-size: 2rem;
  margin-bottom: 2rem;
  font-weight: bold;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

button {
  padding: 1.2rem;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: var(--gradient-primary);
  color: white;
  transition: all 0.3s;
  font-family: 'Courier New', Courier, monospace;
  box-shadow: 0 3px 8px rgba(99, 102, 241, 0.25);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
}

.unauthorized {
  text-align: center;
  padding: 4rem;
  font-family: 'Courier New', Courier, monospace;
}

.unauthorized h2 {
  color: #e53e3e;
  margin-bottom: 1.5rem;
}

.unauthorized a {
  color: var(--primary);
  text-decoration: none;
  font-weight: bold;
  font-size: 1.1rem;
}

.unauthorized a:hover {
  text-decoration: underline;
}
</style>
