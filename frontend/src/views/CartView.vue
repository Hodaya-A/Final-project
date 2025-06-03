<template>
  <div class="cart-view">
    <h1>סל הקניות שלי</h1>

    <div v-if="cartStore.items.length === 0" class="empty">
      הסל שלך ריק 🛒
    </div>

    <div v-else>
      <table>
        <thead>
          <tr>
            <th>מוצר</th>
            <th>כמות</th>
            <th>מחיר ליח'</th>
            <th>סה"כ</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cartStore.items" :key="item.id">
            <td>{{ item.name }}</td>
            <td>{{ item.quantity }}</td>
            <td>₪{{ item.price.toFixed(2) }}</td>
            <td>₪{{ (item.price * item.quantity).toFixed(2) }}</td>
            <td>
              <button @click="cartStore.increaseQuantity(item.id)">+</button>
              <button @click="cartStore.decreaseQuantity(item.id)">-</button>
              <button @click="cartStore.removeFromCart(item.id)">הסר</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="summary">
        סה"כ פריטים: <strong>{{ totalCount }}</strong> |
        לתשלום: <strong>₪{{ totalPrice.toFixed(2) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

const totalPrice = computed(() =>
  cartStore.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

const totalCount = computed(() =>
  cartStore.items.reduce((sum, item) => sum + item.quantity, 0)
)
</script>

<style scoped>
.cart-view {
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.empty {
  text-align: center;
  font-size: 1.2rem;
  padding: 2rem;
  color: #888;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

th, td {
  padding: 0.75rem;
  text-align: center;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f5f5f5;
  color: #444;
}

button {
  margin: 0 0.25rem;
  padding: 0.3rem 0.6rem;
  border: none;
  border-radius: 5px;
  background-color: #ff9800;
  color: white;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.95rem;
}

button:hover {
  background-color: #f57c00;
}

.summary {
  text-align: right;
  font-size: 1.1rem;
  font-weight: bold;
}
</style>
