<template>
  <div class="thank-you">
    <h1>תודה על ההזמנה! 🙏</h1>
    <p>
      המייל עם פרטי ההזמנה נשלח אל: <strong>{{ userStore.email }}</strong>
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
