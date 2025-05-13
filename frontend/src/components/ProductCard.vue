<template>
  <div class="product-card">
    <h3 class="name">{{ product.name }}</h3>
    <p class="price">₪{{ product.price }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  product: {
    _id: string
    name: string
    price: number
  }
}>()
</script>

<style scoped>
.product-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  width: 200px;
  text-align: center;
  transition: box-shadow 0.2s;
  background-color: #f9f9f9;
}

.product-card:hover {
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
}

.name {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.price {
  color: #2c3e50;
  font-weight: bold;
}
</style>
