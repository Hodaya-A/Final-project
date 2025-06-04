<template>
  <form class="register-form" @submit.prevent="handleRegister">
    <h2>📝 Sign Up</h2>

    <div class="form-group">
      <label for="email">Email</label>
      <input id="email" v-model="email" type="email" required />
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input id="password" v-model="password" type="password" required />
    </div>

    <button type="submit" :disabled="loading">
      {{ loading ? 'Creating Account...' : 'Sign Up' }}
    </button>

    <p v-if="error" class="error">{{ error }}</p>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/services/firebase'
import { doc, setDoc } from 'firebase/firestore'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  try {
    // יצירת המשתמש ב־Authentication
    const result = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const uid = result.user.uid

    // שמירה במסד Firestore
    await setDoc(doc(db, 'users', uid), {
      email: email.value,
      role: 'user', // ניתן לשנות ל־'admin' במידת הצורך
      uid
    })

    console.log('✅ Registered and saved user:', uid)
    router.push('/')
  } catch (err: any) {
    error.value = err.message || 'Registration failed.'
    console.error(err)
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
  background-color: #27ae60;
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
