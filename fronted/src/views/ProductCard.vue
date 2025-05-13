<template>
  <div class="product-card">
    <h3>{{ product.name }}</h3>
    <p>₪{{ product.price }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ product: { _id: string; name: string; price: number } }>()
</script>
