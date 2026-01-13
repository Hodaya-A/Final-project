<template>
  <div class="profile-wrapper" dir="rtl">
    <div class="profile-container">
      <header class="page-header">
        <div class="headline">
          <div class="profile-avatar">{{ getUserInitials() }}</div>
          <div>
            <p class="display-name">{{ userStore.name || userStore.email }}</p>
            <h1>הפרופיל שלי</h1>
            <p class="subtitle">ניהול פרטים אישיים</p>
            <span class="role-badge" :class="`badge-${userStore.role}`">
              {{ getRoleLabel(userStore.role) }}
            </span>
          </div>
        </div>
      </header>

      <div v-if="successMessage" class="alert alert-success">
        {{ successMessage }}
        <button @click="successMessage = ''" class="close-btn">×</button>
      </div>

      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
        <button @click="errorMessage = ''" class="close-btn">×</button>
      </div>

      <div v-if="isLoggedIn" class="cards-grid">
        <!-- Personal Card -->
        <section class="card">
          <header class="card-header">
            <div>
              <p class="card-eyebrow"></p>
              <h2>פרטים אישיים</h2>
              <p class="card-sub">שם פרטי, משפחה, טלפון, מייל</p>
            </div>
            <button v-if="!isEditingPersonal" class="btn-ghost" @click="togglePersonalEdit">
              ערוך פרטים
            </button>
          </header>

          <form v-if="isEditingPersonal" class="card-body" @submit.prevent="savePersonal">
            <div class="fields two-cols">
              <div class="form-group">
                <label>שם פרטי *</label>
                <Field
                  v-model="personalForm.firstName"
                  name="firstName"
                  type="text"
                  placeholder="ישראל"
                  rules="required|min:2"
                />
                <ErrorMessage name="firstName" class="error-message" />
              </div>
              <div class="form-group">
                <label>שם משפחה *</label>
                <Field
                  v-model="personalForm.lastName"
                  name="lastName"
                  type="text"
                  placeholder="ישראלי"
                  rules="required|min:2"
                />
                <ErrorMessage name="lastName" class="error-message" />
              </div>
            </div>

            <div class="fields two-cols">
              <div class="form-group">
                <label>מספר טלפון</label>
                <Field
                  v-model="personalForm.phone"
                  name="phone"
                  type="tel"
                  placeholder="050-1234567"
                  rules="israeliPhone"
                />
                <ErrorMessage name="phone" class="error-message" />
              </div>
              <div class="form-group">
                <label>מייל (לא ניתן לעריכה)</label>
                <input v-model="userStore.email" class="input-disabled" disabled />
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" :disabled="loading">
                {{ loading ? 'שומר...' : 'שמור' }}
              </button>
              <button
                type="button"
                class="btn-secondary"
                :disabled="loading"
                @click="cancelPersonal"
              >
                ביטול
              </button>
            </div>
          </form>

          <div v-else class="card-body read-mode">
            <div class="read-row">
              <span class="label">שם פרטי</span>
              <span class="value">{{ personalForm.firstName || '—' }}</span>
            </div>
            <div class="read-row">
              <span class="label">שם משפחה</span>
              <span class="value">{{ personalForm.lastName || '—' }}</span>
            </div>
            <div class="read-row">
              <span class="label">טלפון</span>
              <span class="value">{{ personalForm.phone || '—' }}</span>
            </div>
            <div class="read-row">
              <span class="label">אימייל</span>
              <span class="value">{{ userStore.email }}</span>
            </div>
          </div>
        </section>

        <!-- Store Card -->
        <section v-if="userStore.role === 'storeManager'" class="card">
          <header class="card-header">
            <div>
              <p class="card-eyebrow"></p>
              <h2>פרטי החנות</h2>
              <p class="card-sub">שם חנות, כתובת, טלפון עסקי</p>
            </div>
            <button
              v-if="!isEditingStore"
              class="btn-ghost"
              :disabled="storeLoading"
              @click="toggleStoreEdit"
            >
              ערוך חנות
            </button>
          </header>

          <div v-if="storeLoading" class="loader">טוען פרטי חנות...</div>

          <form v-else-if="isEditingStore" class="card-body" @submit.prevent="saveStore">
            <div class="fields two-cols">
              <div class="form-group">
                <label>שם החנות *</label>
                <input v-model="storeForm.name" type="text" placeholder="לדוגמה: המכולת של יוסי" />
              </div>
              <div class="form-group">
                <label>טלפון העסק</label>
                <input v-model="storeForm.phone" type="tel" placeholder="03-1234567" />
              </div>
            </div>

            <div class="fields three-cols">
              <div class="form-group">
                <label>עיר</label>
                <input v-model="storeForm.city" type="text" placeholder="תל אביב" />
              </div>
              <div class="form-group">
                <label>רחוב</label>
                <input v-model="storeForm.street" type="text" placeholder="דיזנגוף" />
              </div>
              <div class="form-group">
                <label>מספר</label>
                <input v-model="storeForm.houseNumber" type="text" placeholder="10" />
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" :disabled="loading">
                {{ loading ? 'שומר...' : 'שמור' }}
              </button>
              <button type="button" class="btn-secondary" :disabled="loading" @click="cancelStore">
                ביטול
              </button>
            </div>
          </form>

          <div v-else class="card-body read-mode">
            <div class="read-row">
              <span class="label">שם החנות</span>
              <span class="value">{{ storeForm.name || '—' }}</span>
            </div>
            <div class="read-row">
              <span class="label">כתובת</span>
              <span class="value">{{ getStoreAddress() }}</span>
            </div>
            <div class="read-row">
              <span class="label">טלפון העסק</span>
              <span class="value">{{ storeForm.phone || '—' }}</span>
            </div>
          </div>
        </section>
      </div>

      <div v-else class="card blocked-card">
        <h2>את לא מחוברת</h2>
        <p>כדי לעדכן פרופיל או פרטי חנות צריך להתחבר מחדש.</p>
        <div class="blocked-actions">
          <button class="btn-primary" @click="goToLogin">התחברות</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { Field, ErrorMessage, useForm, defineRule, configure } from 'vee-validate'
import { required, min } from '@vee-validate/rules'
import { updateUserProfile } from '@/services/userService'
import type { StoreDetails } from '../services/storeService'

defineRule('required', required)
defineRule('min', min)
defineRule('israeliPhone', (value: string) => {
  if (!value) return true
  const regex = /^05[0-9](-?[0-9]{7}|[0-9]{7})$/
  return regex.test(value) || 'מספר טלפון לא תקין (פורמט: 050-1234567)'
})

configure({
  generateMessage: (context) => {
    const messages: Record<string, string> = {
      required: 'שדה זה הוא חובה',
      min: `השדה חייב להכיל לפחות ${(context.rule?.params as string[])?.[0] || ''} תווים`,
    }
    return messages[context.rule?.name || ''] || 'ערך לא תקין'
  },
})

const userStore = useUserStore()
const router = useRouter()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const { handleSubmit, resetForm: resetValidatorForm } = useForm()

const loading = ref(false)
const storeLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const isEditingPersonal = ref(false)
const isEditingStore = ref(false)

const personalForm = ref({
  firstName: '',
  lastName: '',
  phone: '',
})

const storeForm = ref<StoreDetails>({
  storeId: '',
  name: '',
  city: '',
  street: '',
  houseNumber: '',
  phone: '',
})

const initialStoreState = ref<StoreDetails | null>(null)

const splitName = (fullName: string) => {
  if (!fullName) return { first: '', last: '' }
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts.slice(0, -1).join(' '), last: parts.slice(-1).join('') }
}

const hydratePersonal = () => {
  const { first, last } = splitName(userStore.name || '')
  personalForm.value.firstName = first
  personalForm.value.lastName = last
  personalForm.value.phone = ''
}

const hydrateStore = (data?: StoreDetails) => {
  const source: Partial<StoreDetails> = data || initialStoreState.value || {}
  storeForm.value.storeId = source.storeId || userStore.storeId || ''
  storeForm.value.name = source.name || ''
  storeForm.value.city = source.city || ''
  storeForm.value.street = source.street || ''
  storeForm.value.houseNumber = source.houseNumber || ''
  storeForm.value.phone = source.phone || ''
}

const loadStoreDetails = async () => {
  if (userStore.role !== 'storeManager' || !userStore.storeId) {
    return
  }

  // טען את פרטי החנות ישירות מה-userStore (שנטען מ-Firestore)
  const storeData = {
    storeId: userStore.storeId,
    name: userStore.storeName || '',
    city: userStore.city || '',
    street: userStore.street || '',
    houseNumber: userStore.houseNumber || '',
  }

  initialStoreState.value = { ...storeData }
  hydrateStore(storeData)
}

onMounted(() => {
  hydratePersonal()
  loadStoreDetails()
})

const getUserInitials = () => {
  const name = userStore.name || userStore.email || 'U'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    user: 'לקוח',
    storeManager: 'מנהל חנות',
    admin: 'מנהל מערכת',
    courier: 'שליח',
  }
  return labels[role] || role
}

const togglePersonalEdit = () => {
  successMessage.value = ''
  errorMessage.value = ''
  isEditingPersonal.value = true
}

const toggleStoreEdit = () => {
  successMessage.value = ''
  errorMessage.value = ''
  isEditingStore.value = true
}

const savePersonal = handleSubmit(async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    const fullName = `${personalForm.value.firstName} ${personalForm.value.lastName}`.trim()

    await updateUserProfile({
      name: fullName,
      phone: personalForm.value.phone,
    })

    userStore.name = fullName
    successMessage.value = 'הפרטים האישיים נשמרו'
    isEditingPersonal.value = false
    resetValidatorForm()
  } catch (error) {
    const err = error as Error
    errorMessage.value = err.message || 'אירעה שגיאה בעדכון הפרטים'
  } finally {
    loading.value = false
  }
})

const cancelPersonal = () => {
  hydratePersonal()
  resetValidatorForm()
  isEditingPersonal.value = false
  errorMessage.value = ''
}

const saveStore = async () => {
  if (!userStore.storeId) {
    errorMessage.value = 'לא נמצא מזהה חנות'
    return
  }
  try {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    // עדכן ישירות ב-Firestore
    const { doc, updateDoc } = await import('firebase/firestore')
    const { db } = await import('@/services/firebase')

    const storeRef = doc(db, 'stores', userStore.storeId)
    const updates: Record<string, string> = {}

    if (storeForm.value.name?.trim()) updates.name = storeForm.value.name.trim()
    if (storeForm.value.city?.trim()) updates.city = storeForm.value.city.trim()
    if (storeForm.value.street?.trim()) updates.street = storeForm.value.street.trim()
    if (storeForm.value.houseNumber?.trim())
      updates.houseNumber = storeForm.value.houseNumber.trim()

    await updateDoc(storeRef, updates)

    // עדכן את ה-userStore
    if (updates.name) userStore.storeName = updates.name
    if (updates.city) userStore.city = updates.city
    if (updates.street) userStore.street = updates.street
    if (updates.houseNumber) userStore.houseNumber = updates.houseNumber

    initialStoreState.value = {
      storeId: userStore.storeId,
      ...updates,
    }

    successMessage.value = 'פרטי החנות נשמרו'
    isEditingStore.value = false
  } catch (error) {
    console.error('Save store error:', error)
    const err = error as Error
    errorMessage.value = err.message || 'שגיאה בשמירת פרטי החנות'
  } finally {
    loading.value = false
  }
}

const cancelStore = () => {
  hydrateStore()
  isEditingStore.value = false
  errorMessage.value = ''
}

const getStoreAddress = () => {
  const parts = [storeForm.value.street, storeForm.value.houseNumber, storeForm.value.city]
  const joined = parts.filter(Boolean).join(' ')
  return joined || '—'
}

const goToLogin = () => {
  router.push({ name: 'auth' })
}
</script>

<style scoped>
.profile-wrapper {
  min-height: 100vh;
  background: #ffffff;
  padding: 2rem 1rem 3rem;
  direction: rtl;
}

.profile-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 1.5rem;
}

.headline {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-header h1 {
  font-size: 2.2rem;
  color: #111827;
  margin: 0;
}

.page-header .subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0.2rem 0 0.4rem;
}

.profile-avatar {
  width: 70px;
  height: 70px;
  border-radius: 18px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 1.6rem;
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.25);
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  margin-top: 0.25rem;
}

.badge-user {
  background: #e0f2fe;
  color: #075985;
}

.badge-storeManager {
  background: #fef3c7;
  color: #92400e;
}

.badge-admin {
  background: #ffe4e6;
  color: #9f1239;
}

.badge-courier {
  background: #ffedd5;
  color: #c2410c;
}

/* Alerts */
.alert {
  padding: 1rem 1.25rem;
  border-radius: 14px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 2px solid transparent;
}

.alert-success {
  background: #ecfdf3;
  border-color: #22c55e;
  color: #166534;
}

.alert-error {
  background: #fff1f2;
  border-color: #f97316;
  color: #9a3412;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: inherit;
}

.cards-grid {
  display: grid;
  gap: 1.25rem;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
}

.card-header {
  padding: 1.25rem 1.5rem 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.card-header h2 {
  margin: 0.1rem 0;
  font-size: 1.35rem;
  color: #111827;
}

.card-eyebrow {
  margin: 0;
  color: #6b7280;
  font-size: 0.85rem;
  letter-spacing: 0.01em;
}

.card-sub {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.card-body {
  padding: 0 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.fields {
  display: grid;
  gap: 1rem;
}

.two-cols {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.three-cols {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-weight: 700;
  color: #111827;
  font-size: 0.95rem;
}

.form-group input {
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.85rem 0.9rem;
  font-size: 1rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  direction: rtl;
}

.form-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.input-disabled {
  background: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.error-message {
  color: #dc2626;
  font-size: 0.85rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary,
.btn-ghost {
  border-radius: 12px;
  padding: 0.75rem 1.1rem;
  font-weight: 700;
  border: 1px solid transparent;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.25);
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-ghost:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-primary:not(:disabled):hover {
  transform: translateY(-1px);
}

.blocked-card {
  text-align: center;
  max-width: 520px;
  margin: 0 auto;
  padding: 1.5rem;
}

.blocked-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.btn-secondary {
  background: #f9fafb;
  color: #111827;
  border-color: #e5e7eb;
}

.btn-ghost {
  background: #f5f3ff;
  color: #5b21b6;
  border: 1px dashed #c4b5fd;
}

.read-mode {
  display: grid;
  gap: 0.75rem;
}

.read-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.9rem 1rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.label {
  color: #6b7280;
  font-weight: 600;
  font-size: 0.9rem;
}

.value {
  color: #111827;
  font-weight: 700;
  width: 100%;
}

.logo-preview {
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  padding: 0.75rem;
  display: inline-flex;
  background: #f9fafb;
}

.logo-preview img {
  height: 70px;
  max-width: 180px;
  object-fit: contain;
}

.logo-preview.muted {
  background: #fff;
}

.loader {
  padding: 1rem 1.5rem 1.25rem;
  color: #6b7280;
}

@media (max-width: 640px) {
  .profile-wrapper {
    padding: 1.25rem 0.75rem 2rem;
  }

  .page-header h1 {
    font-size: 1.6rem;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
