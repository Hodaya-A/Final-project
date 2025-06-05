<template>
  <div class="product-details" v-if="product">
    <h1 class="title">{{ product.name }}</h1>
    <img :src="product.imageUrl" alt="תמונה" class="product-image" />

    <div class="info">
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
      <p><strong>📍 מיקום:</strong> Lat: {{ product.lat }}, Lng: {{ product.lng }}</p>
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
  lat: number
  lng: number
}>(null)

const formattedDate = ref('')

onMounted(async () => {
  const id = route.params.id
  const { data } = await axios.get(`http://localhost:3000/api/products/${id}`)
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
