<template>
  <div class="homepage" @scroll.passive="onScroll" ref="scrollContainer">
    <!-- העמוד כולו נעטף במיכל שנדחף כאשר הסל פתוח -->
    <div class="page-wrapper" :class="{ 'cart-open': isCartOpen }">
      <div class="content">
        <!-- באנר -->
        <section class="main-banner">
          <img :src="bannerImg" alt="Fresh Banner" class="banner" />
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
import bannerImg from '@/assets/banner-pink.png'
import api from '@/services/api'
import type { Product } from '@/stores/products'

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
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
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
}

.main-banner img {
  width: 100%;
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
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
