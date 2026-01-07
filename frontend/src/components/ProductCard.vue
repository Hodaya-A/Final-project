<template>
  <div class="product-card-wrapper">
    <div class="product-card" :class="{ 'expiring-soon': isExpiringSoon }">
      <!-- אזהרת תפוגה -->
      <div v-if="isExpiringSoon" class="expiry-warning">
        עומד לפוג בעוד {{ daysUntilExpiry }} ימים!
      </div>

      <!-- תמונה עם Fallback או כפתור העלאה -->
      <div class="image-container" @click="handleImageClick">
        <img
          v-if="imgSrc !== FALLBACK"
          :src="imgSrc"
          :alt="product.name"
          class="product-image"
          loading="lazy"
          @error="onImgError"
        />
        <div v-else class="upload-placeholder">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <p>לחץ להעלאת תמונה</p>
        </div>
        <input
          type="file"
          ref="fileInput"
          @change="handleFileUpload"
          accept="image/*"
          style="display: none"
        />
      </div>

      <!-- שם וקטגוריה -->
      <router-link :to="`/product/${product._id}`" class="product-link">
        <h3 class="product-name">{{ product.name }}</h3>
        <p class="product-category">{{ product.category }}</p>

        <!-- מחיר רגיל + מחיר מבצע -->
        <p class="product-price">
          <span v-if="product.salePrice" class="discounted">
            ₪{{ product.salePrice.toFixed(2) }}
          </span>
          <span :class="{ original: product.salePrice }"> ₪{{ product.price.toFixed(2) }} </span>
        </p>

        <!-- תאריך תפוגה -->
        <p class="product-expiry">פג תוקף: {{ formattedDate }}</p>
      </router-link>
    </div>

    <!-- 🛒 כפתור הוספה לסל -->
    <button class="add-btn" @click="addToCart">הוסף לסל</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/stores/products'
import axios from 'axios'

const cartStore = useCartStore()

const props = defineProps<{ product: Product }>()
const formattedDate = new Date(props.product.expiryDate || '').toLocaleDateString('he-IL')

const fileInput = ref<HTMLInputElement | null>(null)

// חישוב ימים עד תפוגה
const daysUntilExpiry = computed(() => {
  const today = new Date()
  const expiryDate = new Date(props.product.expiryDate || '')
  const diffTime = expiryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

// בדיקה אם המוצר עומד לפוג בעוד 3 ימים או פחות
const isExpiringSoon = computed(() => {
  return daysUntilExpiry.value <= 3 && daysUntilExpiry.value > 0
})

const FALLBACK = 'https://via.placeholder.com/300x300/e0e0e0/666666?text=No+Image'

const getDefaultImage = () => {
  console.log('Product:', props.product.name, 'ImageURL:', props.product.imageUrl)

  if (props.product.imageUrl && props.product.imageUrl.trim()) {
    const url = props.product.imageUrl.trim()

    // אם זה URL מלא (HTTP/HTTPS) - חשוב לבדוק קודם!
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('Using external URL:', url)
      return url
    }
    // אם זה נתיב מקומי
    if (url.startsWith('/uploads/')) {
      console.log('Using local path:', url)
      return url
    }
    // אם זה נתיב יחסי, נוסיף את הקידומת
    const fullPath = `/uploads/images/${url}`
    console.log('Using relative path:', fullPath)
    return fullPath
  }
  console.log('Using fallback image')
  return FALLBACK
}

const imgSrc = ref<string>(getDefaultImage())

function onImgError() {
  console.log('Image load error for:', imgSrc.value)
  if (imgSrc.value !== FALLBACK) {
    console.log('Switching to fallback image')
    imgSrc.value = FALLBACK
  }
}

function handleImageClick(e: Event) {
  if (imgSrc.value === FALLBACK) {
    e.preventDefault()
    e.stopPropagation()
    fileInput.value?.click()
  }
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  const formData = new FormData()
  formData.append('image', file)
  formData.append('productId', props.product._id)

  try {
    const response = await axios.post('/api/upload/product-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    if (response.data.success) {
      imgSrc.value = `${response.data.imageUrl}?t=${Date.now()}`
      alert('✅ התמונה הועלתה בהצלחה!')
    }
  } catch (error) {
    console.error('שגיאה בהעלאת תמונה:', error)
    alert('❌ שגיאה בהעלאת התמונה')
  }
}

function addToCart() {
  const imageUrl = props.product.imageUrl?.trim() || FALLBACK
  // אין צורך להוסיף localhost - ה-proxy מטפל בזה
  cartStore.addToCart({
    id: props.product._id,
    name: props.product.name,
    price: props.product.salePrice || props.product.price,
    imageUrl,
  })
}
</script>

<style scoped>
.product-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 240px;
}

.product-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  min-height: 360px;
  background: white;
  border: 2px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem;
  text-align: center;
  transition: all 0.3s ease;
  color: inherit;
  text-decoration: none;
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
}

.product-card.expiring-soon {
  border-color: #ff6b6b;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
}

.expiry-warning {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  color: white;
  padding: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  z-index: 10;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.85;
  }
}

.product-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity 0.3s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.product-card:hover::before {
  opacity: 1;
}

.image-container {
  width: 100%;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  margin-bottom: 1rem;
  margin-top: 2rem;
}

.product-card.expiring-soon .image-container {
  margin-top: 3rem;
}

.product-image {
  width: 100%;
  height: 150px;
  object-fit: contain;
  border-radius: 12px;
  background: var(--bg-secondary);
  padding: 0.5rem;
  transition: transform 0.2s ease;
}

.product-card:hover .product-image {
  transform: scale(1.03);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  transition: all 0.3s ease;
  color: #64748b;
}

.upload-placeholder:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  border-color: #94a3b8;
  color: #475569;
}

.upload-placeholder svg {
  margin-bottom: 0.5rem;
  opacity: 0.7;
}

.upload-placeholder p {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
}

.product-link {
  text-decoration: none;
  color: inherit;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--neutral-dark, #1f2937);
  margin: 0.5rem 0;
  line-height: 1.4;
}

.product-category {
  font-size: 0.875rem;
  color: var(--neutral, #6b7280);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.product-price {
  font-size: 1.1rem;
  margin: 0.75rem 0;
  font-weight: 700;
}

.product-price .original {
  text-decoration: line-through;
  color: var(--neutral-light, #9ca3af);
  margin-left: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
}

.product-price .discounted {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.4rem;
  font-weight: 800;
}

.product-expiry {
  font-size: 0.8rem;
  color: var(--neutral, #6b7280);
  margin-bottom: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary, #f9fafb);
  border-radius: 20px;
  display: inline-block;
}

.add-btn {
  margin-top: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
  box-shadow: var(--shadow);
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.add-btn:active {
  transform: translateY(0);
}
</style>
