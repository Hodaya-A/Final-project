<template>
  <div class="add-product" v-if="isAdmin">
    <h1>➕ הוסף מוצר חדש</h1>
    <form @submit.prevent="handleSubmit">
      <label>
        שם מוצר:
        <input v-model="name" required />
      </label>

      <label>
        מחיר (₪):
        <input v-model.number="price" type="number" required />
      </label>

      <label>
        תאריך תפוגה:
        <input v-model="expiryDate" type="date" required />
      </label>

      <label>
        כתובת תמונה (URL):
        <input v-model="imageUrl" type="url" required />
      </label>

      <h3>🌍 בחר מיקום על גבי המפה:</h3>
      <div id="map" class="map"></div>
      <p v-if="lat && lng">🧭 מיקום נבחר: {{ lat.toFixed(5) }}, {{ lng.toFixed(5) }}</p>

      <button type="submit">💾 שמור</button>
    </form>

    <p v-if="successMessage" class="success">{{ successMessage }}</p>
  </div>

  <div v-else class="unauthorized">
    <h2>⛔ אין לך גישה לעמוד זה</h2>
    <router-link to="/">חזרה</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import axios from 'axios'
import L from 'leaflet'

const userStore = useUserStore()
const isAdmin = userStore.isAdmin
const router = useRouter()

const name = ref('')
const price = ref(0)
const expiryDate = ref('')
const imageUrl = ref('')
const successMessage = ref('')
const lat = ref<number | null>(null)
const lng = ref<number | null>(null)

let marker: L.Marker | null = null

onMounted(() => {
  const map = L.map('map').setView([32.08, 34.78], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map)

  map.on('click', (e: L.LeafletMouseEvent) => {
    lat.value = e.latlng.lat
    lng.value = e.latlng.lng

    if (marker) {
      marker.setLatLng(e.latlng)
    } else {
      marker = L.marker(e.latlng).addTo(map)
    }
  })
})

async function handleSubmit() {
  if (!lat.value || !lng.value) {
    alert('יש לבחור מיקום על המפה!')
    return
  }

  const product = {
    name: name.value,
    price: price.value,
    expiryDate: expiryDate.value,
    imageUrl: imageUrl.value,
    location: {
      type: 'Point',
      coordinates: [lng.value, lat.value]
    }
  }

  try {
    await axios.post('/api/products', product)
    successMessage.value = '✅ המוצר נשמר בהצלחה!'
    setTimeout(() => {
      router.push('/admin')
    }, 1500)
  } catch (err) {
    console.error(err)
    alert('אירעה שגיאה בשמירת המוצר')
  }
}
</script>

<style scoped>
.add-product {
  max-width: 500px;
  margin: auto;
  padding: 2rem;
  background-color: #f3f3f3;
  border-radius: 12px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  display: flex;
  flex-direction: column;
  font-weight: bold;
}

input {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}

button {
  padding: 0.8rem;
  font-weight: bold;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.success {
  color: green;
  margin-top: 1rem;
  text-align: center;
}

.unauthorized {
  text-align: center;
  padding: 4rem;
  color: red;
}

.map {
  height: 300px;
  border: 1px solid #ccc;
  margin: 1rem 0;
}
</style>
