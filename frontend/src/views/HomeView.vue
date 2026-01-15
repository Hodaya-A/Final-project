<template>
  <div class="homepage" ref="scrollContainer">
    <div class="page-wrapper" :class="{ 'cart-open': isCartOpen }">
      <div class="content">
        <section class="main-banner">
          <div class="banner-slider">
            <transition name="fade" mode="out-in">
              <img
                :key="currentBannerIndex"
                :src="bannerImages[currentBannerIndex]"
                alt="Fresh Banner"
                class="banner"
              />
            </transition>
            <div class="banner-dots">
              <button
                v-for="(img, index) in bannerImages"
                :key="index"
                @click.stop="setBanner(index)"
                :class="['dot', { active: currentBannerIndex === index }]"
                :aria-label="`עבור לבאנר ${index + 1}`"
              ></button>
            </div>
          </div>
        </section>

        <section class="products-section">
          <h2>
            {{ activeCategory ? `מוצרים בקטגוריה: ${activeCategory}` : 'מבצעים טריים ב-Fresh End' }}
          </h2>

          <div v-if="loading && products.length === 0" class="spinner">
            <div class="loader"></div>
            <p>טוען מוצרים טריים...</p>
          </div>

          <div v-else-if="products.length > 0" class="products-grid">
            <ProductCard v-for="product in products" :key="product._id" :product="product" />
          </div>

          <p v-else class="empty-msg">לא נמצאו מוצרים התואמים את החיפוש.</p>

          <div v-if="loading && products.length > 0" class="spinner-small">טוען עוד...</div>
        </section>
      </div>
    </div>
  </div>

  <NotificationBubble />
</template>

<script setup lang="ts">
import NotificationBubble from '@/components/NotificationBubble.vue'
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { storeToRefs } from 'pinia'
import ProductCard from '@/components/ProductCard.vue'
import api from '@/services/api'
import type { Product } from '@/stores/products'

// Assets
import banner1 from '@/assets/banner1.png'
import banner2 from '@/assets/banner2.png'
import banner3 from '@/assets/banner3.png'
import banner4 from '@/assets/banner4.png'

// --- State & Stores ---
const bannerImages = [banner1, banner2, banner3, banner4]
const currentBannerIndex = ref(0)
let bannerInterval: number | null = null

const cartStore = useCartStore()
const { isCartOpen } = storeToRefs(cartStore)

const route = useRoute()

// Filters
const searchTerm = ref<string>((route.query.search as string) || '')
const minPrice = ref<number>(route.query.minPrice ? Number(route.query.minPrice) : 0)
const maxPrice = ref<number>(route.query.maxPrice ? Number(route.query.maxPrice) : 100)
const activeCategory = computed(() => (route.query.category as string) || '')

// Data
const products = ref<Product[]>([])
const currentPage = ref(1)
const pageSize = 12
const hasMore = ref(true)
const loading = ref(false)

// --- Lifecycle ---

onMounted(() => {
  fetchProducts(true)
  window.addEventListener('scroll', handleScroll, { passive: true })
  startBannerInterval()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  stopBannerInterval()
})

// --- Watchers ---

watch(
  () => route.query.search,
  (newVal) => {
    searchTerm.value = (newVal as string) || ''
    fetchProducts(true)
  },
)

watch(
  () => [route.query.minPrice, route.query.maxPrice],
  () => {
    minPrice.value = route.query.minPrice ? Number(route.query.minPrice) : 0
    maxPrice.value = route.query.maxPrice ? Number(route.query.maxPrice) : 100
    fetchProducts(true)
  },
)

watch(
  () => route.query.category,
  () => {
    fetchProducts(true)
  },
)

// --- Logic ---

function startBannerInterval() {
  stopBannerInterval()
  bannerInterval = window.setInterval(() => {
    currentBannerIndex.value = (currentBannerIndex.value + 1) % bannerImages.length
  }, 7000)
}

function stopBannerInterval() {
  if (bannerInterval) {
    clearInterval(bannerInterval)
    bannerInterval = null
  }
}

function setBanner(index: number) {
  currentBannerIndex.value = index
  // מאפסים את הטיימר כדי שהבאנר לא יקפוץ מיד אחרי שהמשתמש לחץ
  startBannerInterval()
}

async function fetchProducts(reset = false) {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  loading.value = true

  try {
    const page = reset ? 1 : currentPage.value
    const params: Record<string, string | number> = {
      _page: page,
      _limit: pageSize,
    }

    if (searchTerm.value?.trim()) params.q = searchTerm.value.trim()

    if (activeCategory.value) {
      params.category = activeCategory.value
      // בקטגוריה ספציפית בדרך כלל אין פייג'יניישן מורכב, אבל תלוי בשרת
    }

    if (minPrice.value > 0) params.minPrice = minPrice.value
    if (maxPrice.value < 100 && maxPrice.value > 0) params.maxPrice = maxPrice.value

    const res = await api.get('/inventory', { params })
    const data = res.data

    // Defensive Coding: מוודאים שקיבלנו מערך
    if (!Array.isArray(data)) {
      console.error('Expected array from /inventory but got:', typeof data)
      loading.value = false
      return
    }

    if (reset) {
      products.value = data
      currentPage.value = 2
    } else {
      products.value.push(...data)
      currentPage.value++
    }

    // אם קיבלנו פחות תוצאות מהגודל המבוקש, סימן שאין עוד
    hasMore.value = data.length === pageSize
  } catch (err) {
    console.error('Error loading products:', err)
  } finally {
    loading.value = false
  }
}

// --- Scroll Handling (Throttled) ---

// פונקציית עזר לביצוע Throttle (מניעת הרצת יתר)
function throttle<T extends (...args: unknown[]) => void>(func: T, limit: number) {
  let inThrottle = false
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

const handleScroll = throttle(() => {
  const scrollY = window.scrollY
  const windowHeight = window.innerHeight
  const fullHeight = document.documentElement.scrollHeight

  // טוען כשמגיעים ל-80% מהגובה כדי ליצור חוויה חלקה יותר
  if (scrollY + windowHeight >= fullHeight * 0.8) {
    fetchProducts()
  }
}, 200) // בודק מקסימום 5 פעמים בשנייה
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.homepage {
  background-color: var(--bg-secondary);
  padding-bottom: 2rem;
  display: flex;
  justify-content: flex-start;
  width: 100%;
  min-height: 100vh;
}

.page-wrapper {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); /* אנימציה חלקה יותר */
  width: 100%;
  box-sizing: border-box;
}

.page-wrapper.cart-open {
  /* מזיז את התוכן הצידה ומקטין אותו */
  margin-left: 380px;
  width: calc(100% - 380px);
}

/* התאמה לרספונסיביות כשהסל פתוח - למנוע שבירה במובייל */
@media (max-width: 1024px) {
  .page-wrapper.cart-open {
    margin-left: 0;
    width: 100%;
    /* במובייל הסל כנראה יעלה על התוכן (Overlay) ולא ידחוף אותו */
  }
}

.content {
  width: 100%;
  max-width: 1600px; /* הגבלה שלא ימרח במסכים ענקיים */
  margin: 0 auto;
  padding: 0 1rem;
}

.main-banner {
  text-align: center;
  margin: 1rem auto 2rem;
  position: relative;
  width: 100%;
}

.banner-slider {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 35%; /* יחס גובה-רוחב רספונסיבי */
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.banner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Banner Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.banner-dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.2); /* רקע עדין לניגודיות */
  padding: 8px 12px;
  border-radius: 20px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.dot:hover {
  background: #fff;
  transform: scale(1.2);
}

.dot.active {
  background: #fff;
  transform: scale(1.4);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
}

.products-section {
  padding: 1rem 0;
}

.products-section h2 {
  text-align: right;
  margin-bottom: 2rem;
  font-size: 2rem;
  color: #2c3e50;
  font-weight: 800;
}

/* Grid System */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); /* גריד חכם אוטומטי */
  gap: 2rem;
  width: 100%;
  direction: rtl;
  padding-bottom: 2rem;
}

.empty-msg {
  text-align: center;
  color: #64748b;
  font-size: 1.2rem;
  margin-top: 4rem;
}

.spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #1c75bc;
}

.spinner-small {
  text-align: center;
  padding: 2rem;
  color: #64748b;
  font-weight: 500;
}

/* Simple CSS Loader */
.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1c75bc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
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
