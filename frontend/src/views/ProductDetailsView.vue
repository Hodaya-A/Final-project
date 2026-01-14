<template>
  <div class="page-wrapper" v-if="product">
    <div class="top-nav">
      <button @click="$router.back()" class="btn-back">חזרה לתפריט</button>
    </div>

    <div class="product-card">
      <div class="product-image-section">
        <img :src="product.imageUrl" :alt="product.name" @error="handleImageError" />
        <div v-if="discountPercent > 0" class="badge-discount">{{ discountPercent }}% הנחה</div>
      </div>

      <div class="product-info-section">
        <div class="info-header">
          <span class="category-tag">{{ product.category || 'כללי' }}</span>
          <h1 class="product-name">{{ product.name }}</h1>
          <p class="brand-name" v-if="product.brand">{{ product.brand }}</p>
        </div>

        <div class="price-display">
          <div class="price-row main-price">
            <span class="price-label">מחיר מבצע:</span>
            <span class="price-value">₪{{ displayDiscountedPrice }}</span>
          </div>
          <div class="price-row-original" v-if="hasDiscount">
            <span class="price-label">מחיר רגיל:</span>
            <span class="price-old">₪{{ displayOriginalPrice }}</span>
          </div>
        </div>

        <div class="store-details">
          <div class="detail-item">
            <div class="detail-content">
              <span class="detail-label">חנות:</span>
              <span class="detail-text">{{ product.shopName || 'חנות מקומית' }}</span>
            </div>
          </div>

          <div class="detail-item">
            <div class="detail-content">
              <span class="detail-label">כתובת:</span>
              <span class="detail-text">
                {{ product.shopAddress || 'כתובת לא צוינה'
                }}{{ product.shopCity ? ', ' + product.shopCity : '' }}
              </span>
            </div>
          </div>

          <div class="detail-item" :class="{ 'soon-expired': isSoonExpiring }">
            <div class="detail-content">
              <span class="detail-label">בתוקף עד:</span>
              <span class="detail-text">{{ formattedDate }}</span>
            </div>
          </div>
        </div>

        <div class="product-description" v-if="product.description">
          <h3 class="desc-title">תיאור המוצר</h3>
          <p>{{ product.description }}</p>
        </div>

        <div class="action-buttons">
          <button @click="handleAddToCart" class="btn-add-to-cart">הוספה לסל הקניות</button>
          <button @click="viewOnMap" class="btn-view-map">הצג מיקום במפה</button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="loading-state">
    <div class="spinner"></div>
    <p>טוען את פרטי המוצר עבורך...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useCartStore } from '@/stores/cart'

interface ProductData {
  _id: string
  name: string
  brand?: string
  imageUrl: string
  category: string
  priceOriginal?: number
  priceDiscounted?: number
  price?: number
  salePrice?: number
  expiryDate: string
  description?: string
  shopName?: string
  shopAddress?: string
  shopCity?: string
  location?: {
    type: string
    coordinates: [number, number]
  }
}

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const product = ref<ProductData | null>(null)

const displayOriginalPrice = computed(
  () => product.value?.priceOriginal || product.value?.price || 0,
)
const displayDiscountedPrice = computed(
  () => product.value?.priceDiscounted || product.value?.salePrice || product.value?.price || 0,
)
const hasDiscount = computed(() => displayDiscountedPrice.value < displayOriginalPrice.value)

const discountPercent = computed(() => {
  if (!hasDiscount.value) return 0
  const original = displayOriginalPrice.value
  const discounted = displayDiscountedPrice.value
  return Math.round(((original - discounted) / original) * 100)
})

const formattedDate = computed(() => {
  if (!product.value?.expiryDate) return 'לא צוין'
  return new Date(product.value.expiryDate).toLocaleDateString('he-IL')
})

const isSoonExpiring = computed(() => {
  if (!product.value?.expiryDate) return false
  const diffTime = new Date(product.value.expiryDate).getTime() - new Date().getTime()
  return diffTime < 3 * 24 * 60 * 60 * 1000
})

onMounted(async () => {
  const id = route.params.id
  try {
    const { data } = await axios.get(`http://localhost:3000/api/inventory/${id}`)
    product.value = data
  } catch (err) {
    console.error('שגיאה בטעינת המוצר:', err)
  }
})

const handleAddToCart = () => {
  if (product.value) {
    cartStore.addToCart({
      id: product.value._id, // שימוש ב-id ללא קו תחתון להתאמה ל-Store
      name: product.value.name,
      price: displayDiscountedPrice.value,
      imageUrl: product.value.imageUrl,
      quantity: 1,
    })
    alert('המוצר נוסף לסל הקניות!')
  }
}

const viewOnMap = () => {
  if (product.value?.location?.coordinates) {
    const [lng, lat] = product.value.location.coordinates
    router.push({
      path: '/map',
      query: {
        lat: lat.toString(),
        lng: lng.toString(),
        zoom: '18',
        select: product.value._id, // הוספת הפרמטר שיפעיל את פתיחת הבועה אוטומטית במפה
      },
    })
  } else {
    router.push('/map')
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = 'https://via.placeholder.com/400x400?text=תמונה+לא+נמצאה'
}
</script>

<style scoped>
.page-wrapper {
  max-width: 1200px;
  margin: 40px auto;
  padding: 0 20px;
  direction: rtl;
  font-family: 'Segoe UI', sans-serif;
}
.top-nav {
  margin-bottom: 25px;
}
.btn-back {
  background: #f1f5f9;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 700;
}
.product-card {
  display: flex;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  min-height: 600px;
}
.product-image-section {
  flex: 1;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  max-width: 50%;
}
.product-image-section img {
  max-width: 100%;
  max-height: 480px;
  object-fit: contain;
}
.badge-discount {
  position: absolute;
  top: 25px;
  right: 25px;
  background: #ef4444;
  color: #fff;
  padding: 8px 16px;
  border-radius: 12px;
  font-weight: 900;
}
.product-info-section {
  flex: 1;
  padding: 50px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 50%;
}
.product-name {
  font-size: 2.8rem;
  color: #111827;
  margin: 0;
  font-weight: 800;
}
.price-display {
  background: #f0fdf4;
  padding: 25px;
  border-radius: 20px;
  border: 1px solid #dcfce7;
}
.price-value {
  font-size: 3rem;
  font-weight: 900;
  color: #16a34a;
}
.price-old {
  text-decoration: line-through;
  color: #9ca3af;
  font-size: 1.5rem;
}
.action-buttons {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.btn-add-to-cart {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 18px;
  border-radius: 16px;
  font-size: 1.3rem;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s;
}
.btn-add-to-cart:hover {
  background: #3730a3;
}
.btn-view-map {
  background: white;
  color: #4f46e5;
  border: 2.5px solid #4f46e5;
  padding: 14px;
  border-radius: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s;
}
.btn-view-map:hover {
  background: #f8fafc;
}
@media (max-width: 1000px) {
  .product-card {
    flex-direction: column;
  }
  .product-image-section,
  .product-info-section {
    max-width: 100%;
    padding: 30px;
  }
}
.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f4f6;
  border-top: 5px solid #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
