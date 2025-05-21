<template>
  <form class="login-form" @submit.prevent="handleLogin">
    <h2>🔐 Login</h2>

    <div class="form-group">
      <label for="email">Email</label>
      <input id="email" v-model="email" type="email" required />
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input id="password" v-model="password" type="password" required />
    </div>

    <button type="submit" :disabled="loading">
      {{ loading ? 'Logging in...' : 'Log In' }}
    </button>

    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/services/firebase'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const router = useRouter()

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
    console.log('✅ User:', userCredential.user)
    router.push('/') // מפנה הביתה אחרי התחברות
  } catch (err: any) {
    error.value = err.message || 'Login failed.'
    console.error('❌', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: auto;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
}

.login-form h2 {
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
  background-color: #2c3e50;
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
  margin-top: 0.5rem;
  text-align: center;
}
</style>
