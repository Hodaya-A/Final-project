<template>
  <form class="register-form" @submit.prevent="handleRegister">
    <h2>📝 הרשמה</h2>

    <div class="form-group">
      <label for="name">שם</label>
      <input id="name" v-model="name" type="text" required />
    </div>

    <div class="form-group">
      <label for="email">אימייל</label>
      <input id="email" v-model="email" type="email" required />
    </div>

    <div class="form-group">
      <label for="password">סיסמה</label>
      <input id="password" v-model="password" type="password" required />
    </div>

    <button type="submit" :disabled="loading">
      {{ loading ? 'נרשם...' : 'הירשם' }}
    </button>

    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/services/auth'

const email = ref('')
const password = ref('')
const name = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()

async function handleRegister() {
  loading.value = true
  error.value = ''

  try {
    await register(email.value, password.value, name.value)
    router.push('/') // או כל עמוד אחר שתבחרי
  } catch (err: any) {
    console.error(err)
    error.value = err.message || 'אירעה שגיאה בהרשמה'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-form {
  max-width: 400px;
  margin: auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
}

.register-form h2 {
  text-align: center;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  font-weight: bold;
  display: block;
  margin-bottom: 0.25rem;
  color: black;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  width: 100%;
  padding: 0.6rem;
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.error {
  color: red;
  margin-top: 1rem;
  text-align: center;
}
</style>
