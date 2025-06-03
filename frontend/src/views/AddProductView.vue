<template>
  <div class="add-product" v-if="isAdmin">
    <h1>➕ הוסף מוצר חדש</h1>
    <form @submit.prevent="handleSubmit">
      <label>
        שם מוצר:
        <input v-model="name" required />
      </label>

      <label>
        מחיר (₪):
        <input v-model.number="price" type="number" required />
      </label>

      <label>
        תאריך תפוגה:
        <input v-model="expiryDate" type="date" required />
      </label>

      <label>
        כתובת תמונה (URL):
        <input v-model="imageUrl" type="url" required />
      </label>

      <button type="submit">שמור</button>
    </form>

    <p v-if="successMessage" class="success">{{ successMessage }}</p>
  </div>

  <div v-else class="unauthorized">
    <h2>⛔ אין לך גישה לעמוד זה</h2>
    <router-link to="/">חזרה</router-link>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const isAdmin = userStore.isAdmin
const router = useRouter()

const name = ref('')
const price = ref(0)
const expiryDate = ref('')
const imageUrl = ref('')
const successMessage = ref('')

function handleSubmit() {
  // שליחה לשרת או לדאטה פיקטיבי (בהמשך את תעשי API אמיתי)
  console.log('📦 מוצר נוסף:', {
    name: name.value,
    price: price.value,
    expiryDate: expiryDate.value,
    imageUrl: imageUrl.value
  })

  successMessage.value = '✅ המוצר נשמר בהצלחה!'
  setTimeout(() => {
    router.push('/admin')
  }, 1500)
}
</script>

<style scoped>
.add-product {
  max-width: 500px;
  margin: auto;
  padding: 2rem;
  background-color: #f3f3f3;
  border-radius: 12px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

label {
  display: flex;
  flex-direction: column;
  font-weight: bold;
}

input {
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}

button {
  padding: 0.8rem;
  font-weight: bold;
  background-color: #2c3e50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.success {
  color: green;
  margin-top: 1rem;
  text-align: center;
}

.unauthorized {
  text-align: center;
  padding: 4rem;
  color: red;
}
</style>
