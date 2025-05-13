<template>
  <div class="product-list">
    <!-- מצב טעינה -->
    <p v-if="productStore.loading">Loading products...</p>

    <!-- שגיאה -->
    <p v-else-if="productStore.error" class="error">
      {{ productStore.error }}
    </p>

    <!-- רשימת מוצרים -->
    <div v-else class="products-grid">
      <ProductCard v-for="product in productStore.items" :key="product._id" :product="product" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import ProductCard from './ProductCard.vue'
import { useProductStore } from '@/stores/products'

const productStore = useProductStore()

onMounted(() => {
  productStore.fetchProducts()
})
</script>

<style scoped>
.product-list {
  padding: 2rem;
}

.error {
  color: red;
  font-weight: bold;
}

.products-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}
</style>
