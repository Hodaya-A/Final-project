<template>
  <div class="card">
    <h3>{{ product.name }}</h3>
    <p>מחיר: ₪{{ product.price }}</p>
    <p>פג תוקף: {{ formattedDate }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  product: {
    name: string
    price: number
    expiryDate: string
  }
}>()

const formattedDate = new Date(props.product.expiryDate).toLocaleDateString('he-IL')
</script>

<style scoped>
.card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 1rem;
  background-color: #f9f9f9;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card h3 {
  margin: 0 0 0.5rem;
}
</style>
