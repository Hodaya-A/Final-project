<template>
  <div class="search-bar">
    <input type="text" v-model="searchQuery" placeholder="חפש מוצר..." @keyup.enter="emitSearch" />
    <button @click="emitSearch">🔍</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const searchQuery = ref('')
const emit = defineEmits<{
  (e: 'search', value: string): void
}>()

function emitSearch() {
  emit('search', searchQuery.value)
}
</script>

<style scoped>
.search-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

input {
  width: 100%;
  max-width: 300px; /* כדי לא לעבור את הרוחב */
  padding: 0.5rem;
  font-size: 1rem;
  box-sizing: border-box;
}

button {
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
}

</style>
