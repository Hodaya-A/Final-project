<template>
  <div class="store-products" v-if="isStoreManager">
    <h1>ניהול מוצרים לחנות שלך</h1>

    <form @submit.prevent="handleSubmit" class="product-form">
      <label>
        שם מוצר:
        <input v-model="name" required />
      </label>

      <label>
        מחיר מקורי:
        <input v-model.number="priceOriginal" type="number" required />
      </label>

      <label>
        מחיר לאחר הנחה:
        <input v-model.number="priceDiscounted" type="number" required />
      </label>

      <label>
        תאריך תפוגה:
        <input v-model="expiryDate" type="date" required />
      </label>

      <label>
        קטגוריה:
        <input v-model="category" required />
      </label>

      <label>
        כתובת תמונה:
        <input v-model="imageUrl" type="url" required />
      </label>

      <label>
        קואורדינטות מיקום:
        <input v-model.number="lat" placeholder="Latitude" required />
        <input v-model.number="lng" placeholder="Longitude" required />
      </label>

      <button type="submit">💾 שמור מוצר</button>
    </form>

    <h2>📃 המוצרים שלך</h2>
    <table v-if="products.length">
      <thead>
        <tr>
          <th>שם</th>
          <th>מחיר</th>
          <th>תפוגה</th>
          <th>פעולות</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product._id">
          <td>{{ product.name }}</td>
          <td>₪{{ product.priceDiscounted }}</td>
          <td>{{ formatDate(product.expiryDate) }}</td>
          <td>
            <button @click="fillForm(product)">✏️ ערוך</button>
            <button @click="deleteProduct(product._id)">🗑️ מחק</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const isStoreManager = computed(() => userStore.role === 'storeManager')
const sellerId = userStore.email

const name = ref('')
const priceOriginal = ref(0)
const priceDiscounted = ref(0)
const expiryDate = ref('')
const category = ref('')
const imageUrl = ref('')
const lat = ref(32.08)
const lng = ref(34.78)
const products = ref<any[]>([])
const editingId = ref<string | null>(null)

async function loadProducts() {
  const { data } = await axios.get(`/api/products?sellerId=${sellerId}`)
  products.value = data
}

onMounted(() => {
  if (isStoreManager.value) loadProducts()
})

async function handleSubmit() {
  const product = {
    name: name.value,
    priceOriginal: priceOriginal.value,
    priceDiscounted: priceDiscounted.value,
    expiryDate: expiryDate.value,
    category: category.value,
    imageUrl: imageUrl.value,
    location: {
      type: 'Point',
      coordinates: [lng.value, lat.value],
    },
    sellerId,
  }

  try {
    if (editingId.value) {
      await axios.put(`/api/products/${editingId.value}`, product)
    } else {
      await axios.post('/api/products', product)
    }
    clearForm()
    loadProducts()
  } catch (err) {
    alert('שגיאה בשמירה')
  }
}

function fillForm(p: any) {
  editingId.value = p._id
  name.value = p.name
  priceOriginal.value = p.priceOriginal
  priceDiscounted.value = p.priceDiscounted
  expiryDate.value = p.expiryDate.slice(0, 10)
  category.value = p.category
  imageUrl.value = p.imageUrl
  lat.value = p.location.coordinates[1]
  lng.value = p.location.coordinates[0]
}

function clearForm() {
  editingId.value = null
  name.value = ''
  priceOriginal.value = 0
  priceDiscounted.value = 0
  expiryDate.value = ''
  category.value = ''
  imageUrl.value = ''
  lat.value = 32.08
  lng.value = 34.78
}

async function deleteProduct(id: string) {
  if (confirm('האם למחוק מוצר זה?')) {
    await axios.delete(`/api/products/${id}`)
    loadProducts()
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('he-IL')
}
</script>

<style scoped>
.store-products {
  max-width: 800px;
  margin: auto;
  padding: 2rem;
  direction: rtl;
  text-align: right;
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  background: #f9f9f9;
  padding: 1rem;
  border-radius: 12px;
}

input {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}

button {
  padding: 0.6rem 1rem;
  font-weight: bold;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

button:hover {
  background-color: #1d2c3f;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #ddd;
  padding: 0.5rem;
}

th {
  background: #e9e9e9;
}
</style>
