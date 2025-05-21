<template>
  <div class="product-list">
    <ProductCard
      v-for="product in products"
      :key="product.id"
      :product="product"
    />
  </div>
</template>

<script setup lang="ts">
import ProductCard from './ProductCard.vue'

defineProps<{
  products: Array<{
    id: number
    name: string
    price: number
    expiryDate: string
  }>
}>()
</script>

<style scoped>
.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}
</style>
