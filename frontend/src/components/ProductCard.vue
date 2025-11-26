<template>
  <div class="product-card-wrapper">
    <router-link :to="`/product/${product._id}`" class="product-card">
      <!-- 🖼️ תמונה עם Fallback -->
      <img
        :src="imgSrc"
        :alt="product.name"
        class="product-image"
        loading="lazy"
        @error="onImgError"
      />

      <!-- 🏷️ שם וקטגוריה -->
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="product-category">{{ product.category }}</p>

      <!-- 💰 מחיר רגיל + מחיר מבצע -->
      <p class="product-price">
        <span v-if="product.salePrice" class="discounted">
          ₪{{ product.salePrice.toFixed(2) }}
        </span>
        <span :class="{ original: product.salePrice }"> ₪{{ product.price.toFixed(2) }} </span>
      </p>

      <!-- 🗓️ תאריך תפוגה -->
      <p class="product-expiry">פג תוקף: {{ formattedDate }}</p>
    </router-link>

    <!-- 🛒 כפתור הוספה לסל -->
    <button class="add-btn" @click="addToCart">הוסף לסל</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/stores/products'

const cartStore = useCartStore()

const props = defineProps<{ product: Product }>()
const formattedDate = new Date(props.product.expiryDate || '').toLocaleDateString('he-IL')

// ✅ אם אין imageUrl – נתחיל עם fallback; אם יש – נטען ואם יישבר, ניפול לפולבאק
const FALLBACK = '/img/no-image.png' // ודאי שקיים ב-public/img/no-image.png
const imgSrc = ref<string>(props.product.imageUrl || FALLBACK)

function onImgError() {
  imgSrc.value = FALLBACK
}

function addToCart() {
  cartStore.addToCart({
    id: props.product._id,
    name: props.product.name,
    price: props.product.salePrice || props.product.price,
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
  padding: 1rem;
  text-align: center;
  transition: transform 0.2s;
  color: inherit;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.product-card:hover {
  transform: translateY(-4px);
}
.product-image {
  width: 100%;
  height: 140px;
  object-fit: contain;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  background: #fff;
}
.product-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin: 0.3rem 0;
}
.product-category {
  font-size: 0.9rem;
  color: #193e28;
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
  color: #174028;
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
  background-color: #1e421f;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  cursor: pointer;
  width: 100%;
}
.add-btn:hover {
  background-color: #45a049;
}
</style>
