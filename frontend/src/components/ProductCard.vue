<template>
  <div class="card">
    <h3>{{ product.name }}</h3>
    <p>מחיר: ₪{{ product.price }}</p>
    <p>פג תוקף: {{ formattedDate }}</p>
    <button @click="addToCart">הוסף לסל 🛒</button>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
const cartStore = useCartStore()

const props = defineProps<{
  product: {
    _id: string
    name: string
    price: number
    expiryDate: string
  }
}>()

const formattedDate = new Date(props.product.expiryDate).toLocaleDateString('he-IL')

function addToCart() {
  cartStore.addToCart({
    id: props.product._id,
    name: props.product.name,
    price: props.product.price
  })
}
</script>

<style scoped>
.card {
  border: 1px solid #d02525;
  border-radius: 8px;
  padding: 1rem;
  background-color: #df1c1c;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.card h3 {
  margin: 0 0 0.5rem;
}
button {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
button:hover {
  background-color: #45a049;
}
</style>
