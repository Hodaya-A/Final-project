<template>
  <div class="admin-dashboard" v-if="isAdmin">
    <div class="header">
      <h1>לוח בקרה ניהולי</h1>
      <p class="subtitle">ניהול ובקרה מרכזית של המערכת</p>
    </div>

    <div class="cards-grid">
      <div class="action-card earnings-card" @click="goToEarnings">
        <div class="card-content">
          <h3>רווחים והכנסות</h3>
          <p>צפייה בדוחות כספיים ורווחיות</p>
        </div>
      </div>

      <div class="action-card users-card" @click="goToUserManagement">
        <div class="card-content">
          <h3>ניהול משתמשים</h3>
          <p>ניהול הרשאות ומשתמשי המערכת</p>
        </div>
      </div>

      <div class="action-card danger-card" @click="deleteAllProducts">
        <div class="card-content">
          <h3>מחיקת מוצרים</h3>
          <p>מחיקה כוללת של כל המוצרים במערכת</p>
        </div>
      </div>
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

async function deleteAllProducts() {
  const confirmDelete = confirm('האם את בטוחה שברצונך למחוק את כל המוצרים? פעולה זו אינה הפיכה!')
  if (!confirmDelete) return

  try {
    await axios.delete('http://localhost:3000/api/products')
    alert('כל המוצרים נמחקו בהצלחה!')
  } catch (err) {
    console.error(err)
    alert('שגיאה במחיקת המוצרים')
  }
}

function goToUserManagement() {
  router.push('/admin/users')
}

function goToEarnings() {
  // ✅ Navigate to financial earnings dashboard
  router.push('/admin/earnings')
}
</script>

<style scoped>
.admin-dashboard {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 2rem;
  direction: rtl;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: #6b7280;
  font-size: 1.1rem;
  font-weight: 400;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.action-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-right: 4px solid transparent;
  position: relative;
  overflow: hidden;
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  transition: width 0.4s ease;
}

.action-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
}

.action-card:hover::before {
  width: 8px;
}

.earnings-card {
  background: linear-gradient(135deg, #ffffff 0%, #f3e8ff 100%);
}

.earnings-card::before {
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}

.earnings-card:hover {
  box-shadow: 0 12px 28px rgba(102, 126, 234, 0.25);
}

.users-card {
  background: linear-gradient(135deg, #ffffff 0%, #fce7f3 100%);
}

.users-card::before {
  background: linear-gradient(180deg, #f093fb 0%, #f5576c 100%);
}

.users-card:hover {
  box-shadow: 0 12px 28px rgba(240, 147, 251, 0.25);
}

.danger-card {
  background: linear-gradient(135deg, #ffffff 0%, #fff7ed 100%);
}

.danger-card::before {
  background: linear-gradient(180deg, #fb923c 0%, #f59e0b 100%);
}

.danger-card:hover {
  box-shadow: 0 12px 28px rgba(251, 146, 60, 0.25);
}

.card-content {
  text-align: right;
  position: relative;
  z-index: 1;
}

.card-content h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #1f2937;
  transition: color 0.3s;
}

.earnings-card:hover .card-content h3 {
  color: #667eea;
}

.users-card:hover .card-content h3 {
  color: #f093fb;
}

.danger-card:hover .card-content h3 {
  color: #fb923c;
}

.card-content p {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
}

.unauthorized {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  max-width: 600px;
  margin: 4rem auto;
}

.unauthorized h2 {
  color: #ef4444;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.unauthorized a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: color 0.3s;
}

.unauthorized a:hover {
  color: #764ba2;
  text-decoration: underline;
}
</style>
