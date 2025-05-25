<template>
  <div class="cart">
    <h2>🛒 סל הקניות שלי</h2>
    <p v-if="cartStore.items.length === 0">הסל שלך ריק.</p>
    <ul v-else>
      <li v-for="item in cartStore.items" :key="item.id" class="item">
        <div>
          {{ item.name }} – ₪{{ item.price }}
        </div>
        <button @click="remove(item.id)">הסר</button>
      </li>
    </ul>
    <div v-if="cartStore.items.length > 0" class="total">
      סה״כ: ₪{{ total }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
const cartStore = useCartStore()

function remove(id: string) {
  cartStore.removeFromCart(id)
}

const total = computed(() =>
  cartStore.items.reduce((sum, item) => sum + item.price, 0)
)
</script>

<style scoped>
.cart {
  padding: 2rem;
  max-width: 600px;
  margin: auto;
}
.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f4f4f4;
  padding: 1rem;
  border-radius: 8px;
  margin: 0.5rem 0;
}
button {
  background-color: #ff4d4d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}
button:hover {
  background-color: #e60000;
}
.total {
  margin-top: 1rem;
  font-weight: bold;
  text-align: center;
  font-size: 1.2rem;
}
</style>
