<template>
  <header class="top-bar">
    <!-- לוגו -->
    <div class="logo">
      <router-link to="/" class="brand">
        <span class="blue">רמי</span><span class="red"> לוי באינטרנט</span>
      </router-link>
    </div>

    <!-- שדה חיפוש -->
    <div class="search-box">
      <input
        type="text"
        v-model="searchTerm"
        @keydown.enter="submitSearch"
        placeholder="חיפוש מוצר או מותג..."
      />
      <button class="search-btn" @click="submitSearch">🔍</button>
    </div>

    <!-- התחברות/התנתקות + סל -->
    <div class="actions">
      <template v-if="userStore.isLoggedIn">
        <router-link v-if="userStore.isAdmin" to="/admin" class="admin-btn">ניהול מערכת</router-link>
        <span class="user-email">שלום, {{ userStore.name || userStore.email }}</span>
        <router-link to="/orders" class="orders-btn">הזמנות קודמות</router-link>
        <button class="auth-btn" @click="logout">התנתקות</button>
      </template>
      <template v-else>
        <router-link to="/auth" class="auth-btn">התחברות / הצטרפות</router-link>
      </template>

      <!-- 🔗 כפתור לסל הקניות -->
      <router-link to="/cart" class="cart-summary">
        🛒
        <span class="total">₪{{ totalPrice.toFixed(2) }}</span>
        <span class="count">{{ totalItems }}</span>
      </router-link>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { signOut } from 'firebase/auth'
import { auth } from '@/services/firebase'

const cartStore = useCartStore()
const { totalItems, totalPrice } = storeToRefs(cartStore)

const userStore = useUserStore()
const router = useRouter()

const searchTerm = ref('')

const logout = async () => {
  await signOut(auth)
  userStore.logout()
  router.push('/')
}

const submitSearch = () => {
  if (searchTerm.value.trim() !== '') {
    router.push({ name: 'home', query: { search: searchTerm.value.trim() } })
  }
}
</script>


<style scoped>
.top-bar {
  direction: rtl;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  padding: 1rem 2rem;
  border-bottom: 1px solid #ddd;
  flex-wrap: wrap;
  gap: 1rem;
}

.logo .brand {
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
}

.blue {
  color: #007bff;
}
.red {
  color: #ff0000;
}

.search-box {
  flex: 1;
  display: flex;
  max-width: 500px;
}

.search-box input {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 1px solid #ccc;
  border-radius: 0 6px 6px 0;
  font-size: 1rem;
}

.search-btn {
  padding: 0.6rem 1rem;
  background-color: #007bff;
  border: none;
  border-radius: 6px 0 0 6px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
}

.actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.auth-btn {
  background: none;
  border: none;
  color: #007bff;
  font-size: 1rem;
  text-decoration: none;
  cursor: pointer;
}

.user-email {
  font-weight: bold;
  color: #333;
}

.cart-summary {
  position: relative;
  background-color: white;
  border: 1px solid #007bff;
  color: #007bff;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  text-decoration: none;
  font-weight: bold;
}

.cart-summary:hover {
  background-color: #e6f0ff;
}

.cart-summary .count {
  background-color: red;
  color: white;
  font-size: 0.75rem;
  border-radius: 50%;
  padding: 2px 6px;
}

.orders-btn {
  background: none;
  border: none;
  color: #28a745;
  font-size: 1rem;
  text-decoration: underline;
  cursor: pointer;
  font-weight: bold;
}

.orders-btn:hover {
  color: #218838;
}

</style>
