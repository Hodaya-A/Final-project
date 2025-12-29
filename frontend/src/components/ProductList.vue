<template>
  <div class="products-grid">
    <div v-for="product in products" :key="product._id" class="product-card">
      <img :src="product.imageUrl" alt="תמונה של המוצר" class="product-img" />
      <h3>{{ product.name }}</h3>
      <p>₪{{ product.price }}</p>
      <button @click="add(product)">הוסף לסל</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useCartStore } from '@/stores/cart'

// 🟢 הגדרת טיפוס למוצר
interface Product {
  _id: string
  name: string
  price: number
  imageUrl: string
}

const cartStore = useCartStore()
const products = ref<Product[]>([]) // מערך מוצרים עם טיפוס ברור

onMounted(async () => {
  try {
    const response = await axios.get<Product[]>('/api/products')
    products.value = response.data
  } catch (error) {
    console.error('❌ שגיאה בטעינת מוצרים:', error)
  }
})

// 🟢 פונקציה עם טיפוס מוצר
function add(product: Product) {
  cartStore.addToCart({
    id: product._id,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
  })
}
</script>

<style scoped>
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background-color: #f4f4f4;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
}

.product-img {
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin-bottom: 0.5rem;
}

button {
  background-color: #0066cc;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  margin-top: 0.5rem;
}

button:hover {
  background-color: #0050aa;
}
</style>
