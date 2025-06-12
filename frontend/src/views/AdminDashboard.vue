<template>
  <div class="admin-dashboard" v-if="isAdmin">
    <h1>📊 עמוד ניהול</h1>

    <div class="actions">
      <button @click="addProduct">➕ הוסף מוצר</button>
      <button @click="deleteExpiredProducts">🗑 מחק מוצרים שפג תוקפם</button>
      <button @click="deleteAllProducts">🗑️ מחק את כל המוצרים</button>
      <button @click="goToUserManagement">👥 ניהול משתמשים</button>
      <button @click="goToReports">📄הנפקת דוחות</button>
    </div>
  </div>

  <div v-else class="unauthorized">
    <h2>⛔ אין לך הרשאה לגשת לעמוד זה</h2>
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

function addProduct() {
  router.push('/admin/add-product')
}

function deleteExpiredProducts() {
  alert('🔧 פונקציה למחיקת מוצרים שפג תוקפם תתווסף בהמשך')
}
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

function generateReports() {
  alert('📄 דוחות עוד לא מוכנים')
}
</script>

<style scoped>
.admin-dashboard {
  max-width: 800px;
  margin: auto;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 12px;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

button {
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background-color: #2c3e50;
  color: white;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #34495e;
}

.unauthorized {
  text-align: center;
  padding: 4rem;
  color: red;
}
</style>
