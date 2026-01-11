<template>
  <div class="thank-you">
    <h1>תודה על ההזמנה! 🙏</h1>
    <p class="pending-msg">✅ ההזמנה שלך התקבלה בהצלחה!</p>
    <p class="approval-msg">📋 ההזמנה כעת ממתינה לאישור מנהל החנות.</p>
    <p class="email-msg">
      📧 לאחר אישור ההזמנה, תקבל מייל אישור בכתובת: <strong>{{ userStore.email }}</strong>
    </p>
    <p>תוכל לצפות בהזמנות הקודמות שלך בכל עת בלחיצה על "הזמנות קודמות" בסרגל העליון.</p>
    <router-link to="/" class="btn-home">חזרה לדף הבית</router-link>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
const userStore = useUserStore()
</script>

<style scoped>
.thank-you {
  max-width: 600px;
  margin: 2rem auto;
  background: #fff;
  padding: 2rem;
  text-align: center;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.pending-msg {
  font-size: 1.2rem;
  color: #27ae60;
  font-weight: bold;
  margin: 1rem 0;
}

.approval-msg {
  font-size: 1rem;
  color: #f39c12;
  margin: 1rem 0;
  padding: 1rem;
  background: #fef5e7;
  border-left: 4px solid #f39c12;
  border-radius: 4px;
}

.email-msg {
  font-size: 0.95rem;
  color: #555;
  margin: 1rem 0;
}

.btn-home {
  display: inline-block;
  margin-top: 2rem;
  padding: 0.6rem 1.2rem;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
}

.btn-home:hover {
  background-color: #0056b3;
}
</style>
