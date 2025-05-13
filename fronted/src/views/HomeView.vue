<template>
  <div class="home">
    <h1>Welcome to Fresh End 🎉</h1>
    <ProductList />
  </div>
</template>

<script setup lang="ts">
import ProductList from '@/components/ProductList.vue'
</script>

<style scoped>
.home {
  padding: 2rem;
  text-align: center;
}
</style>
