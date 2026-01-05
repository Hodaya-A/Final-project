<template>
  <div class="product-details" v-if="product">
    <h1 class="title">{{ product.name }}</h1>
    <img :src="product.imageUrl" alt="תמונה" class="product-image" />

    <div class="info">
      <p v-if="product.description" class="description">
        <strong>📝 תיאור מפורט:</strong><br />
        {{ product.description }}
      </p>
      <p v-else class="no-description"><strong>📝 תיאור:</strong> אין תיאור זמין למוצר זה</p>
      <p><strong>🧭 קטגוריה:</strong> {{ product.category }}</p>
      <p>
        <strong>💰 מחיר רגיל:</strong>
        <span class="price-original">₪{{ product.priceOriginal }}</span>
      </p>
      <p>
        <strong>🔥 מחיר מבצע:</strong>
        <span class="price-discounted">₪{{ product.priceDiscounted }}</span>
      </p>
      <p><strong>📆 פג תוקף:</strong> {{ formattedDate }}</p>
      <p v-if="product.shopName"><strong>🏪 חנות:</strong> {{ product.shopName }}</p>
      <p v-if="product.shopAddress || product.shopCity">
        <strong>📍 כתובת:</strong>
        {{ product.shopAddress }}
        <span v-if="product.shopCity">, {{ product.shopCity }}</span>
      </p>
    </div>
  </div>

  <div v-else class="loading">טוען מוצר...</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const product = ref<null | {
  name: string
  imageUrl: string
  category: string
  priceOriginal: number
  priceDiscounted: number
  expiryDate: string
  description?: string
  shopName?: string
  shopAddress?: string
  shopCity?: string
  place?: {
    city?: string
    address?: string
  }
}>(null)

const formattedDate = ref('')

onMounted(async () => {
  const id = route.params.id
  console.log('🔍 Fetching product with ID:', id)
  const { data } = await axios.get(`http://localhost:3000/api/inventory/${id}`)
  console.log('📦 Product data received:', data)
  console.log('📝 Description:', data.description)
  console.log('🏪 Shop name:', data.shopName)
  console.log('📍 Shop address:', data.shopAddress)
  product.value = data
  formattedDate.value = new Date(data.expiryDate).toLocaleDateString('he-IL')
})
</script>

<style scoped>
.product-details {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: #fefefe;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 1rem;
}

.product-image {
  width: 100%;
  max-height: 300px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 1.2rem;
}

.info p {
  font-size: 1.1rem;
  margin: 0.5rem 0;
}

.description {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border-right: 4px solid #7c3aed;
  margin-bottom: 1.5rem;
  line-height: 1.6;
  font-size: 1rem;
}

.price-original {
  text-decoration: line-through;
  color: #888;
  margin-left: 5px;
}

.price-discounted {
  color: #2ecc71;
  font-weight: bold;
}

.loading {
  text-align: center;
  font-size: 1.3rem;
  padding: 2rem;
}
</style>
