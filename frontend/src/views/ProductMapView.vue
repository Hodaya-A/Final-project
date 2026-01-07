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
          placeholder=" הקלד כתובת למשל: תל אביב"
          class="location-box"
        />
        <button @click="geocodeLocation" class="location-btn">מצא כתובת</button>
      </div>

      <button @click="loadProducts" class="refresh-btn">רענן מוצרים</button>
      <p class="count">מוצרים שנמצאו בטווח: {{ productCount }}</p>

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
      <p v-if="!userLat || !userLng" class="warn">נא לאשר מיקום או להקליד כתובת</p>
    </div>

    <aside class="category-sidebar">
      <h3>קטגוריות</h3>
      <div v-for="(color, category) in categoryColors" :key="category" class="category-item">
        <input type="checkbox" :id="category" :value="category" v-model="selectedCategories" />
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
  'מוצרי חלב': '#1abc9c',
}
let map: L.Map
let productLayer: L.LayerGroup
let userCircle: L.Circle

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
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
  console.log('🔍 Loading products from /api/inventory...')
  const res = await axios.get('http://localhost:3000/api/inventory', {
    params: { _limit: 2000 },
  })
  const products: Product[] = Array.isArray(res.data) ? res.data : res.data.data || []
  console.log(`Total products loaded: ${products.length}`)
  console.log('Products with location:', products.filter((p) => p.location?.coordinates).length)

  if (productLayer) productLayer.clearLayers()
  if (userCircle) userCircle.remove()

  const userLocation: [number, number] = [userLat.value, userLng.value]
  userCircle = L.circle(userLocation, {
    radius: radiusInKm.value * 1000,
    color: '#6366f1',
    fillColor: '#6366f1',
    fillOpacity: 0.15,
    weight: 3,
  }).addTo(map)

  const filtered = products.filter((p) => {
    const matchName = p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchCategory =
      selectedCategories.value.length === 0 || selectedCategories.value.includes(p.category)
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
        fillOpacity: 0.8,
      })
        .bindPopup(
          `
          <div style="direction: rtl; text-align: right;">
            <strong>${p.name}</strong><br/>
            <span style="color: gray; text-decoration: line-through;">₪${p.priceOriginal}</span>
            <span style="color: green; font-weight: bold;"> ₪${p.priceDiscounted}</span><br/>
            <small>פג תוקף: ${new Date(p.expiryDate).toLocaleDateString('he-IL')}</small>
          </div>
        `,
        )
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
    attribution: '© OpenStreetMap',
  }).addTo(map)

  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat.value = pos.coords.latitude
        userLng.value = pos.coords.longitude
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
  gap: 1.5rem;
  background: var(--bg-secondary);
  font-family: 'Courier New', Courier, monospace;
  padding: 1.5rem;
}

.product-map-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.product-map-view h1 {
  color: var(--primary);
  font-size: 2rem;
  margin: 0 0 1rem 0;
  font-weight: bold;
  text-align: center;
}

.category-sidebar {
  width: 280px;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  height: fit-content;
  position: sticky;
  top: 1.5rem;
}

.category-sidebar h3 {
  color: var(--primary);
  font-size: 1.3rem;
  margin: 0 0 1.5rem 0;
  font-weight: bold;
  text-align: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--primary);
}

.category-item {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.category-item:hover {
  background: #f8f9fa;
}

.category-item input[type='checkbox'] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  margin-left: 0.75rem;
}

.category-item label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
}

.category-item .circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.top-inputs {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.search-box,
.location-box {
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  flex: 1;
  min-width: 200px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-box:focus,
.location-box:focus {
  outline: none;
  border-color: var(--primary);
}

.location-btn {
  background: var(--gradient-primary);
  box-shadow: 0 3px 8px rgba(99, 102, 241, 0.25);
  color: white;
  font-weight: bold;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  transition: all 0.3s;
}

.location-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
}

.refresh-btn {
  background: var(--gradient-primary);
  box-shadow: 0 3px 8px rgba(99, 102, 241, 0.25);
  color: white;
  font-weight: bold;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  font-family: 'Courier New', Courier, monospace;
  transition: all 0.3s;
  align-self: center;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
}

.count {
  font-weight: bold;
  text-align: center;
  color: var(--primary);
  font-size: 1.1rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.radius-slider {
  padding: 1.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.radius-slider label {
  font-weight: bold;
  color: #2d3748;
  font-size: 1.05rem;
  display: block;
  margin-bottom: 0.5rem;
}

.value {
  font-weight: bold;
  text-align: center;
  color: var(--primary);
  font-size: 1.3rem;
  margin-bottom: 1rem;
}

.map {
  height: 550px;
  border: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-radius: 16px;
  overflow: hidden;
}

.warn {
  text-align: center;
  color: #e53e3e;
  font-weight: bold;
  font-size: 1.1rem;
  background: #fee;
  padding: 1rem;
  border-radius: 12px;
  border: 2px solid #fcc;
}

/* סגנון לסליידר */
:deep(.vue-slider-rail) {
  background-color: #e0e0e0;
  border-radius: 15px;
}

:deep(.vue-slider-process) {
  background: var(--gradient-primary);
  border-radius: 15px;
}

:deep(.vue-slider-dot-handle) {
  background: var(--primary);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
  border: 3px solid white;
}

:deep(.vue-slider-dot-handle:hover) {
  box-shadow: 0 3px 12px rgba(99, 102, 241, 0.5);
}
</style>
