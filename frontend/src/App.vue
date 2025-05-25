<template>
  <div id="app">
    <!-- <header class="header"></header> -->
    <div id="app">
      <Navbar />
      <router-view />
    </div>

    <main class="content">
      <!-- <router-view /> -->
    </main>

    <footer class="footer">
      <p>&copy; 2025 Fresh End</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
</script>

<style scoped>
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  font-family: Arial, sans-serif;
}

.header {
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  text-align: center;
}

.content {
  flex: 1;
  padding: 2rem;
}

.footer {
  background-color: #f5f5f5;
  padding: 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: #666;
}
</style>
