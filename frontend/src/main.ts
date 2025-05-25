import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import { auth } from '@/services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useUserStore } from '@/stores/user'

const app = createApp(App)
app.use(createPinia())

// טוען את המשתמש המחובר אם קיים
onAuthStateChanged(auth, (user) => {
  const userStore = useUserStore()
  if (user) {
    userStore.setUser({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName ?? '',
      role: 'user', // אפשר להביא גם מהשרת אם שמרתם שם
    })
  } else {
    userStore.logout()
  }

  // חשוב! רק אחרי זה עושים mount
  app.mount('#app')
})
