<template>
  <div class="add-product-container">
    <div v-if="userStore.isLoggedIn" class="form-card">
      <h1 class="title">הוספת מוצר חדש למלאי</h1>

      <form @submit.prevent="handleSubmit" class="product-form">
        <div class="form-row">
          <div class="form-group">
            <label>שם המוצר</label>
            <input v-model="name" type="text" placeholder="לדוגמה: גבינה צהובה עמק" required />
          </div>

          <div class="form-group">
            <label>מותג / חברה</label>
            <input v-model="brand" type="text" placeholder="לדוגמה: תנובה" required />
          </div>
        </div>

        <div class="form-group">
          <label>קטגוריה</label>
          <select v-model="category" required>
            <option value="" disabled selected>בחר קטגוריה...</option>
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>מחיר מקורי (₪)</label>
            <input v-model.number="priceOriginal" type="number" step="0.1" required />
          </div>

          <div class="form-group">
            <label>מחיר מבצע/סופי (₪)</label>
            <input v-model.number="priceDiscounted" type="number" step="0.1" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>כמות במלאי</label>
            <input v-model.number="quantity" type="number" placeholder="100" required />
          </div>

          <div class="form-group">
            <label>תאריך תפוגה</label>
            <input v-model="expiryDate" type="date" required />
          </div>
        </div>

        <div class="form-group">
          <label>תיאור (אופציונלי)</label>
          <textarea v-model="description" rows="2"></textarea>
        </div>

        <div class="form-group">
          <label>תמונת המוצר</label>
          <div class="file-upload-wrapper">
            <input type="file" @change="handleFileUpload" accept="image/*" />
          </div>
          <p v-if="imageFile" class="file-selected">קובץ נבחר: {{ imageFile.name }}</p>
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'שומר...' : 'שמור מוצר' }}
        </button>
      </form>

      <p v-if="successMessage" class="success">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>

    <div v-else class="unauthorized">
      <h2>אין לך גישה לעמוד זה</h2>
      <router-link to="/auth">התחבר למערכת</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import axios from 'axios'

const userStore = useUserStore()
const router = useRouter()

// משתנים לטופס
const name = ref('')
const brand = ref('')
const category = ref('')
const priceOriginal = ref<number | null>(null)
const priceDiscounted = ref<number | null>(null)
const quantity = ref<number | null>(null)
const expiryDate = ref('')
const description = ref('')
const imageFile = ref<File | null>(null)

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const categories = [
  'לחם ומאפים טריים',
  'פארם ותינוקות',
  'חד פעמי ומטבח', // תיקון קטן בשם
  'אחזקת הבית ובעלי חיים', // תיקון קטן בשם
  'חטיפים ומתוקים',
  'קטניות ודגנים',
  'שימורים ובישול',
  'קפואים',
  'אורגני ובריאות',
  'משקאות', // הוספתי כי היה חסר
  'בשר ודגים',
  'חלב, ביצים וסלטים', // תיקון קטן בשם
]

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    imageFile.value = target.files[0]
  }
}

async function handleSubmit() {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const formData = new FormData()

    // הוספת כל השדות ל-FormData
    formData.append('name', name.value)
    formData.append('brand', brand.value)
    formData.append('category', category.value)
    formData.append('priceOriginal', String(priceOriginal.value))
    formData.append('priceDiscounted', String(priceDiscounted.value))
    formData.append('quantity', String(quantity.value))
    formData.append('expiryDate', expiryDate.value)
    formData.append('description', description.value)

    // הוספת מזהה מוכר (חשוב!)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerId = (userStore as any).email || (userStore as any).user?.email
    if (sellerId) {
      formData.append('sellerId', sellerId)
    }

    // הוספת תמונה אם נבחרה
    if (imageFile.value) {
      formData.append('image', imageFile.value)
    }

    // שליחה לשרת
    await axios.post('/api/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    successMessage.value = 'המוצר נשמר בהצלחה!'

    // איפוס הטופס ומעבר לדף ניהול
    setTimeout(() => {
      // אם זה אדמין -> לדף אדמין, אם זה מנהל חנות -> לדף חנות
      if (userStore.isAdmin) {
        router.push('/admin')
      } else {
        router.push('/store/products')
      }
    }, 1500)
  } catch (err) {
    console.error(err)
    errorMessage.value = 'אירעה שגיאה בשמירת המוצר. נסה שוב.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.add-product-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 1rem;
  direction: rtl;
}

.form-card {
  background-color: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.title {
  text-align: center;
  margin-bottom: 2rem;
  color: #2c3e50;
  font-size: 1.8rem;
}

.product-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  font-weight: 600;
  color: #555;
}

input,
select,
textarea {
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  background-color: #f9f9f9;
  transition: all 0.3s;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #8e44ad;
  outline: none;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(142, 68, 173, 0.1);
}

.file-upload-wrapper input {
  padding: 0.5rem;
  background: white;
}

.file-selected {
  font-size: 0.9rem;
  color: #27ae60;
  margin-top: 0.2rem;
}

.submit-btn {
  background: linear-gradient(135deg, #8e44ad, #9b59b6);
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  margin-top: 1rem;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(142, 68, 173, 0.3);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.success {
  color: #27ae60;
  text-align: center;
  font-weight: bold;
  margin-top: 1rem;
  font-size: 1.1rem;
}

.error {
  color: #e74c3c;
  text-align: center;
  font-weight: bold;
  margin-top: 1rem;
}

.unauthorized {
  text-align: center;
  margin-top: 4rem;
}

/* התאמה למובייל */
@media (max-width: 600px) {
  .form-row {
    flex-direction: column;
  }
}
</style>
