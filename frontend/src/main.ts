import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import 'leaflet/dist/leaflet.css'


import { auth, db } from '@/services/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useUserStore } from '@/stores/user'

const app = createApp(App)
app.use(createPinia())
app.use(router)

let appHasMounted = false // ✅ מונע הרצה כפולה של mount

onAuthStateChanged(auth, async (user) => {
  const userStore = useUserStore()

  if (user) {
    let role: 'user' | 'admin' = 'user' // ✅ טיפוס מדויק

    try {
      const userRef = doc(db, 'users', user.uid)
      const snapshot = await getDoc(userRef)

      if (snapshot.exists()) {
        const data = snapshot.data()
        role = data.role === 'admin' ? 'admin' : 'user'
      }
    } catch (err) {
      console.error('שגיאה בטעינת תפקיד המשתמש:', err)
    }

    userStore.setUser(user.email || '', role)
  } else {
    userStore.logout()
  }

  if (!appHasMounted) {
    app.mount('#app')
    appHasMounted = true
  }
})
