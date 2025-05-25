<template>
  <div class="home">
    <SearchBar @search="handleSearch" />
    <div v-if="products.length > 0">
      <ProductList :products="products" />
    </div>
    <div v-else>
      <p>לא נמצאו מוצרים זמינים</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import SearchBar from '@/components/SearchBar.vue'
import ProductList from '@/components/ProductList.vue'
import api from '@/services/api'

const products = ref([])

onMounted(async () => {
  try {
    const res = await api.get('/products')
    console.log('🎯 מוצרים מהשרת:', res.data)
    products.value = res.data
  } catch (err) {
    console.error('שגיאה בטעינת מוצרים:', err)
  }
})

async function handleSearch(query: string) {
  try {
    const res = await api.get('/products', {
      params: { q: query }
    })
    products.value = res.data
  } catch (err) {
    console.error('שגיאה בביצוע חיפוש:', err)
  }
}
</script>

<style scoped>
.home {
  padding: 2rem;
}
</style>
