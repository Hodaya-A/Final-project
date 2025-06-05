<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const categories = [
  { name: 'לחם ומאפים טריים', icon: '🍞' },
  { name: 'פארם ותינוקות', icon: '🍼' },
  { name: 'חד פעמי ומטבח', icon: '🍽️' },
  { name: 'אחזקת הבית ובע"ח', icon: '🏠' },
  { name: 'חטיפים ומתוקים', icon: '🍬' },
  { name: 'קטניות ודגנים', icon: '🌾' },
  { name: 'שימורים ובישול', icon: '🥫' },
  { name: 'קפואים', icon: '❄️' },
  { name: 'אורגני ובריאות', icon: '🌿' },
  { name: 'משקאות', icon: '🥤' },
  { name: 'בשר ודגים', icon: '🥩' },
  { name: 'חלב, ביצים וסלטים', icon: '🥚' },
]

function toggleCategory(name: string) {
  router.push({ name: 'home', query: { category: name } })
}
</script>

<template>
  <nav class="navbar">
    <div class="category-bar">
      <div
        class="category-circle"
        v-for="cat in categories"
        :key="cat.name"
        @click="toggleCategory(cat.name)"
      >
        <div class="icon">{{ cat.icon }}</div>
        <div class="label">{{ cat.name }}</div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  direction: rtl;
  padding: 1rem;
  background-color: #f8fff8;
  border-radius: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
}
.category-bar {
  display: flex;
  overflow-x: auto;
  gap: 1rem;
  padding: 0.5rem 0;
}
.category-circle {
  min-width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #e9f9eb;
  border: 2px solid #108a2a;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  text-align: center;
  padding: 0.3rem;
}
.category-circle:hover {
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(16, 138, 42, 0.4);
  background-color: #d5f4da;
}
.icon {
  font-size: 1.5rem;
  margin-bottom: 0.3rem;
}
.label {
  font-size: 0.75rem;
  font-weight: bold;
  color: #0f571f;
}
</style>
