<template>
  <div class="shop-settings-container">
    <div class="settings-header">
      <h1>הגדרות חנות</h1>
      <p>הגדר את מיקום החנות שלך כדי שהמוצרים יופיעו במפה הנכונה</p>
    </div>

    <div class="settings-content">
      <div class="form-section">
        <h2>מיקום החנות</h2>

        <div class="form-group">
          <label>שם החנות</label>
          <input v-model="shopName" type="text" placeholder="לדוגמה: סופר פארם תל אביב" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>עיר</label>
            <input v-model="city" type="text" placeholder="תל אביב" />
          </div>

          <div class="form-group">
            <label>רחוב</label>
            <input v-model="street" type="text" placeholder="דיזנגוף" />
          </div>

          <div class="form-group">
            <label>מספר</label>
            <input v-model="number" type="text" placeholder="50" />
          </div>
        </div>

        <button @click="geocodeAddress" class="btn-secondary">מצא כתובת במפה</button>

        <div class="coordinates-display">
          <p>📌 קואורדינטות: {{ coordinates[1].toFixed(4) }}, {{ coordinates[0].toFixed(4) }}</p>
        </div>
      </div>

      <div class="map-section">
        <h3>בחר מיקום על המפה</h3>
        <p class="hint">לחץ על המפה כדי לבחור את המיקום המדויק של החנות</p>
        <div id="shop-map" class="map"></div>
      </div>

      <button @click="saveLocation" class="btn-save" :disabled="saving">
        {{ saving ? 'שומר...' : 'שמור הגדרות' }}
      </button>

      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import axios from 'axios'

const shopName = ref('החנות שלי')
const city = ref('תל אביב')
const street = ref('')
const number = ref('')
const coordinates = ref([34.7818, 32.0853]) // [lng, lat]
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const saving = ref(false)

let map: L.Map
let marker: L.Marker

async function loadProfile() {
  try {
    const res = await axios.get('http://localhost:3000/api/importProfiles')
    const profile = res.data

    if (profile) {
      shopName.value = profile.shopName || 'החנות שלי'
      city.value = profile.shopAddress?.city || 'תל אביב'
      street.value = profile.shopAddress?.street || ''
      number.value = profile.shopAddress?.number || ''

      if (profile.shopLocation?.coordinates) {
        coordinates.value = profile.shopLocation.coordinates
        map.setView([coordinates.value[1], coordinates.value[0]], 15)
        updateMarker(coordinates.value[1], coordinates.value[0])
      }
    }
  } catch (err) {
    console.error('שגיאה בטעינת פרופיל:', err)
  }
}

async function geocodeAddress() {
  const address = `${street.value} ${number.value}, ${city.value}, Israel`
  const query = encodeURIComponent(address)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}`

  try {
    const res = await fetch(url)
    const data = await res.json()

    if (data.length > 0) {
      const lat = parseFloat(data[0].lat)
      const lng = parseFloat(data[0].lon)
      coordinates.value = [lng, lat]
      map.setView([lat, lng], 16)
      updateMarker(lat, lng)

      message.value = '✅ כתובת נמצאה בהצלחה!'
      messageType.value = 'success'
      setTimeout(() => (message.value = ''), 3000)
    } else {
      message.value = '❌ כתובת לא נמצאה, נסה להזין כתובת אחרת'
      messageType.value = 'error'
    }
  } catch (err) {
    console.error(err)
    message.value = '❌ שגיאה בחיפוש כתובת'
    messageType.value = 'error'
  }
}

function updateMarker(lat: number, lng: number) {
  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng], {
      draggable: true,
      icon: L.icon({
        iconUrl:
          'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    }).addTo(map)

    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      coordinates.value = [pos.lng, pos.lat]
    })
  }
}

async function saveLocation() {
  if (!shopName.value || !city.value) {
    message.value = '❌ נא למלא לפחות שם חנות ועיר'
    messageType.value = 'error'
    return
  }

  saving.value = true
  message.value = ''

  try {
    await axios.put('http://localhost:3000/api/importProfiles/location', {
      shopName: shopName.value,
      coordinates: coordinates.value,
      city: city.value,
      street: street.value,
      number: number.value,
    })

    message.value = '✅ מיקום החנות נשמר בהצלחה! כעת כל המוצרים שלך יופיעו במיקום הזה'
    messageType.value = 'success'
  } catch (err) {
    const error = err as { response?: { data?: { error?: string } }; message?: string }
    console.error(error)
    message.value =
      '❌ שגיאה בשמירת המיקום: ' +
      (error.response?.data?.error || error.message || 'שגיאה לא ידועה')
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  map = L.map('shop-map').setView([32.0853, 34.7818], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map)

  // קליק על המפה לבחירת מיקום
  map.on('click', (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    coordinates.value = [lng, lat]
    updateMarker(lat, lng)
  })

  // טעינת הפרופיל הקיים
  loadProfile()
})
</script>

<style scoped>
.shop-settings-container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
  direction: rtl;
}

.settings-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.settings-header h1 {
  font-size: 2rem;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.settings-header p {
  color: var(--neutral);
  font-size: 1rem;
}

.settings-content {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
}

.form-section h2 {
  font-size: 1.4rem;
  color: var(--neutral-dark);
  margin-bottom: 1.5rem;
  font-weight: 600;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: var(--neutral-dark);
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  gap: 1rem;
}

.btn-secondary {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 1rem;
  transition: all 0.3s ease;
  box-shadow: var(--shadow);
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.coordinates-display {
  margin-top: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%);
  border-radius: 8px;
  border: 2px solid var(--primary-light);
}

.coordinates-display p {
  margin: 0;
  color: var(--neutral-dark);
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.map-section {
  margin: 2rem 0;
}

.map-section h3 {
  font-size: 1.2rem;
  color: var(--neutral-dark);
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.hint {
  color: var(--neutral);
  font-size: 0.9rem;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8ecff 100%);
  border-right: 4px solid var(--primary);
  padding: 0.75rem 1rem;
  border-radius: 8px;
}

.map {
  height: 400px;
  border-radius: 12px;
  border: 2px solid var(--border);
  overflow: hidden;
  box-shadow: var(--shadow);
}

.btn-save {
  width: 100%;
  padding: 1rem;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 2rem;
  box-shadow: var(--shadow-lg);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: var(--shadow-xl);
}

.btn-save:disabled {
  background: var(--neutral-light);
  cursor: not-allowed;
  transform: none;
  box-shadow: var(--shadow-sm);
}

.message {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
}

.message.success {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  color: #155724;
  border: 2px solid var(--success);
  box-shadow: var(--shadow);
}

.message.error {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  color: #721c24;
  border: 2px solid var(--danger);
  box-shadow: var(--shadow);
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .settings-content {
    padding: 1.5rem;
  }

  .map {
    height: 300px;
  }
}
</style>
