<template>
  <div class="register-container">
    <form class="register-form" @submit.prevent="handleRegister">
      <h2>הרשמה למנהלי חנויות</h2>

      <div class="form-group">
        <label for="name">שם מלא</label>
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

      <div class="form-group">
        <label for="store">כתובת החנות</label>
        <input id="store" v-model="storeAddress" type="text" required />
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? '⏳ נרשם...' : 'הירשם כמנהל חנות' }}
      </button>

      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/services/firebase'
import { doc, setDoc } from 'firebase/firestore'

const name = ref('')
const email = ref('')
const password = ref('')
const storeAddress = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()

async function handleRegister() {
  error.value = ''
  loading.value = true

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const uid = userCredential.user.uid

    await setDoc(doc(db, 'users', uid), {
      email: email.value,
      name: name.value,
      uid,
      role: 'storeManager',
      storeAddress: storeAddress.value,
      createdAt: new Date(),
    })

    router.push('/store')
  } catch (err: any) {
    console.error(err)
    error.value = err.message || 'אירעה שגיאה בהרשמה'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background-color: #f9f9f9;
}

.register-form {
  max-width: 400px;
  width: 100%;
  padding: 2rem;
  background: white;
  border: 1px solid #ccc;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #24452b;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
}

button {
  width: 100%;
  padding: 0.7rem;
  margin-top: 1rem;
  background-color: #24452b;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
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
