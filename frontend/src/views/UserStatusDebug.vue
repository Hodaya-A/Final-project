<template>
  <div style="padding: 2rem; text-align: center">
    <h1>🔍 בדיקת סטטוס המשתמש</h1>

    <div style="margin: 2rem 0; font-size: 1.2rem">
      <p><strong>UID:</strong> {{ userStore.uid }}</p>
      <p><strong>Email:</strong> {{ userStore.email }}</p>
      <p>
        <strong>Role:</strong>
        <span style="color: blue; font-weight: bold">{{ userStore.role }}</span>
      </p>
      <p><strong>Store ID:</strong> {{ userStore.storeId || 'לא קיים' }}</p>
      <p><strong>Store Name:</strong> {{ userStore.storeName || 'לא קיים' }}</p>
    </div>

    <hr style="margin: 2rem 0" />

    <div
      v-if="userStore.role === 'storeManager'"
      style="background: #d4edda; padding: 1rem; border-radius: 8px"
    >
      ✅ אתה מנהל חנות!<br />
      <button @click="goToPending" style="margin-top: 1rem; padding: 0.5rem 1rem; cursor: pointer">
        עבור להזמנות ממתינות
      </button>
    </div>

    <div
      v-else-if="userStore.role === 'user'"
      style="background: #fff3cd; padding: 1rem; border-radius: 8px"
    >
      ℹ️ אתה משתמש רגיל<br />
      אתה צריך להתחבר כמנהל חנות כדי לראות הזמנות ממתינות
    </div>

    <div v-else style="background: #f8d7da; padding: 1rem; border-radius: 8px">
      ⚠️ אתה לא מחובר או לא הוגדר role<br />
      אנא התחבר שוב
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

function goToPending() {
  router.push('/store/pending-orders')
}
</script>
