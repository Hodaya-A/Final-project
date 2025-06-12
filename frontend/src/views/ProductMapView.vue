<template>
  <div class="product-map-container">
    <aside class="category-sidebar">
      <h3>🧭 קטגוריות</h3>
      <div v-for="(color, category) in categoryColors" :key="category" class="category-item">
        <input
          type="checkbox"
          :id="category"
          :value="category"
          v-model="selectedCategories"
        />
        <label :for="category">
          <span class="circle" :style="{ backgroundColor: color }"></span>
          {{ category }}
        </label>
      </div>
    </aside>

    <div class="product-map-view">
      <h1>🗺️ מוצרים בסביבה שלך</h1>

      <div class="top-inputs">
        <input
          v-model="searchQuery"
          @input="loadProducts"
          type="text"
          placeholder="🔍 חפש לפי שם מוצר..."
          class="search-box"
        />
        <input
          v-model="locationInput"
          placeholder="📍 הקלד כתובת למשל: תל אביב"
          class="location-box"
        />
        <button @click="geocodeLocation" class="location-btn">🔎 מצא כתובת</button>
      </div>

      <button @click="loadProducts" class="refresh-btn">🔄 רענן מוצרים</button>
      <p class="count">מוצרים שנמצאו בטווח: {{ productCount }}</p>

      <div class="radius-slider">
        <label>📏 טווח מרחק (בק"מ):</label>
        <div class="value">{{ radiusInKm }} ק"מ</div>
        <Slider
          v-model="radiusInKm"
          :min="1"
          :max="50"
          :step="1"
          :dot-size="20"
          :tooltip="true"
          @change="loadProducts"
        />
      </div>

      <div id="map" class="map"></div>
      <p v-if="!userLat || !userLng" class="warn">📍 נא לאשר מיקום או להקליד כתובת</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import L from 'leaflet'
import Slider from 'vue3-slider'
import { useRouter } from 'vue-router'

interface Product {
  _id: string
  name: string
  priceOriginal: number
  priceDiscounted: number
  expiryDate: string
  category: string
  imageUrl: string
  location?: {
    type: string
    coordinates: [number, number]
  }
}

const router = useRouter()

const userLat = ref<number | null>(null)
const userLng = ref<number | null>(null)
const radiusInKm = ref(10)
const searchQuery = ref('')
const locationInput = ref('')
const selectedCategories = ref<string[]>([])
const productCount = ref(0)

const categoryColors: Record<string, string> = {
  "לחם ומאפים טריים": "#d35400",
  "פארם ותינוקות": "#9b59b6",
  "חד פעמי ומטבח": "#2980b9",
  "אחזקת הבית ובע\"ח": "#7f8c8d",
  "חטיפים ומתוקים": "#c0392b",
  "קטניות ודגנים": "#f39c12",
  "שימורים ובישול": "#2ecc71",
  "קפואים": "#3498db",
  "אורגני ובריאות": "#27ae60",
  "משקאות": "#8e44ad",
  "בשר ודגים": "#e74c3c",
  "מוצרי חלב": "#1abc9c"
}
let map: L.Map
let productLayer: L.LayerGroup
let userCircle: L.Circle

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

async function geocodeLocation() {
  if (!locationInput.value) return
  const query = encodeURIComponent(locationInput.value)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`

  const res = await fetch(url)
  const data = await res.json()

  if (data.length > 0) {
    userLat.value = parseFloat(data[0].lat)
    userLng.value = parseFloat(data[0].lon)
    map.setView([userLat.value, userLng.value], 13)
    loadProducts()
  } else {
    alert('⚠️ מיקום לא נמצא')
  }
}

async function loadProducts() {
  if (!userLat.value || !userLng.value) return
  const res = await axios.get('http://localhost:3000/api/products')
  const products: Product[] = Array.isArray(res.data) ? res.data : res.data.data || []

  if (productLayer) productLayer.clearLayers()
  if (userCircle) userCircle.remove()

  const userLocation: [number, number] = [userLat.value, userLng.value]
  userCircle = L.circle(userLocation, {
    radius: radiusInKm.value * 1000,
    color: 'green'
  }).addTo(map)

  const filtered = products.filter(p => {
    const matchName = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory = selectedCategories.value.length === 0 || selectedCategories.value.includes(p.category)
    const notExpired = new Date(p.expiryDate) >= new Date()
    return matchName && matchCategory && notExpired
  })

  let count = 0
  for (const p of filtered) {
    const coords = p.location?.coordinates
    if (!coords || coords.length !== 2) continue
    const [lng, lat] = coords
    const dist = haversine(userLat.value, userLng.value, lat, lng)
    if (dist <= radiusInKm.value) {
      count++
      const color = categoryColors[p.category] || '#666'
      L.circleMarker([lat, lng], {
        radius: 8,
        color,
        fillColor: color,
        fillOpacity: 0.8
      })
        .bindPopup(`
          <div style="direction: rtl; text-align: right;">
            <strong>${p.name}</strong><br/>
            <span style="color: gray; text-decoration: line-through;">₪${p.priceOriginal}</span>
            <span style="color: green; font-weight: bold;"> ₪${p.priceDiscounted}</span><br/>
            <small>פג תוקף: ${new Date(p.expiryDate).toLocaleDateString('he-IL')}</small>
          </div>
        `)
        .on('click', () => router.push(`/product/${p._id}`))
        .addTo(productLayer)
    }
  }

  productCount.value = count
}

onMounted(() => {
  map = L.map('map').setView([32.08, 34.78], 13)
  productLayer = L.layerGroup().addTo(map)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map)

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition((pos) => {
      userLat.value = pos.coords.latitude
      userLng.value = pos.coords.longitude
      map.setView([userLat.value, userLng.value], 13)
      loadProducts()
    }, () => loadProducts())
  } else {
    loadProducts()
  }
})
</script>

<style scoped>
.product-map-container {
  display: flex;
  background: #eafaf1;
  font-family: sans-serif;
}

.category-sidebar {
  width: 230px;
  background-color: #d4f4dd;
  padding: 1rem;
background: linear-gradient(to bottom, #e6f9e4, #ffffff);
}

.category-item {
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
}

.category-item .circle {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-left: 0.5rem;
  display: inline-block;
}

.product-map-view {
  flex: 1;
  padding: 2rem;
}

.top-inputs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-box, .location-box {
  padding: 0.5rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  flex: 1;
  min-width: 200px;
}

.location-btn {
  background: #27ae60;
  color: white;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.refresh-btn {
  background-color: #2ecc71;
  color: white;
  font-weight: bold;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  margin: 1rem 0;
}

.refresh-btn:hover {
  background-color: #27ae60;
}

.count {
  font-weight: bold;
  margin-bottom: 1rem;
  text-align: center;
}

.radius-slider {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #dffce2;
  border-radius: 12px;
}

.value {
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5rem;
}

.map {
  height: 500px;
  margin-top: 1rem;
  border: 1px solid #ccc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

}

.warn {
  text-align: center;
  color: darkred;
  margin-top: 1rem;
}
</style>
