<template>
  <div class="auth-container">
    <div class="auth-box">
      <h2>{{ isRegistering ? 'הרשמה' : 'התחברות' }}</h2>

      <form @submit.prevent="isRegistering ? handleRegister() : handleLogin()">
        <div class="form-group">
          <label for="email">אימייל</label>
          <input id="email" v-model="email" type="email" required />
        </div>

        <div class="form-group">
          <label for="password">סיסמה</label>
          <input id="password" v-model="password" type="password" required />
        </div>

        <!-- הרשמה בלבד -->
        <template v-if="isRegistering">
          <!-- טקסט להחלפה בין לקוח למנהל חנות -->
          <div class="form-group">
            <label for="name">שם</label>
            <input id="name" v-model="name" type="text" required />
          </div>

          <!-- אופציה להירשם כשליח -->
          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="isCourier" />
              אני רוצה להירשם גם כשליח
            </label>
          </div>

          <div class="manager-link">
            <p v-if="!isStoreManager" @click="isStoreManager = true">
              רוצה להירשם כמנהל חנות? לחץ כאן
            </p>
            <p v-else @click="isStoreManager = false">רוצה להירשם כלקוח רגיל? לחץ כאן</p>
          </div>

          <div v-if="isStoreManager" class="store-fields">
            <h3>פרטי חנות</h3>

            <div class="form-group">
              <label>שם החנות</label>
              <input v-model="storeName" required />
            </div>
            <div class="form-group">
              <label>עיר</label>
              <select v-model="city" required>
                <option disabled value="">בחר עיר</option>
                <option v-for="c in cities" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="form-group" v-if="city">
              <label>רחוב</label>
              <select v-model="street" :disabled="loadingStreets || !streets.length" required>
                <option disabled value="">
                  {{ loadingStreets ? 'טוען...' : streets.length ? 'בחר רחוב' : 'לא נמצאו רחובות' }}
                </option>
                <option v-for="s in streets" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>

            <div class="form-group" v-if="street">
              <label>מספר בית</label>
              <input v-model="houseNumber" type="text" required />
            </div>
          </div>
        </template>

        <button type="submit" :disabled="loading">
          {{ loading ? 'טוען...' : isRegistering ? 'הירשם' : 'התחבר' }}
        </button>

        <p class="toggle-auth">
          {{ isRegistering ? 'כבר יש לך חשבון?' : 'אין לך חשבון?' }}
          <a href="#" @click.prevent="toggleMode">
            {{ isRegistering ? 'התחבר' : 'הירשם' }}
          </a>
        </p>

        <p v-if="!isRegistering" class="manager-shortcut">
          רוצה להירשם כמנהל חנות?
          <a href="#" @click.prevent="startStoreManagerSignup">לחץ כאן</a>
        </p>

        <p v-if="error" class="error">{{ error }}</p>
      </form>

      <button @click="handleGoogle" class="google-button">התחבר עם Google</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth, db } from '@/services/firebase'
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
const city = ref<string>('')
const street = ref<string>('')
const houseNumber = ref<string>('')
const name = ref<string>('')

const cities = ref<string[]>([])
const streets = ref<string[]>([])

const router = useRouter()
const email = ref<string>('')
const password = ref<string>('')
const error = ref<string>('')
const loading = ref<boolean>(false)
const isRegistering = ref<boolean>(false)
const isStoreManager = ref<boolean>(false)
const isCourier = ref<boolean>(false)

// Store fields
const storeName = ref<string>('')
// const storeAddress = ref<string>('')

const userStore = useUserStore()

onMounted(async () => {
  try {
    const r = await fetch('/api/geocode/cities')
    cities.value = await r.json()
  } catch {
    cities.value = []
  }
})

const loadingStreets = ref<boolean>(false)

async function loadStreets() {
  streets.value = []
  street.value = ''
  loadingStreets.value = true
  try {
    const res = await fetch(`/api/geocode/streets?city=${encodeURIComponent(city.value)}`)
    const data = await res.json()
    streets.value = Array.isArray(data) ? data : []
  } catch {
    streets.value = []
  } finally {
    loadingStreets.value = false
  }
}

// כשעיר משתנה – לאפס את מצב הרחובות
watch(city, () => {
  street.value = ''
  streets.value = []
  if (city.value) loadStreets()
})

// פונקציה לאימות כתובת מול השרת
async function validateAddress(
  address: string,
): Promise<{ ok: boolean; formatted?: string; lat?: number; lng?: number; reason?: string }> {
  try {
    const res = await fetch(`/api/geocode/validate?address=${encodeURIComponent(address)}`)
    if (!res.ok) return { ok: false, reason: 'שגיאת שרת באימות כתובת' }
    const data = await res.json()
    return data
  } catch {
    return { ok: false, reason: 'לא ניתן לאמת כתובת כרגע' }
  }
}

function toggleMode() {
  isRegistering.value = !isRegistering.value
  error.value = ''
  isStoreManager.value = false
  isCourier.value = false
  storeName.value = ''
  // storeAddress.value = ''
  city.value = ''
  street.value = ''
  houseNumber.value = ''
  streets.value = []
}

function startStoreManagerSignup() {
  isRegistering.value = true
  isStoreManager.value = true
  error.value = ''
}

// const handleRegister = async () => {
// loading.value = true
// error.value = ''
// try {
// const result = await createUserWithEmailAndPassword(auth, email.value, password.value)
// const uid = result.user.uid
// let storeId = ''
// if (isStoreManager.value) {
// if (!storeName.value || !city.value || !street.value || !houseNumber.value) {
// error.value = 'אנא מלאי שם חנות, עיר, רחוב ומספר בית'
// loading.value = false
// return
// }
// const fullAddress = `${street.value} ${houseNumber.value}, ${city.value}, ישראל`
// const validated = await validateAddress(fullAddress)
// if (!validated.ok || !validated.formatted || validated.lat == null || validated.lng == null) {
// error.value = validated.reason || 'כתובת לא תקינה, נסי לדייק (רחוב, מספר, עיר)'
// loading.value = false
// return
// }
// const storeRef = await addDoc(collection(db, 'stores'), {
// name: storeName.value,
// city: city.value,
// street: street.value,
// houseNumber: houseNumber.value,
// address: validated.formatted,
// location: { lat: validated.lat, lng: validated.lng },
// })
// storeId = storeRef.id
// }
//
// await setDoc(doc(db, 'users', uid), {
// email: email.value,
// role: isStoreManager.value ? 'storeManager' : 'user',
// uid,
// ...(storeId && { storeId }),
// })
//
// router.push('/')
// } catch (err: unknown) {
// if (err instanceof Error) {
// error.value = err.message
// } else {
// error.value = 'שגיאה בהרשמה'
// }
// } finally {
// loading.value = false
// }
// }

const handleRegister = async () => {
  loading.value = true
  error.value = ''

  try {
    // 1) יצירת משתמש והבטחת טוקן חתום טרי
    const cred = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const uid = cred.user.uid
    await cred.user.getIdToken(true) // 👈 מבטיח שהבקשות לפיירסטור יישאו auth

    // 2) אם מנהל חנות – ולידציה לכתובת
    let storeId = ''
    if (isStoreManager.value) {
      if (!name.value.trim()) throw new Error('אנא מלאי שם')
      if (!storeName.value || !city.value || !street.value || !houseNumber.value) {
        throw new Error('אנא מלאי שם חנות, עיר, רחוב ומספר בית')
      }

      const fullAddress = `${street.value} ${houseNumber.value}, ${city.value}, ישראל`
      const validated = await validateAddress(fullAddress)
      if (!validated.ok || !validated.lat || !validated.lng) {
        throw new Error(validated.reason || 'כתובת לא תקינה')
      }

      // 3) קודם נשמור את משתמש ה-USER (כדי למנוע בעיות חוקים בעתיד)
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: email.value,
        name: name.value,
        role: 'user',
        createdAt: Date.now(),
      })

      // 4) עכשיו יוצרים את החנות עם ownerUid=uid (תואם לכללים)
      try {
        const ref = await addDoc(collection(db, 'stores'), {
          name: storeName.value,
          city: city.value,
          street: street.value,
          houseNumber: houseNumber.value,
          address: validated.formatted,
          location: { lat: validated.lat, lng: validated.lng },
          ownerUid: uid, // 👈 קריטי לכללים
          createdAt: Date.now(),
        })
        storeId = ref.id
      } catch (e: unknown) {
        console.error('stores/create failed', e)
        throw new Error('אין הרשאה ליצור חנות (בדקי כללי Firestore ו-ownerUid)')
      }

      // 5) מוסיפים את storeId למשתמש
      await setDoc(
        doc(db, 'users', uid),
        {
          uid,
          email: email.value,
          name: name.value,
          role: 'storeManager',
          storeId,
          createdAt: Date.now(),
        },
        { merge: true },
      )
    } else {
      // רישום כלקוח רגיל או שליח
      const role = isCourier.value ? 'courier' : 'user'
      await setDoc(doc(db, 'users', uid), {
        uid,
        email: email.value,
        name: name.value || '',
        role: role,
        createdAt: Date.now(),
      })
    }

    router.push('/')
  } catch (err: unknown) {
    console.error(err)
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'שגיאה לא צפויה'
    }
  } finally {
    loading.value = false
  }
}

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    const login = await signInWithEmailAndPassword(auth, email.value, password.value)
    const uid = login.user.uid

    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const data = userSnap.data()

      // טעינת פרטי חנות אם זה מנהל חנות
      let sName = data.storeName || ''
      let sCity = data.city || ''
      let sStreet = data.street || ''
      let sNumber = data.houseNumber || data.number || ''

      if (data.role === 'storeManager' && data.storeId && (!sName || !sCity || !sStreet)) {
        try {
          const storeDoc = await getDoc(doc(db, 'stores', data.storeId))
          if (storeDoc.exists()) {
            const storeData = storeDoc.data()
            sName = storeData?.name || sName
            sCity = storeData?.city || sCity
            sStreet = storeData?.street || sStreet
            sNumber = storeData?.houseNumber || sNumber
          }
        } catch (err) {
          console.error('Failed to load store details:', err)
        }
      }

      userStore.setUser(
        uid,
        data.email,
        data.role,
        data.name || '',
        data.storeId || '',
        data.courierOptIn || false,
        sName,
        sCity,
        sStreet,
        sNumber,
      )
      // load user's saved cart after login
      try {
        const m = await import('@/stores/cart')
        const cart = m.useCartStore()
        await cart.loadFromServer(uid)
      } catch {
        /* ignore */
      }
    }

    router.push('/')
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'שגיאה בהתחברות'
    }
  } finally {
    loading.value = false
  }
}
const handleGoogle = async () => {
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

      // טעינת פרטי חנות אם זה מנהל חנות
      let sName = data.storeName || ''
      let sCity = data.city || ''
      let sStreet = data.street || ''
      let sNumber = data.houseNumber || data.number || ''

      if (data.role === 'storeManager' && data.storeId && (!sName || !sCity || !sStreet)) {
        try {
          const storeDoc = await getDoc(doc(db, 'stores', data.storeId))
          if (storeDoc.exists()) {
            const storeData = storeDoc.data()
            sName = storeData?.name || sName
            sCity = storeData?.city || sCity
            sStreet = storeData?.street || sStreet
            sNumber = storeData?.houseNumber || sNumber
          }
        } catch (err) {
          console.error('Failed to load store details:', err)
        }
      }

      userStore.setUser(
        user.uid,
        data.email,
        data.role,
        data.name || user.displayName || '',
        data.storeId || '',
        data.courierOptIn || false,
        sName,
        sCity,
        sStreet,
        sNumber,
      )
      // load user's saved cart after login
      try {
        const m = await import('@/stores/cart')
        const cart = m.useCartStore()
        await cart.loadFromServer(user.uid)
      } catch {
        /* ignore */
      }
    }

    router.push('/')
  } catch (err: unknown) {
    console.error(err)
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'שגיאה בהתחברות עם Google'
    }
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
  max-width: 500px;
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
  display: flex;
  flex-direction: column;
}

label {
  font-weight: bold;
  margin-bottom: 0.25rem;
  color: black;
}

input[type='text'],
input[type='email'],
input[type='password'] {
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
  margin-top: 1rem;
}
.google-button {
  margin-top: 1rem;
  background-color: #4285f4;
}

.error {
  color: red;
  margin-top: 1rem;
  text-align: center;
}

.manager-link {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.9rem;
  color: #2c3e50;
  cursor: pointer;
}
.manager-link p:hover {
  text-decoration: underline;
}

.store-fields {
  background-color: #fffbe0;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
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
.manager-shortcut {
  margin-top: 0.5rem;
  text-align: center;
  font-size: 0.9rem;
  color: #2c3e50;
}

.manager-shortcut a {
  color: #3498db;
  font-weight: bold;
  text-decoration: none;
}
select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: white;
}

.checkbox-group {
  display: flex;
  align-items: center;
  margin: 0.5rem 0;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-group input[type='checkbox'] {
  width: auto;
  cursor: pointer;
  margin: 0;
}
</style>
