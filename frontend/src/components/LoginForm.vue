<template>
  <form class="login-form" @submit.prevent="handleEmailLogin">
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

    <div class="separator">OR</div>

    <button type="button" class="google-btn" @click="handleGoogleLogin">
      Continue with Google
    </button>

    <p v-if="error" class="error">{{ error }}</p>

    <!-- 🔻 העברנו את זה פנימה לכאן -->
    <p class="switch-auth">
      Don't have an account?
      <router-link to="/register">Sign up</router-link>
    </p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/services/firebase'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleEmailLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    const result = await signInWithEmailAndPassword(auth, email.value, password.value)
    console.log('✅ Logged in:', result.user)
    router.push('/')
  } catch (err: any) {
    error.value = err.message || 'Login failed.'
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  error.value = ''
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    console.log('✅ Google login:', result.user)
    router.push('/')
  } catch (err: any) {
    error.value = err.message || 'Google login failed.'
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
  margin-top: 0.5rem;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button[type='submit'] {
  background-color: #2c3e50;
  color: white;
}

.google-btn {
  background-color: #fff;
  color: #444;
  border: 1px solid #ccc;
}

.google-btn:hover {
  background-color: #f1f1f1;
}

.separator {
  text-align: center;
  margin: 1rem 0;
  font-weight: bold;
}

.error {
  color: red;
  margin-top: 1rem;
  text-align: center;
}

.switch-auth {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
}

.switch-auth a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
}
</style>
