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
      <input type="text" placeholder="חיפוש מוצר או מותג..." />
      <button class="search-btn">🔍</button>
    </div>

    <!-- התחברות + סל -->
    <div class="actions">
      <router-link to="/login" class="auth-btn">התחברות</router-link>
      <router-link to="/register" class="auth-btn">הצטרפות</router-link>

      <div class="cart-summary">
        🛒
        <span class="total">₪{{ totalPrice.toFixed(2) }}</span>
        <span class="count">{{ totalItems }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()
const { totalItems, totalPrice } = storeToRefs(cartStore)
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
  border-radius: 6px 0 0 6px;
  font-size: 1rem;
}

.search-btn {
  padding: 0.6rem 1rem;
  background-color: #007bff;
  border: none;
  border-radius: 0 6px 6px 0;
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
}

.cart-summary .count {
  background-color: red;
  color: white;
  font-size: 0.75rem;
  border-radius: 50%;
  padding: 2px 6px;
}
</style>
