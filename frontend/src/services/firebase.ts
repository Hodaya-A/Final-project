import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore' // ✅ מוסיפים את זה

const firebaseConfig = {
  apiKey: 'AIzaSyAbaTHQ6iJphXRUZdxqtYfEgYNQ6P4iLao',
  authDomain: 'fresh-end.firebaseapp.com',
  projectId: 'fresh-end',
  storageBucket: 'fresh-end.firebasestorage.app',
  messagingSenderId: '567345286446',
  appId: '1:567345286446:web:9e34e5822d2aeb39f3bebf',
  measurementId: 'G-45FZTGNXV3',
}

// אתחול האפליקציה
const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app) // ✅ זה מה שהיה חסר לך!

const analytics = getAnalytics(app)
