<template>
  <div class="product-card-wrapper">

    <router-link :to="`/product/${product._id}`" class="product-card">
      <img :src="product.imageUrl" alt="תמונה" class="product-image" />
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="product-category">🧭 {{ product.category }}</p>
      <p>🔍 ID: {{ product._id }}</p>

      <p class="product-price">
        <span class="original">₪{{ product.priceOriginal }}</span>
        <span class="discounted">₪{{ product.priceDiscounted }}</span>
      </p>
      <p class="product-expiry">📆 פג תוקף: {{ formattedDate }}</p>
    </router-link>
    <button class="add-btn" @click="addToCart">הוסף לסל 🛒</button>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

const props = defineProps<{
  product: {
    _id: string
    name: string
    priceOriginal: number
    priceDiscounted: number
    expiryDate: string
    category: string
    imageUrl: string
  }
}>()

const formattedDate = new Date(props.product.expiryDate).toLocaleDateString('he-IL')

function addToCart() {
  cartStore.addToCart({
    id: props.product._id,
    name: props.product.name,
    price: props.product.priceDiscounted
  })
}
</script>

<style scoped>
.product-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 230px;
}

.product-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  min-height: 330px;
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 1rem;
  text-align: center;
  transition: transform 0.2s;
  color: inherit;
  text-decoration: none;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.product-image {
  width: 100%;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.product-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin: 0.3rem 0;
}

.product-category {
  font-size: 0.9rem;
  color: #27ae60;
  margin-bottom: 0.2rem;
}

.product-price {
  font-size: 1rem;
  margin: 0.3rem 0;
}

.product-price .original {
  text-decoration: line-through;
  color: #888;
  margin-left: 0.5rem;
}

.product-price .discounted {
  color: #2ecc71;
  font-weight: bold;
}

.product-expiry {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.add-btn {
  margin-top: 0.5rem;
  padding: 0.6rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: 100%;
}

.add-btn:hover {
  background-color: #45a049;
}
</style>
