<template>
  <div class="auth-container">
    <div class="auth-box">
      <h2>{{ isRegistering ? '📝 הרשמה' : '🔐 התחברות' }}</h2>

      <form @submit.prevent="handleSubmit">
        <div v-if="isRegistering" class="form-group">
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
          {{ loading ? '⏳ טוען...' : isRegistering ? 'הירשם' : 'התחבר' }}
        </button>
      </form>

      <button @click="handleGoogle" class="google-button">התחבר עם Google</button>

      <p class="toggle-auth">
        {{ isRegistering ? 'כבר יש לך חשבון?' : 'אין לך חשבון?' }}
        <a href="#" @click.prevent="toggleMode">
          {{ isRegistering ? 'התחבר' : 'הירשם' }}
        </a>
      </p>

      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { auth, db } from '@/services/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const isRegistering = ref(false)
const email = ref('')
const password = ref('')
const name = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()

function toggleMode() {
  isRegistering.value = !isRegistering.value
  error.value = ''
}

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    let uid = ''

    if (isRegistering.value) {
      const userCred = await createUserWithEmailAndPassword(auth, email.value, password.value)
      uid = userCred.user.uid

      await setDoc(doc(db, 'users', uid), {
        email: email.value,
        name: name.value,
        uid,
        role: 'user',
      })
    } else {
      const login = await signInWithEmailAndPassword(auth, email.value, password.value)
      uid = login.user.uid
    }

    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const data = userSnap.data()
      userStore.setUser(uid, data.email, data.role, data.name)
    }

    router.push('/')
  } catch (err: any) {
    console.error(err)
    error.value = err.message || 'שגיאה באימות'
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  error.value = ''
  loading.value = true
  const provider = new GoogleAuthProvider()

  try {
    const result = await signInWithPopup(auth, provider)
    const user = result.user

    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        name: user.displayName,
        uid: user.uid,
        role: 'user',
      })
    }

    const finalSnap = await getDoc(userRef)
    if (finalSnap.exists()) {
      const data = finalSnap.data()
      userStore.setUser(user.uid, data.email, data.role, data.name || user.displayName || '')
    }

    router.push('/')
  } catch (err: any) {
    console.error(err)
    error.value = err.message || 'שגיאה בהתחברות עם Google'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 85vh;
  background-color: #f9f9f9;
}

.auth-box {
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  border: 1px solid #ccc;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
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
  background-color: #27ae60;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.google-button {
  margin-top: 1rem;
  background-color: #4285f4;
}

button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.toggle-auth {
  text-align: center;
  margin-top: 1rem;
}

.toggle-auth a {
  color: #3498db;
  font-weight: bold;
  cursor: pointer;
}

.error {
  color: red;
  margin-top: 1rem;
  text-align: center;
}
</style>
