<template>
  <div class="homepage" @scroll.passive="onScroll" ref="scrollContainer">
    <div class="content">
      <!-- 🖼️ באנר -->
      <section class="main-banner">
        <img :src="bannerImg" alt="Fresh Banner" class="banner" />
      </section>

      <!-- ✅ כפתורי מנהל
      <section v-if="userStore.isAdmin" class="admin-section">
        <div class="admin-buttons">
          <button class="btn-report" @click="goTo('/admin')">ניהול מערכת</button>
        </div>
      </section> -->

      <!-- 🛒 מוצרים -->
      <section class="products-section">
        <h2>🛒 מבצעים טריים ב-Fresh End</h2>

        <div v-if="loading && products.length === 0" class="spinner">טוען מוצרים...</div>

        <div v-else-if="products.length > 0" class="products-grid">
          <ProductCard v-for="product in products" :key="product._id" :product="product" />
        </div>

        <p v-else class="empty-msg">לא נמצאו מוצרים זמינים</p>

        <div v-if="loading && products.length > 0" class="spinner">טוען עוד...</div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import ProductCard from '@/components/ProductCard.vue'
import api from '@/services/api'
import type { Product } from '@/stores/products'
import bannerImg from '@/assets/banner.png'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const searchTerm = ref<string>(route.query.search as string || '')

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

// ✅ מאזין לשינוי בפרמטר search ב-URL
watch(
  () => route.query.search,
  (newVal) => {
    searchTerm.value = newVal as string || ''
    fetchProducts(true)
  }
)

function goTo(path: string) {
  router.push(path)
}

async function fetchProducts(reset = false) {
  if (loading.value || (!hasMore.value && !reset)) return
  loading.value = true

  try {
    const page = reset ? 1 : currentPage.value
    const params: any = {
      _page: page,
      _limit: pageSize,
    }

    if (searchTerm.value.trim()) {
      params.q = searchTerm.value.trim()
    }

    const res = await api.get('/products', { params })
    const data = res.data

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

  if (scrollY + windowHeight >= fullHeight * 0.9) {
    fetchProducts()
  }
}
</script>

<style scoped>
.homepage {
  background: #f8f9fa;
  padding-bottom: 2rem;
  display: flex;
  justify-content: flex-start;
  width: 100%;
}

.homepage > .content {
  width: 100%;
  padding: 0 2rem;
}

.main-banner {
  text-align: center;
  margin: 2rem auto;
}

.main-banner img {
  width: 100%;
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

/* 🔧 עיצוב כפתורי אדמין */
.admin-section {
  background-color: #fff;
  padding: 1rem 2rem;
  border: 1px solid #ddd;
  border-radius: 10px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.admin-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.admin-buttons button {
  padding: 0.6rem 1.2rem;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
}

.btn-add {
  background-color: #28a745;
}

.btn-report {
  background-color: #ffc107;
  color: black;
}

.btn-users {
  background-color: #dc3545;
}
</style>
