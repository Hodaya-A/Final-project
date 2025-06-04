<template>
  <nav class="navbar">
    <div class="category-bar">
      <div class="category" v-for="cat in categories" :key="cat.name">
        <div class="icon">{{ cat.icon }}</div>
        <div class="label">{{ cat.name }}</div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
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
</script>

<style scoped>
.navbar {
  direction: rtl;
  background-color: #ffffff;
  border: 1px solid #ccc;
  border-radius: 12px;      /* 👈 פינות עגולות */
  padding: 0.2rem 0.8rem;
  height: 80px;
  display: flex;
  align-items: center;
}



.category-bar {
  display: flex;
  overflow-x: auto;
  gap: 1.5rem;
  padding: 0.5rem 0;
}

.category {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.85rem;
  color: #333;
  min-width: 70px;
  text-align: center;
  cursor: pointer;
}

.category .icon {
  font-size: 1.4rem; /* 👈 הקטנה מגודל 1.8rem */
  margin-bottom: 0.2rem; /* 👈 גם המרווח מתחת קטן יותר */
}

</style>
