<template>
  <div class="product-card">
    <h3 class="product-name">{{ product.name }}</h3>
    <p class="product-price">מחיר: ₪{{ product.price }}</p>
    <p class="product-expiry">פג תוקף: {{ formattedDate }}</p>
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
.product-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 220px;
  min-height: 280px;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1rem;
  transition: transform 0.2s;
  text-align: center;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.product-name {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

.product-price,
.product-expiry {
  font-size: 0.95rem;
  color: #555;
  margin: 0.3rem 0;
}

button {
  margin-top: auto;
  padding: 0.6rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #45a049;
}
</style>
