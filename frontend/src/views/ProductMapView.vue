<template>
  <div class="product-map-container">
    <div class="product-map-view">
      <h1>מוצרים בסביבה שלך</h1>

      <div class="top-inputs">
        <input
          v-model="searchQuery"
          @input="loadProducts"
          type="text"
          placeholder=" חפש לפי שם מוצר..."
          class="search-box"
        />
        <input
          v-model="locationInput"
          @keyup.enter="geocodeLocation"
          placeholder=" הקלד כתובת למשל: הרצל 45, רמת גן"
          class="location-box"
        />
        <button @click="geocodeLocation" class="location-btn">מצא כתובת</button>
      </div>

      <button @click="loadProducts" class="refresh-btn">רענן מוצרים</button>
      <p class="count">מוצרים שנמצאו בטווח החיפוש: {{ productCount }}</p>

      <div class="radius-slider">
        <label> טווח מרחק (בק"מ):</label>
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
      <p v-if="!userLat || !userLng" class="warn">נא לאשר מיקום או להקליד כתובת לסינון לפי רדיוס</p>
    </div>

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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Slider from 'vue3-slider'
import { useRouter, useRoute } from 'vue-router'

// הגדרת מבנה חנות (Firebase)
interface Store {
  _id: string
  name: string
  address: string
  location: {
    type: string
    coordinates: [number, number]
  }
}

// הגדרת מבנה מוצר (MongoDB)
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
const radiusInKm = ref(10)
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

// הגדרת האייקון הסגול של החנות
const shopIcon = L.divIcon({
  html: `<div style="background-color: #4f46e5; border: 2px solid white; border-radius: 50%; padding: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </div>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
})

async function geocodeLocation() {
  if (!locationInput.value) return
  try {
    const { data } = await axios.get('/api/geocode', { params: { address: locationInput.value } })
    const result = Array.isArray(data) ? data[0] : data
    if (result && result.lat && result.lon) {
      userLat.value = parseFloat(result.lat)
      userLng.value = parseFloat(result.lon)
      map.setView([userLat.value, userLng.value], 16)
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
    // משיכת נתונים משולבת ממונגו ופיירבייס
    const [storesRes, invRes] = await Promise.all([
      axios.get('/api/stores'),
      axios.get('/api/inventory'),
    ])

    const allStores: Store[] = Array.isArray(storesRes.data) ? storesRes.data : []
    const allInventoryItems: Product[] = Array.isArray(invRes.data) ? invRes.data : []

    if (productLayer) productLayer.clearLayers()
    if (storeLayer) storeLayer.clearLayers()
    if (userCircle) userCircle.remove()

    const targetProductId = route.query.select as string

    // הצגת כל החנויות (האייקון הסגול)
    allStores.forEach((store) => {
      if (!store.location?.coordinates) return
      const [lng, lat] = store.location.coordinates
      L.marker([lat, lng], { icon: shopIcon, zIndexOffset: 2000 })
        .addTo(storeLayer)
        .bindTooltip(`<strong>${store.name}</strong><br/>📍 ${store.address}`, { sticky: true })
    })

    // סינון מוצרי המלאי
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
        fillOpacity: 0.1,
        weight: 1,
      }).addTo(map)
    }

    // ציור נקודות המוצרים (העיגולים הצבעוניים)
    filteredItems.forEach((item) => {
      if (!item.location) return
      const [centerLng, centerLat] = item.location.coordinates
      const [finalLat, finalLng] = getCloudPosition(centerLat, centerLng)
      const isSelected = item._id === targetProductId
      const color = categoryColors[item.category] || '#666'

      const marker = L.circleMarker([finalLat, finalLng], {
        radius: 10,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.9,
      }).addTo(productLayer)

      // בועת מידע ללא מחיר
      marker.bindPopup(`
        <div style="direction: rtl; text-align: right; font-family: sans-serif; min-width: 140px;">
          <strong style="font-size:1.1em;">${item.name}</strong><br/>
          <button id="btn-${item._id}"
            style="width: 100%; margin-top:10px; background: #6366f1; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-weight: bold;">
            לפרטים נוספים
          </button>
        </div>
      `)

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-${item._id}`)
        if (btn)
          btn.onclick = () => router.push({ name: 'product-details', params: { id: item._id } })
      })

      if (isSelected) {
        marker.bringToFront()
        setTimeout(() => marker.openPopup(), 600)
      }
    })

    if (!userLat.value && allStores.length > 0 && !targetProductId) {
      const group = L.featureGroup([
        ...storeLayer.getLayers(),
        ...productLayer.getLayers(),
      ] as L.Layer[])
      map.fitBounds(group.getBounds().pad(0.1))
    }
  } catch (error) {
    console.error('Error loading map data:', error)
  }
}

onMounted(() => {
  map = L.map('map').setView([32.08, 34.78], 13)
  storeLayer = L.layerGroup().addTo(map)
  productLayer = L.layerGroup().addTo(map)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

  const queryLat = route.query.lat
  const queryLng = route.query.lng

  if (queryLat && queryLng) {
    userLat.value = parseFloat(queryLat as string)
    userLng.value = parseFloat(queryLng as string)
    map.setView([userLat.value, userLng.value], 18)
    loadProducts()
  } else if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat.value = pos.coords.latitude
        userLng.value = pos.coords.longitude
        map.setView([userLat.value, userLng.value], 16)
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
  gap: 1.5rem;
  background: #f8f9fa;
  padding: 1.5rem;
  direction: rtl;
  min-height: 100vh;
}
.product-map-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.product-map-view h1 {
  color: #6366f1;
  font-size: 2.2rem;
  margin-bottom: 1rem;
  font-weight: 800;
  text-align: center;
}
.category-sidebar {
  width: 250px;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  height: fit-content;
  position: sticky;
  top: 1.5rem;
}
.category-sidebar h3 {
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  font-weight: bold;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.5rem;
}
.category-item {
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;
  padding: 0.4rem;
  border-radius: 8px;
  transition: background 0.2s;
}
.category-item:hover {
  background: #f0f4ff;
}
.category-item input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  margin-left: 0.75rem;
  accent-color: #6366f1;
}
.category-item label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: #555;
}
.category-item .circle {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.1);
}
.top-inputs {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  background: white;
  padding: 1rem;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
.search-box,
.location-box {
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid #ddd;
  flex: 1;
  min-width: 200px;
  font-size: 1rem;
}
.location-btn {
  background: #6366f1;
  color: white;
  font-weight: bold;
  padding: 0 1.5rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
}
.refresh-btn {
  background: #10b981;
  color: white;
  font-weight: bold;
  border: none;
  padding: 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  width: 200px;
  align-self: center;
}
.radius-slider {
  padding: 1rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}
.value {
  text-align: center;
  color: #6366f1;
  font-weight: bold;
  font-size: 1.2rem;
}
.map {
  height: 600px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 1;
}
.warn {
  text-align: center;
  color: #c0392b;
  background: #fadbd8;
  padding: 0.8rem;
  border-radius: 8px;
}
@media (max-width: 768px) {
  .product-map-container {
    flex-direction: column-reverse;
    padding: 1rem;
  }
  .category-sidebar {
    width: 100%;
    position: static;
  }
  .map {
    height: 400px;
  }
}
</style>
