<template>
  <div class="store-manager-dashboard">
    <h1>לוח ניהול חנות</h1>

    <Transition name="warning-fade">
      <div v-if="!hasPaymentDetails && isLoaded" class="warning-banner">
        <div class="warning-content">
          <div class="warning-text">
            <p class="warning-title">עדכון חשוב - פרטי תשלום חסרים</p>
            <p class="warning-desc">
              כדי שנוכל להעביר לך כספים, עליך להוסיף פרטי חשבון בנק בפרופיל.
            </p>
          </div>
        </div>
        <button type="button" class="btn-warning" @click="goToProfile">עדכן פרטי בנק</button>
      </div>
    </Transition>

    <div class="actions">
      <button @click="goTo('/store/pending-orders')">הזמנות ממתינות לאישור</button>
      <button @click="goTo('/store/products')">ניהול מוצרים</button>
      <button @click="goTo('/store/reports')">דוחות אישיים</button>
      <button class="financial-btn" @click="goTo('/store/payouts')">ניהול כספים</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'

const userStore = useUserStore()
const router = useRouter()
const hasPaymentDetails = ref(false)
const isLoaded = ref(false)

function goTo(path: string) {
  router.push(path)
}

function goToProfile() {
  router.push('/profile')
}

let unsubscribe: (() => void) | null = null

// בדוק פרטי תשלום בעת טעינה + listen to real-time updates
onMounted(async () => {
  try {
    const { doc, onSnapshot } = await import('firebase/firestore')
    const { db } = await import('@/services/firebase')

    const userRef = doc(db, 'users', userStore.uid || '')

    // Subscribe to real-time updates
    unsubscribe = onSnapshot(userRef, (userSnap) => {
      if (userSnap.exists()) {
        const data = userSnap.data()
        hasPaymentDetails.value = !!data.bankCode
      }
      isLoaded.value = true
    })
  } catch {
    // אם יש שגיאה, נניח שאין פרטים
    hasPaymentDetails.value = false
  }
})

// Clean up listener when component unmounts
onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

// אם לא מנהל חנות – ניתוב הביתה
if (userStore.role !== 'storeManager') {
  router.push('/')
}
</script>

<style scoped>
.store-manager-dashboard {
  max-width: 1200px;
  margin: auto;
  padding: 3rem 2rem;
  direction: rtl;
  text-align: center;
  background-color: #f9fafb;
  min-height: 100vh;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.warning-banner {
  background: #fef3c7;
  border: 1.5px solid #fbbf24;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.warning-content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

.warning-text {
  flex: 1;
}

.warning-title {
  margin: 0;
  color: #92400e;
  font-weight: 700;
  font-size: 0.95rem;
}

.warning-desc {
  margin: 0.25rem 0 0;
  color: #b45309;
  font-size: 0.9rem;
}

.btn-warning {
  background: #f97316;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 0.6rem 1rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition:
    transform 0.15s ease,
    box-shadow 0.2s ease;
  box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
}

.btn-warning:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(249, 115, 22, 0.35);
}

.btn-warning:active {
  transform: translateY(0);
}

.actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-top: 2rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.actions button {
  padding: 1.5rem 2.5rem;
  font-size: 1.3rem;
  font-weight: 600;
  border-radius: 16px;
  background: white;
  color: #8b5cf6;
  border: 3px solid #8b5cf6;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.1);
}

.actions button:hover {
  background: #f3e8ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .store-manager-dashboard {
    padding: 2rem 1rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 2rem;
  }

  .actions {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: 100%;
  }

  .actions button {
    padding: 1.2rem 1.5rem;
    font-size: 1rem;
  }
}

/* Warning Banner Transition */
.warning-fade-enter-active,
.warning-fade-leave-active {
  transition: all 0.3s ease;
}

.warning-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.warning-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
