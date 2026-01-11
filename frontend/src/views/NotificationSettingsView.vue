<template>
  <div class="notification-settings">
    <div class="settings-header">
      <button @click="$router.back()" class="btn-back">← חזור</button>
      <h1>הגדרות התראות</h1>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>טוען הגדרות...</p>
    </div>

    <div v-else class="settings-content">
      <!-- הפעלת התראות -->
      <div class="settings-section">
        <div class="section-header">
          <h2>התראות</h2>
          <label class="toggle-switch">
            <input type="checkbox" v-model="preferences.enabled" />
            <span class="slider"></span>
          </label>
        </div>
        <p class="section-description">קבל התראות על מוצרים חדשים, מבצעים ועוד באזור שלך</p>
      </div>

      <!-- הגדרות מיקום -->
      <div class="settings-section" v-if="preferences.enabled">
        <h2>המיקום שלי</h2>
        <p class="section-description">הגדר את המיקום שלך כדי לקבל התראות על מוצרים קרובים</p>

        <div class="location-input">
          <input
            type="text"
            v-model="locationSearch"
            placeholder="הקלד כתובת ולחץ Enter או חפש..."
            @keydown.enter="searchLocation"
            class="input-field"
          />
          <button @click="searchLocation" class="btn-search" title="חפש כתובת">חפש</button>
          <button @click="getUserLocation" class="btn-location" title="שימוש במיקום הנוכחי">
            המיקום שלי
          </button>
        </div>

        <div v-if="preferences.location" class="current-location">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            width="20"
            height="20"
          >
            <path
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
            />
          </svg>
          <span>{{
            preferences.location.city || preferences.location.address || 'מיקום נבחר'
          }}</span>
        </div>
      </div>

      <!-- טווח חיפוש -->
      <div class="settings-section" v-if="preferences.enabled">
        <h2>טווח חיפוש</h2>
        <p class="section-description">
          עד כמה רחוק לחפש מוצרים? ({{ preferences.maxDistance / 1000 }} ק"מ)
        </p>

        <input
          type="range"
          v-model.number="preferences.maxDistance"
          min="1000"
          max="50000"
          step="1000"
          class="distance-slider"
        />
        <div class="distance-labels">
          <span>1 ק"מ</span>
          <span>25 ק"מ</span>
          <span>50 ק"מ</span>
        </div>
      </div>

      <!-- קטגוריות מועדפות -->
      <div class="settings-section" v-if="preferences.enabled">
        <h2>קטגוריות מועדפות</h2>
        <p class="section-description">בחר את הקטגוריות שמעניינות אותך</p>

        <div class="categories-grid">
          <label v-for="category in availableCategories" :key="category" class="category-checkbox">
            <input type="checkbox" :value="category" v-model="preferences.categories" />
            <span class="category-label">{{ category }}</span>
          </label>
        </div>
      </div>

      <!-- טווח מחירים -->
      <div class="settings-section" v-if="preferences.enabled">
        <h2>טווח מחירים</h2>
        <p class="section-description">קבל התראות רק על מוצרים בטווח המחירים הזה</p>

        <div class="price-inputs">
          <div class="input-group">
            <label>מחיר מינימלי</label>
            <input
              type="number"
              v-model.number="preferences.priceRange!.min"
              min="0"
              class="input-field"
              placeholder="0 ₪"
            />
          </div>
          <span class="separator">—</span>
          <div class="input-group">
            <label>מחיר מקסימלי</label>
            <input
              type="number"
              v-model.number="preferences.priceRange!.max"
              min="0"
              class="input-field"
              placeholder="ללא הגבלה"
            />
          </div>
        </div>
      </div>

      <!-- סוגי התראות -->
      <div class="settings-section" v-if="preferences.enabled">
        <h2>סוגי התראות</h2>
        <p class="section-description">בחר אילו סוגי התראות תרצה לקבל</p>

        <div class="notification-types">
          <label class="type-item">
            <input type="checkbox" v-model="preferences.onNewProducts" />
            <div class="type-content">
              <div>
                <h4>מוצרים חדשים</h4>
                <p>קבל התראה כשנוסף מוצר חדש באזור שלך</p>
              </div>
            </div>
          </label>

          <label class="type-item">
            <input type="checkbox" v-model="preferences.onDiscounts" />
            <div class="type-content">
              <div>
                <h4>מבצעים והנחות</h4>
                <p>קבל עדכונים על מבצעים מיוחדים</p>
              </div>
            </div>
          </label>

          <label class="type-item">
            <input type="checkbox" v-model="preferences.onExpiringSoon" />
            <div class="type-content">
              <div>
                <h4>מוצרים לפני פקיעה</h4>
                <p>התראות על מוצרים במחירים מוזלים לפני פקיעה</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- כפתורי פעולה -->
      <div class="actions">
        <button @click="savePreferences" class="btn-save" :disabled="saving">
          {{ saving ? 'שומר...' : 'שמור הגדרות' }}
        </button>
        <button @click="testNotifications" class="btn-test" :disabled="!preferences.enabled">
          בדוק מוצרים קרובים עכשיו
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from 'vue-toastification'
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
  checkNearbyProducts,
  type NotificationPreferences,
} from '@/services/notifications'

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()

const loading = ref(true)
const saving = ref(false)
const locationSearch = ref('')

const availableCategories = [
  'פירות וירקות',
  'מוצרי חלב',
  'בשר ועוף',
  'לחם ומאפים',
  'שימורים',
  'משקאות',
  'חטיפים',
  'קפואים',
  'תבלינים',
  'אחר',
]

const preferences = ref<NotificationPreferences>({
  enabled: true,
  maxDistance: 10000, // 10 ק"מ
  categories: [],
  priceRange: {
    min: 0,
    max: 1000,
  },
  onNewProducts: true,
  onDiscounts: true,
  onExpiringSoon: true,
})

const loadPreferences = async () => {
  if (!userStore.uid) {
    router.push('/auth')
    return
  }

  loading.value = true
  try {
    const saved = await loadNotificationPreferences(userStore.uid)
    if (saved) {
      preferences.value = { ...preferences.value, ...saved }
    }
  } catch (error) {
    console.error('Error loading preferences:', error)
  } finally {
    loading.value = false
  }
}

const savePreferences = async () => {
  if (!userStore.uid) return

  saving.value = true
  try {
    await saveNotificationPreferences(userStore.uid, preferences.value)
    toast.success('ההגדרות נשמרו בהצלחה! ')
  } catch (error) {
    console.error('Error saving preferences:', error)
    toast.error('שגיאה בשמירת ההגדרות')
  } finally {
    saving.value = false
  }
}

const getUserLocation = () => {
  if (!navigator.geolocation) {
    toast.error('הדפדפן שלך לא תומך במיקום גיאוגרפי')
    return
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      preferences.value.location = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        city: 'המיקום הנוכחי שלי',
      }
      toast.success('המיקום עודכן!')
    },
    (error) => {
      console.error('Error getting location:', error)
      toast.error('לא ניתן לקבל את המיקום שלך')
    },
  )
}

const searchLocation = async () => {
  const query = locationSearch.value.trim()
  if (!query) return

  try {
    toast.info('מחפש כתובת...')

    // קריאה לשרת במקום ישירות ל-Nominatim (כדי להימנע מ-CORS)
    const response = await fetch(
      `http://localhost:3000/api/geocode/search?q=${encodeURIComponent(query)}`,
    )

    if (!response.ok) {
      throw new Error('שגיאה בחיפוש הכתובת')
    }

    const data = await response.json()

    if (!data.found) {
      toast.error('לא נמצאה כתובת מתאימה')
      return
    }

    preferences.value.location = {
      lat: data.lat,
      lng: data.lng,
      city: data.city || query,
      address: data.address,
    }

    locationSearch.value = ''
    toast.success(`נמצא: ${data.address}`)
  } catch (error) {
    console.error('Error searching location:', error)
    toast.error('שגיאה בחיפוש הכתובת')
  }
}

const testNotifications = async () => {
  if (!userStore.uid || !preferences.value.location) {
    toast.error('נא להגדיר מיקום קודם')
    return
  }

  try {
    toast.info('מחפש מוצרים קרובים...')
    const result = await checkNearbyProducts(
      userStore.uid,
      {
        lat: preferences.value.location.lat,
        lng: preferences.value.location.lng,
      },
      preferences.value.maxDistance,
      preferences.value.categories,
    )

    if (result.foundProducts > 0) {
      toast.success(`נמצאו ${result.foundProducts} מוצרים קרובים! המוצרים יופיעו לך מיד על המסך`)
      // שליחת אירוע לעדכון מספר הפעמון
      window.dispatchEvent(new Event('notifications-updated'))
      // ניתוב לעמוד הבית
      router.push('/')
    } else {
      toast.info('לא נמצאו מוצרים חדשים באזור שלך כרגע')
    }
  } catch (error) {
    console.error('Error checking nearby products:', error)
    toast.error('שגיאה בחיפוש מוצרים')
  }
}

onMounted(() => {
  loadPreferences()
})
</script>

<style scoped>
.notification-settings {
  max-width: 900px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.btn-back {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #8b5cf6;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #ede9fe;
  border-color: #8b5cf6;
}

.settings-header h1 {
  font-size: 2rem;
  font-weight: bold;
  color: #8b5cf6;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 16px;
  padding: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.settings-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.section-description {
  color: #666;
  margin-bottom: 1.5rem;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #8b5cf6;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.location-input {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.input-field {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #8b5cf6;
}

.btn-location {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s;
  white-space: nowrap;
}

.btn-location:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-search {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s;
  white-space: nowrap;
}

.btn-search:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.current-location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f5f3ff;
  border-radius: 12px;
  color: #7c3aed;
  font-weight: 500;
}

.distance-slider {
  width: 100%;
  height: 8px;
  border-radius: 5px;
  background: linear-gradient(to right, #8b5cf6 0%, #7c3aed 100%);
  outline: none;
  margin: 1rem 0;
}

.distance-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 3px solid #8b5cf6;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.distance-labels {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.9rem;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.category-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f9f9f9;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-checkbox:hover {
  background: #f0f0f0;
  border-color: #8b5cf6;
}

.category-checkbox input:checked + .category-label {
  color: #8b5cf6;
  font-weight: 600;
}

.category-label {
  font-size: 1rem;
}

.price-inputs {
  display: flex;
  gap: 1rem;
  align-items: end;
}

.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-weight: 500;
  color: #666;
}

.separator {
  font-size: 1.5rem;
  color: #999;
  padding-bottom: 0.5rem;
}

.notification-types {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-item:hover {
  background: #f0f0f0;
  border-color: #8b5cf6;
}

.type-item input:checked ~ .type-content {
  opacity: 1;
}

.type-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.type-item input:checked ~ .type-content {
  opacity: 1;
}

.type-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.type-icon.new-product {
  background: #f5f3ff;
}

.type-icon.discount {
  background: #ede9fe;
}

.type-icon.expiring {
  background: #faf5ff;
}

.type-content h4 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.type-content p {
  margin: 0.25rem 0 0;
  font-size: 0.9rem;
  color: #666;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e0e0e0;
}

.btn-save,
.btn-test {
  padding: 1rem 2.5rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-test {
  background: white;
  color: #8b5cf6;
  border: 2px solid #8b5cf6;
}

.btn-test:hover:not(:disabled) {
  background: #f5f3ff;
}

.btn-test:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
