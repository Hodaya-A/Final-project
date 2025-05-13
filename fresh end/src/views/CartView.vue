<template>
  <div class="cart">
    <h2>🛒 My Cart</h2>
    <p v-if="cart.length === 0">Your cart is empty.</p>
    <ul v-else>
      <li v-for="item in cart" :key="item.id">
        {{ item.name }} – ₪{{ item.price }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// דוגמה לנתוני סל קניות
const cart = ref([
  { id: 1, name: 'Milk', price: 5 },
  { id: 2, name: 'Cheese', price: 10 },
])
</script>

<style scoped>
.cart {
  padding: 2rem;
  max-width: 600px;
  margin: auto;
}
</style>
