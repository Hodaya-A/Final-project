<template>
  <div class="product-map-container">
    <aside class="category-sidebar">
      <h3>קטגוריות</h3>
      <div v-for="(color, category) in categoryColors" :key="category" class="category-item">
        <input
          type="checkbox"
          :id="category"
          :value="category"
          v-model="selectedCategories"
          @change="loadProducts"
        />
        <label :for="category">
          <span class="circle" :style="{ backgroundColor: color }"></span>
          {{ category }}
        </label>
      </div>
    </aside>

    <div class="product-map-view">
      <h1>מוצרים בסביבה שלך</h1>

      <div class="top-inputs">
        <div class="search-group">
          <input
            v-model="searchQuery"
            @input="loadProducts"
            type="text"
            placeholder="חפש לפי שם מוצר..."
            class="custom-input"
          />
          <input
            v-model="locationInput"
            @keyup.enter="geocodeLocation"
            placeholder="הקלד כתובת למשל: הרצל 45, רמת גן"
            class="custom-input"
          />
          <button @click="geocodeLocation" class="purple-btn">מצא כתובת</button>
          <button @click="loadProducts" class="refresh-btn">רענן מוצרים</button>
        </div>
      </div>

      <div class="info-bar">
        <p class="count">
          מוצרים שנמצאו: <strong>{{ productCount }}</strong>
        </p>
        <div class="radius-control">
          <label
            >טווח מרחק: <strong>{{ radiusInKm }} ק"מ</strong></label
          >
          <Slider
            v-model="radiusInKm"
            :min="1"
            :max="50"
            :step="1"
            :dot-size="20"
            class="custom-slider"
            @change="loadProducts"
          />
        </div>
      </div>

      <div id="map" class="map"></div>
      <p v-if="!userLat || !userLng" class="warn-msg">נא לאשר מיקום או להקליד כתובת לסינון מדויק</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Slider from 'vue3-slider'
import { useRouter, useRoute } from 'vue-router'

interface Store {
  _id: string
  name: string
  address: string
  location: {
    type: string
    coordinates: [number, number]
  }
}

interface Product {
  _id: string
  name: string
  category: string
  location?: {
    type: string
    coordinates: [number, number]
  }
}

const router = useRouter()
const route = useRoute()
const userLat = ref<number | null>(null)
const userLng = ref<number | null>(null)
const radiusInKm = ref(15)
const searchQuery = ref('')
const locationInput = ref('')
const selectedCategories = ref<string[]>([])
const productCount = ref(0)

let map: L.Map
let productLayer: L.LayerGroup
let storeLayer: L.LayerGroup
let userCircle: L.Circle | null = null

const categoryColors: Record<string, string> = {
  'לחם ומאפים טריים': '#d35400',
  'פארם ותינוקות': '#9b59b6',
  'חד פעמי ומטבח': '#2980b9',
  'אחזקת הבית ובע"ח': '#7f8c8d',
  'חטיפים ומתוקים': '#c0392b',
  'קטניות ודגנים': '#f39c12',
  'שימורים ובישול': '#2ecc71',
  קפואים: '#3498db',
  'אורגני ובריאות': '#27ae60',
  משקאות: '#8e44ad',
  'בשר ודגים': '#e74c3c',
  'חלב, ביצים וסלטים': '#1abc9c',
}

const shopIcon = L.divIcon({
  html: `<div style="background-color: #6366f1; border: 2px solid white; border-radius: 50%; padding: 7px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>`,
  className: '',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
})

async function geocodeLocation() {
  if (!locationInput.value) return
  try {
    const { data } = await axios.get('/api/geocode', { params: { address: locationInput.value } })
    const result = Array.isArray(data) ? data[0] : data
    if (result && result.lat && result.lon) {
      userLat.value = parseFloat(result.lat)
      userLng.value = parseFloat(result.lon)
      map.setView([userLat.value, userLng.value], 13)
      await loadProducts()
    }
  } catch (err) {
    console.error('Geocode error:', err)
  }
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function getCloudPosition(lat: number, lng: number) {
  const maxRadius = 0.0006
  const r = maxRadius * Math.sqrt(Math.random())
  const theta = Math.random() * 2 * Math.PI
  return [lat + r * Math.cos(theta), lng + r * Math.sin(theta)]
}

async function loadProducts() {
  try {
    const [storesRes, invRes] = await Promise.all([
      axios.get('/api/stores'),
      axios.get('/api/inventory?_limit=1000'),
    ])

    const allStores: Store[] = Array.isArray(storesRes.data) ? storesRes.data : []
    const allInventoryItems: Product[] = Array.isArray(invRes.data) ? invRes.data : []

    if (productLayer) productLayer.clearLayers()
    if (storeLayer) storeLayer.clearLayers()
    if (userCircle) userCircle.remove()

    const targetProductId = route.query.select as string

    allStores.forEach((store) => {
      if (!store.location?.coordinates) return
      const [lng, lat] = store.location.coordinates
      L.marker([lat, lng], { icon: shopIcon, zIndexOffset: 2000 })
        .addTo(storeLayer)
        .bindTooltip(`<strong>${store.name}</strong><br/>📍 ${store.address}`, { sticky: true })
    })

    const filteredItems = allInventoryItems.filter((item) => {
      const isSelected = item._id === targetProductId
      const matchName = item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchCategory =
        selectedCategories.value.length === 0 || selectedCategories.value.includes(item.category)

      if (isSelected) return true
      if (!userLat.value || !userLng.value) return matchName && matchCategory
      if (!item.location) return false

      const [pLng, pLat] = item.location.coordinates
      const dist = haversine(userLat.value, userLng.value, pLat, pLng)
      return matchName && matchCategory && dist <= radiusInKm.value
    })

    productCount.value = filteredItems.length

    if (userLat.value && userLng.value) {
      userCircle = L.circle([userLat.value, userLng.value], {
        radius: radiusInKm.value * 1000,
        color: '#6366f1',
        fillOpacity: 0.05,
        weight: 1.5,
      }).addTo(map)
    }

    filteredItems.forEach((item) => {
      if (!item.location) return
      const [centerLng, centerLat] = item.location.coordinates
      const [finalLat, finalLng] = getCloudPosition(centerLat, centerLng)
      const color = categoryColors[item.category] || '#666'

      const marker = L.circleMarker([finalLat, finalLng], {
        radius: 9,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.9,
      }).addTo(productLayer)

      marker.bindPopup(`
        <div style="direction: rtl; text-align: right; font-family: sans-serif; min-width: 140px;">
          <strong style="font-size:1.1em;">${item.name}</strong><br/>
          <button id="btn-${item._id}"
            style="width: 100%; margin-top:10px; background: #6366f1; color: white; border: none; padding: 8px; border-radius: 8px; cursor: pointer; font-weight: bold;">
            לפרטים נוספים
          </button>
        </div>
      `)

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-${item._id}`)
        if (btn)
          btn.onclick = () => router.push({ name: 'product-details', params: { id: item._id } })
      })
    })

    // כאן הסרתי את ה-fitBounds האוטומטי כדי לשמור על המבט הכללי של המפה
  } catch (error) {
    console.error('Error loading map data:', error)
  }
}

onMounted(() => {
  window.scrollTo(0, 0)

  // שינוי המיקוד לכל ארץ ישראל (קו רוחב 31.5, קו אורך 34.8) וזום נמוך (7)
  map = L.map('map').setView([31.5, 34.8], 7.5)

  storeLayer = L.layerGroup().addTo(map)
  productLayer = L.layerGroup().addTo(map)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat.value = pos.coords.latitude
        userLng.value = pos.coords.longitude
        // כאשר המשתמש מאשר מיקום, אנחנו עוברים לזום קרוב יותר
        map.setView([userLat.value, userLng.value], 13)
        loadProducts()
      },
      () => loadProducts(),
    )
  } else {
    loadProducts()
  }
})
</script>

<style scoped>
.product-map-container {
  display: flex;
  flex-direction: row; /* קטגוריות מימין */
  gap: 2rem;
  background: #fcfcff;
  padding: 2rem;
  direction: rtl;
  min-height: 100vh;
}

.category-sidebar {
  width: 280px;
  background: white;
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.08);
  height: fit-content;
  position: sticky;
  top: 2rem;
}

.category-sidebar h3 {
  color: #4f46e5;
  font-size: 1.3rem;
  margin-bottom: 1.5rem;
  font-weight: 800;
  border-bottom: 3px solid #f0f2ff;
  padding-bottom: 0.5rem;
}

.category-item {
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 10px;
  transition: background 0.2s;
}

.category-item:hover {
  background: #f5f7ff;
}

.category-item input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin-left: 1rem;
  accent-color: #6366f1;
}

.category-item label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  font-size: 1rem;
  color: #444;
  font-weight: 500;
}

.category-item .circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.product-map-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.product-map-view h1 {
  color: #312e81;
  font-size: 2.4rem;
  margin-bottom: 0.5rem;
  font-weight: 900;
  text-align: right;
}

.top-inputs {
  background: white;
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.search-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.custom-input {
  flex: 1;
  min-width: 220px;
  padding: 0.8rem 1.2rem;
  border-radius: 12px;
  border: 2px solid #eef2ff;
  font-size: 1rem;
  outline: none;
  transition: 0.3s;
}

.custom-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.purple-btn {
  background: #6366f1;
  color: white;
  font-weight: bold;
  padding: 0.8rem 1.8rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: 0.3s;
}

.purple-btn:hover {
  background: #4f46e5;
  transform: translateY(-2px);
}

.refresh-btn {
  background: #eef2ff;
  color: #6366f1;
  font-weight: bold;
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: 0.3s;
}

.refresh-btn:hover {
  background: #e0e7ff;
}

.info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.count {
  font-size: 1.1rem;
  color: #555;
}

.count strong {
  color: #6366f1;
}

.radius-control {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 0.6;
}

.custom-slider {
  flex: 1;
}

.map {
  height: 500px;
  border-radius: 24px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
  z-index: 1;
  border: 4px solid white;
}

.warn-msg {
  text-align: center;
  color: #ef4444;
  background: #fef2f2;
  padding: 1rem;
  border-radius: 12px;
  font-weight: bold;
}

@media (max-width: 1024px) {
  .product-map-container {
    flex-direction: column-reverse;
    padding: 1rem;
  }
  .category-sidebar {
    width: 100%;
    position: static;
  }
}
</style>
