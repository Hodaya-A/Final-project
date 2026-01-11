<template>
  <div class="homepage" @scroll.passive="onScroll" ref="scrollContainer">
    <!-- העמוד כולו נעטף במיכל שנדחף כאשר הסל פתוח -->
    <div class="page-wrapper" :class="{ 'cart-open': isCartOpen }">
      <div class="content">
        <!-- באנר מתחלף -->
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
                @click="currentBannerIndex = index"
                :class="['dot', { active: currentBannerIndex === index }]"
                :aria-label="`עבור לבאנר ${index + 1}`"
              ></button>
            </div>
          </div>
        </section>

        <!-- מוצרים -->
        <section class="products-section">
          <h2>
            {{ activeCategory ? `מוצרים בקטגוריה: ${activeCategory}` : 'מבצעים טריים ב-Fresh End' }}
          </h2>

          <div v-if="loading && products.length === 0" class="spinner">טוען מוצרים...</div>

          <div v-else-if="products.length > 0" class="products-grid">
            <ProductCard v-for="product in products" :key="product._id" :product="product" />
          </div>

          <p v-else class="empty-msg">לא נמצאו מוצרים זמינים</p>

          <div v-if="loading && products.length > 0 && !activeCategory" class="spinner">
            טוען עוד...
          </div>
        </section>
      </div>
    </div>
  </div>

  <NotificationBubble />
</template>

<script setup lang="ts">
import NotificationBubble from '@/components/NotificationBubble.vue'
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'
import { storeToRefs } from 'pinia'
import ProductCard from '@/components/ProductCard.vue'
import banner1 from '@/assets/banner1.png'
import banner2 from '@/assets/banner2.png'
import banner3 from '@/assets/banner3.png'
import banner4 from '@/assets/banner4.png'
import api from '@/services/api'
import type { Product } from '@/stores/products'

// מערך תמונות באנר
const bannerImages = [banner1, banner2, banner3, banner4]
const currentBannerIndex = ref(0)
let bannerInterval: number | null = null

const cartStore = useCartStore()
const { isCartOpen } = storeToRefs(cartStore)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const router = useRouter()
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const userStore = useUserStore()

const route = useRoute()
const searchTerm = ref<string>((route.query.search as string) || '')
const minPrice = ref<number>(route.query.minPrice ? Number(route.query.minPrice) : 0)
const maxPrice = ref<number>(route.query.maxPrice ? Number(route.query.maxPrice) : 100)
const activeCategory = computed(() => (route.query.category as string) || '')

const products = ref<Product[]>([])
const currentPage = ref(1)
const pageSize = 12
const hasMore = ref(true)
const loading = ref(false)
const scrollContainer = ref<HTMLElement | null>(null)

onMounted(() => {
  fetchProducts(true)
  window.addEventListener('scroll', onScroll, { passive: true })

  // חילוף באנר אוטומטי כל 4 שניות
  bannerInterval = window.setInterval(() => {
    currentBannerIndex.value = (currentBannerIndex.value + 1) % bannerImages.length
  }, 4000)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (bannerInterval) {
    clearInterval(bannerInterval)
  }
})

watch(
  () => route.query.search,
  () => {
    searchTerm.value = (route.query.search as string) || ''
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

async function fetchProducts(reset = false) {
  if (loading.value || (!hasMore.value && !reset)) return
  loading.value = true

  try {
    const page = reset ? 1 : currentPage.value
    const params: Record<string, string | number> = {
      _page: page,
      _limit: pageSize,
    }

    if (searchTerm.value.trim()) params.q = searchTerm.value.trim()
    if (activeCategory.value) {
      params.category = activeCategory.value
      hasMore.value = false
    }
    if (minPrice.value > 0) params.minPrice = minPrice.value
    if (maxPrice.value < 100 && maxPrice.value > 0) params.maxPrice = maxPrice.value

    // שינוי עיקרי: במקום /products -> /inventory
    const res = await api.get('/inventory', { params })

    const data = res.data
    console.log('Products loaded:', data)

    if (reset) {
      products.value = data
      currentPage.value = 2
      hasMore.value = data.length === pageSize
    } else {
      products.value.push(...data)
      currentPage.value++
      hasMore.value = data.length === pageSize
    }
  } catch (err) {
    console.error('שגיאה בטעינת מוצרים:', err)
  } finally {
    loading.value = false
  }
}

function onScroll() {
  const scrollY = window.scrollY
  const windowHeight = window.innerHeight
  const fullHeight = document.documentElement.scrollHeight

  if (scrollY + windowHeight >= fullHeight * 0.9 && !activeCategory.value) {
    fetchProducts()
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  width: 100%;
}

/* מיכל שנדחף ימינה כשהסל פתוח */
.page-wrapper {
  transition: margin-right 0.3s ease;
}

.page-wrapper.cart-open {
  margin-right: 300px; /* רוחב הסל */
}

.homepage {
  background-color: var(--bg-secondary);
  padding-bottom: 2rem;
  display: flex;
  justify-content: flex-start;
  width: 100%;
  overflow-x: hidden;
}

.content {
  width: 100%;
  max-width: 100%;
  padding: 0 1rem;
  margin: 0 auto;
}

.main-banner {
  text-align: center;
  margin: 0.5rem auto 2rem;
  position: relative;
}

.banner-slider {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.main-banner img {
  width: 100%;
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
}

/* אנימציית מעבר */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* נקודות ניווט */
.banner-dots {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.dot:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(1.2);
}

.dot.active {
  background: #8b5cf6;
  border-color: #8b5cf6;
  transform: scale(1.3);
}

.products-section {
  padding-top: 1rem;
}

.products-section h2 {
  text-align: right;
  margin-bottom: 1rem;
  color: #1c75bc;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
  width: 100%;
  direction: rtl;
}

@media (max-width: 1300px) {
  .products-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1000px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
}

.empty-msg {
  text-align: center;
  color: #888;
  margin-top: 2rem;
  font-style: italic;
}

.spinner {
  text-align: center;
  color: #1c75bc;
  font-weight: bold;
  padding: 2rem;
}

/* עיצוב לכפתור "ניהול מלאי" */
.inventory-link {
  text-align: center;
  margin-top: 2rem;
}

.inventory-btn {
  color: #1c75bc;
  font-weight: bold;
  text-decoration: underline;
  font-size: 1.1rem;
}
</style>
