<template>
  <div class="homepage" @scroll.passive="onScroll" ref="scrollContainer">
    <div class="content">
      <section class="main-banner">
        <img :src="bannerImg" alt="Fresh Banner" class="banner" />
      </section>

      <section class="products-section">
        <h2>🛒 מבצעים טריים ב-Fresh End</h2>

        <div v-if="loading && products.length === 0" class="spinner">טוען מוצרים...</div>

        <div v-else-if="products.length > 0" class="products-grid">
          <ProductCard
            v-for="product in products"
            :key="product._id"
            :product="product"
          />
        </div>

        <p v-else class="empty-msg">לא נמצאו מוצרים זמינים</p>

        <div v-if="loading && products.length > 0" class="spinner">טוען עוד...</div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import ProductCard from '@/components/ProductCard.vue'
import api from '@/services/api'
import type { Product } from '@/stores/products'
import bannerImg from '@/assets/banner.png'

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

async function fetchProducts(reset = false) {
  if (loading.value || !hasMore.value) return
  loading.value = true

  try {
    const page = reset ? 1 : currentPage.value
    const res = await api.get('/products', {
      params: {
        _page: page,
        _limit: pageSize,
      },
    })

    const data = res.data

    if (reset) {
      products.value = data
      currentPage.value = 2
    } else {
      products.value.push(...data)
      currentPage.value++
    }

    hasMore.value = data.length === pageSize
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

  // כאשר המשתמש מגיע ל־90% מגובה העמוד, נטען מוצרים
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
  justify-content: flex-start; /* במקום center */
  width: 100%;
}

.homepage > .content {
  width: 100%;
  padding: 0 2rem;
  /* להסיר max-width לגמרי */
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

/* ✅ כותרת קטגוריה */
.products-section {
  padding-top: 1rem;
}

.products-section h2 {
  text-align: right;
  margin-bottom: 1rem;
  color: #1c75bc;
}

/* ✅ הצגת 5 מוצרים בשורה במסכים רגילים */
.products-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr); /* בדיוק 5 פריטים */
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
</style>
