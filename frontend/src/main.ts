import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import { auth } from '@/services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useUserStore } from '@/stores/user'

const app = createApp(App)

// 🧠 חייבים לחבר את כל ה־plugins לפני mount
app.use(createPinia())
app.use(router) // <<< הוסף את זה כאן!

// טוען את המשתמש המחובר אם קיים
onAuthStateChanged(auth, (user) => {
  const userStore = useUserStore()
  if (user) {
    userStore.setUser({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName ?? '',
      role: 'user',
    })
  } else {
    userStore.logout()
  }

  // רק אחרי שה־router מחובר – מבצעים mount
  app.mount('#app')
})
