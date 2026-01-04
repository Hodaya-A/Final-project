<template>
  <div class="user-management-wrapper">
    <div class="user-management" v-if="isAdmin">
      <header class="page-header">
        <h1>👥 ניהול משתמשים</h1>
        <p class="subtitle">צפייה וניהול של כל המשתמשים במערכת</p>
      </header>

      <section class="add-user">
        <div class="section-header">
          <h2>➕ הוספת משתמש חדש</h2>
          <p class="hint">כל הסיסמאות מאובטחות ואינן מוצגות בממשק</p>
        </div>
        <form class="add-user__form" @submit.prevent="addUser">
          <div class="form-group">
            <label>שם מלא</label>
            <input v-model="newUser.name" type="text" placeholder="הזן שם מלא" />
          </div>
          <div class="form-group">
            <label>כתובת אימייל *</label>
            <input v-model="newUser.email" type="email" placeholder="example@mail.com" required />
          </div>
          <div class="form-group">
            <label>סיסמה זמנית *</label>
            <input
              v-model="newUser.password"
              type="password"
              placeholder="הזן סיסמה זמנית"
              required
            />
          </div>
          <div class="form-group">
            <label>תפקיד</label>
            <select v-model="newUser.role">
              <option value="user">משתמש רגיל</option>
              <option value="storeManager">מנהל חנות</option>
              <option value="admin">ניהול אתר</option>
            </select>
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input v-model="newUser.courierOptIn" type="checkbox" />
              <span>אפשר למשתמש זה להיות משלוחן</span>
            </label>
          </div>
          <button type="submit" :disabled="saving" class="btn-add">
            <span v-if="!saving">הוסף משתמש</span>
            <span v-else>שומר...</span>
          </button>
        </form>
      </section>

      <div v-if="errorMessage" class="alert alert-error">
        <span class="icon">⚠️</span>
        {{ errorMessage }}
        <button @click="errorMessage = ''" class="close-btn">×</button>
      </div>

      <section class="users-section">
        <div class="section-header">
          <h2>רשימת משתמשים</h2>
          <span class="user-count">סה"כ: {{ users.length }} משתמשים</span>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>טוען משתמשים...</p>
        </div>

        <div v-else-if="users.length === 0" class="empty-state">
          <span class="icon">📭</span>
          <p>אין משתמשים במערכת</p>
        </div>

        <div v-else class="users-grid">
          <div v-for="user in users" :key="user.uid" class="user-card">
            <div class="user-info">
              <div class="user-avatar">{{ getUserInitials(user) }}</div>
              <div class="user-details">
                <h3>{{ user.name || 'ללא שם' }}</h3>
                <p class="email">{{ user.email }}</p>
                <span class="badge" :class="`badge-${user.role}`">{{
                  getRoleLabel(user.role)
                }}</span>
              </div>
            </div>
            <div class="user-actions">
              <div class="role-selector">
                <label>שינוי תפקיד:</label>
                <select v-model="user.role" @change="saveRole(user)">
                  <option value="user">משתמש</option>
                  <option value="storeManager">מנהל חנות</option>
                  <option value="admin">ניהול אתר</option>
                </select>
              </div>
              <div class="courier-toggle">
                <label>
                  <input
                    v-model="user.courierOptIn"
                    type="checkbox"
                    @change="saveCourierStatus(user)"
                  />
                  <span>משלוחן</span>
                </label>
              </div>
              <button class="btn-delete" @click="confirmDelete(user)">מחק משתמש</button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="unauthorized">
      <div class="unauthorized-content">
        <span class="icon">⛔</span>
        <h2>אין לך הרשאה לעמוד זה</h2>
        <p>עמוד זה זמין למנהלי מערכת בלבד</p>
        <router-link to="/" class="btn-back">חזרה לדף הבית</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useUserStore } from '@/stores/user'
import {
  createUser,
  deleteUserByUid,
  fetchUsers,
  updateUserRole,
  updateUserCourierStatus,
  type ManagedUser,
  type UserRole,
} from '@/services/userService'

const userStore = useUserStore()
const isAdmin = userStore.isAdmin

const users = ref<ManagedUser[]>([])
const roleCache = ref<Record<string, UserRole>>({})
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const newUser = reactive({
  name: '',
  email: '',
  password: '',
  role: 'user' as UserRole,
  courierOptIn: false,
})

async function loadUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    users.value = await fetchUsers()
    roleCache.value = users.value.reduce(
      (acc, u) => {
        acc[u.uid] = u.role
        return acc
      },
      {} as Record<string, UserRole>,
    )
  } catch (err: any) {
    errorMessage.value = err?.message || 'שגיאה בטעינת המשתמשים'
  } finally {
    loading.value = false
  }
}

async function addUser() {
  if (!newUser.email || !newUser.password) {
    errorMessage.value = 'נדרש להזין אימייל וסיסמה'
    return
  }
  saving.value = true
  errorMessage.value = ''
  try {
    const created = await createUser({
      email: newUser.email,
      password: newUser.password,
      name: newUser.name,
      role: newUser.role,
      courierOptIn: newUser.courierOptIn,
    })
    users.value.push(created)
    roleCache.value[created.uid] = created.role
    newUser.name = ''
    newUser.email = ''
    newUser.password = ''
    newUser.role = 'user'
    newUser.courierOptIn = false
  } catch (err: any) {
    errorMessage.value = err?.message || 'שגיאה בהוספת המשתמש'
  } finally {
    saving.value = false
  }
}

async function deleteUser(uid: string) {
  try {
    await deleteUserByUid(uid)
    users.value = users.value.filter((u) => u.uid !== uid)
    const { [uid]: _, ...rest } = roleCache.value
    roleCache.value = rest
  } catch (err: any) {
    errorMessage.value = err?.message || 'שגיאה במחיקה'
  }
}

function confirmDelete(user: ManagedUser) {
  if (confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${user.name || user.email}?`)) {
    deleteUser(user.uid)
  }
}

function getUserInitials(user: ManagedUser): string {
  if (user.name) {
    const parts = user.name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return parts[0].substring(0, 2).toUpperCase()
  }
  return user.email.substring(0, 2).toUpperCase()
}

function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'ניהול אתר',
    storeManager: 'מנהל חנות',
    user: 'משתמש',
  }
  return labels[role] || role
}

async function saveRole(user: ManagedUser) {
  const previousRole = roleCache.value[user.uid] || user.role
  try {
    await updateUserRole(user.uid, user.role)
    roleCache.value[user.uid] = user.role
    // אם זה המשתמש הנוכחי, עדכן את ה-store כדי שהnavbar ישתנה מיד
    if (user.uid === userStore.uid) {
      userStore.role = user.role
    }
  } catch (err: any) {
    errorMessage.value = err?.message || 'שגיאה בעדכון התפקיד'
    user.role = previousRole
  }
}

async function saveCourierStatus(user: ManagedUser) {
  const previousStatus = user.courierOptIn
  try {
    await updateUserCourierStatus(user.uid, user.courierOptIn || false)
    // אם זה המשתמש הנוכחי, עדכן את ה-store כדי שהnavbar ישתנה מיד
    if (user.uid === userStore.uid) {
      userStore.courierOptIn = user.courierOptIn || false
    }
  } catch (err: any) {
    errorMessage.value = err?.message || 'שגיאה בעדכון סטטוס משלוחן'
    user.courierOptIn = previousStatus
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
}

.user-management {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 2.5rem;
  color: white;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.page-header .subtitle {
  font-size: 1.1rem;
  opacity: 0.95;
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin-bottom: 0.3rem;
}

.section-header .hint {
  color: #666;
  font-size: 0.9rem;
}

.add-user {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.add-user__form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.checkbox-group input[type='checkbox'] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #667eea;
}

.checkbox-group span {
  font-size: 1rem;
  color: #2c3e50;
}

.form-group input,
.form-group select {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-add {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.btn-add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-error {
  background: #fff5f5;
  border: 2px solid #feb2b2;
  color: #c53030;
}

.alert .icon {
  font-size: 1.5rem;
}

.close-btn {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

.users-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.users-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.user-count {
  background: #f0f4ff;
  color: #667eea;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 1rem;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.empty-state .icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.user-card {
  background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
  border: 2px solid #e8ecf7;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.user-info {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.user-details {
  flex: 1;
}

.user-details h3 {
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 0.3rem;
}

.user-details .email {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.badge-admin {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.badge-storeManager {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.badge-user {
  background: #e8ecf7;
  color: #667eea;
}

.store-id {
  color: #888;
  font-size: 0.85rem;
  margin-top: 0.3rem;
}

.user-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e8ecf7;
}

.role-selector {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.role-selector label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
}

.role-selector select {
  padding: 0.6rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.role-selector select:focus {
  outline: none;
  border-color: #667eea;
}

.courier-toggle label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
  padding: 0.6rem;
  background: #f8f9ff;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.courier-toggle label:hover {
  background: linear-gradient(135deg, rgba(255, 165, 0, 0.1), rgba(255, 140, 0, 0.1));
  border-color: #ff8c00;
}

.courier-toggle input[type='checkbox'] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #ff8c00;
}

.courier-toggle span {
  font-size: 0.95rem;
  color: #2c3e50;
}

.btn-delete {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(238, 90, 111, 0.4);
}

.unauthorized {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.unauthorized-content {
  background: white;
  padding: 3rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.unauthorized-content .icon {
  font-size: 5rem;
  display: block;
  margin-bottom: 1rem;
}

.unauthorized-content h2 {
  color: #e74c3c;
  margin-bottom: 0.5rem;
}

.unauthorized-content p {
  color: #666;
  margin-bottom: 1.5rem;
}

.btn-back {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.3s ease;
}

.btn-back:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}
</style>
