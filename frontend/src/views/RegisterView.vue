<template>
  <div class="register-view">
    <RegisterForm />
  </div>
</template>

<script setup lang="ts">
import RegisterForm from '@/components/RegisterForm.vue'
</script>

<style scoped>
.register-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: #f5f5f5;
}
</style>
