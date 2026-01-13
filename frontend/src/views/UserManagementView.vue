<template>
  <div class="user-management-wrapper">
    <div class="user-management" v-if="isAdmin">
      <header class="page-header">
        <h1>ניהול משתמשים</h1>
        <p class="subtitle">צפייה וניהול של כל המשתמשים במערכת</p>
      </header>

      <section class="add-user">
        <div class="section-header">
          <h2>הוספת משתמש חדש</h2>
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
        {{ errorMessage }}
        <button @click="errorMessage = ''" class="close-btn">×</button>
      </div>

      <section class="users-section">
        <div class="section-header-with-search">
          <div class="section-header">
            <h2>רשימת משתמשים</h2>
            <span class="user-count"
              >{{ filteredUsers.length }} מתוך {{ users.length }} משתמשים</span
            >
          </div>
          <div class="search-bar">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="חיפוש לפי שם או אימייל..."
              class="search-input"
            />
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button class="tab" :class="{ active: activeTab === 'user' }" @click="activeTab = 'user'">
            לקוחות
            <span class="tab-count">{{ getUsersByRole('user').length }}</span>
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'storeManager' }"
            @click="activeTab = 'storeManager'"
          >
            מנהלי חנויות
            <span class="tab-count">{{ getUsersByRole('storeManager').length }}</span>
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'admin' }"
            @click="activeTab = 'admin'"
          >
            מנהלי מערכת
            <span class="tab-count">{{ getUsersByRole('admin').length }}</span>
          </button>
        </div>

        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>טוען משתמשים...</p>
        </div>

        <div v-else-if="filteredUsers.length === 0" class="empty-state">
          <p>{{ searchQuery ? 'לא נמצאו משתמשים' : 'אין משתמשים בקטגוריה זו' }}</p>
        </div>

        <div v-else class="users-grid">
          <div v-for="user in filteredUsers" :key="user.uid" class="user-card">
            <div class="user-header">
              <div class="user-avatar">{{ getUserInitials(user) }}</div>
              <div class="user-info">
                <h3>{{ user.name || 'ללא שם' }}</h3>
                <p class="email">{{ user.email }}</p>
                <span class="badge" :class="`badge-${user.role}`">
                  {{ getRoleLabel(user.role) }}
                </span>
              </div>
            </div>

            <div
              v-if="user.role === 'storeManager' && (user.shopName || user.shopAddress)"
              class="store-info"
            >
              <p v-if="user.shopName" class="shop-name">
                <strong>שם חנות:</strong> {{ user.shopName }}
              </p>
              <p v-if="user.shopAddress" class="shop-address">
                <strong>מיקום:</strong> {{ user.shopAddress }}, {{ user.shopCity }}
              </p>
            </div>

            <div class="user-actions">
              <div class="action-buttons">
                <button class="btn-icon btn-edit" @click="openEditUser(user)" title="עריכה">
                  ערוך
                </button>
                <button class="btn-icon btn-delete" @click="confirmDelete(user)" title="מחיקה">
                  מחק
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Edit Modal -->
      <div v-if="editingUser" class="modal-overlay" @click="closeEditUser">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>עריכת משתמש</h2>
            <button @click="closeEditUser" class="close-modal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>שם</label>
              <input v-model="editingUser.name" type="text" />
            </div>
            <div class="form-group">
              <label>תפקיד</label>
              <select v-model="editingUser.role">
                <option value="user">משתמש רגיל</option>
                <option value="storeManager">מנהל חנות</option>
                <option value="admin">ניהול אתר</option>
              </select>
            </div>
            <div class="form-group checkbox-group">
              <label>
                <input v-model="editingUser.courierOptIn" type="checkbox" />
                <span>משלוחן</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="saveEditUser" class="btn-save">שמור שינויים</button>
            <button @click="closeEditUser" class="btn-cancel">ביטול</button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="unauthorized">
      <div class="unauthorized-content">
        <h2>אין לך הרשאה לעמוד זה</h2>
        <p>עמוד זה זמין למנהלי מערכת בלבד</p>
        <router-link to="/" class="btn-back">חזרה לדף הבית</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
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
const searchQuery = ref('')
const activeTab = ref<UserRole>('user')
const editingUser = ref<ManagedUser | null>(null)

const newUser = reactive({
  name: '',
  email: '',
  password: '',
  role: 'user' as UserRole,
  courierOptIn: false,
})

// Computed: Filter users by active tab and search query
const filteredUsers = computed(() => {
  let filtered = getUsersByRole(activeTab.value)

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (user) =>
        (user.name || '').toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
    )
  }

  return filtered
})

// Get users by role
function getUsersByRole(role: UserRole): ManagedUser[] {
  return users.value.filter((u) => u.role === role)
}

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
  } catch (err) {
    errorMessage.value = (err as Error)?.message || 'שגיאה בטעינת המשתמשים'
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
  } catch (err) {
    errorMessage.value = (err as Error)?.message || 'שגיאה בהוספת המשתמש'
  } finally {
    saving.value = false
  }
}

async function deleteUser(uid: string) {
  try {
    await deleteUserByUid(uid)
    users.value = users.value.filter((u) => u.uid !== uid)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [uid]: _, ...rest } = roleCache.value
    roleCache.value = rest
  } catch (err) {
    errorMessage.value = (err as Error)?.message || 'שגיאה במחיקה'
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

// Edit user modal functions
function openEditUser(user: ManagedUser) {
  editingUser.value = { ...user }
}

function closeEditUser() {
  editingUser.value = null
}

async function saveEditUser() {
  if (!editingUser.value) return

  const user = users.value.find((u) => u.uid === editingUser.value!.uid)
  if (!user) return

  try {
    // Update role
    if (user.role !== editingUser.value.role) {
      await updateUserRole(editingUser.value.uid, editingUser.value.role)
      user.role = editingUser.value.role
      roleCache.value[user.uid] = editingUser.value.role

      if (user.uid === userStore.uid) {
        userStore.role = editingUser.value.role
      }
    }

    // Update courier status
    if (user.courierOptIn !== editingUser.value.courierOptIn) {
      await updateUserCourierStatus(editingUser.value.uid, editingUser.value.courierOptIn || false)
      user.courierOptIn = editingUser.value.courierOptIn

      if (user.uid === userStore.uid) {
        userStore.courierOptIn = editingUser.value.courierOptIn || false
      }
    }

    // Update name if changed (we might need a new service method for this)
    if (user.name !== editingUser.value.name) {
      user.name = editingUser.value.name
    }

    closeEditUser()
  } catch (err) {
    errorMessage.value = (err as Error)?.message || 'שגיאה בעדכון המשתמש'
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management-wrapper {
  min-height: 100vh;
  background: #ffffff;
  padding: 2rem 1rem;
  direction: rtl;
}

.user-management {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 2.5rem;
  color: #2c3e50;
}

.page-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-shadow: none;
}

.page-header .subtitle {
  font-size: 1.1rem;
  opacity: 0.95;
}

/* Add User Section */
.add-user {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
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

.add-user__form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
  margin-top: 1.5rem;
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
  direction: rtl;
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

/* Alert */
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

/* Users Section */
.users-section {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.section-header-with-search {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.user-count {
  background: #f0f4ff;
  color: #667eea;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

/* Search Bar */
.search-bar {
  margin-bottom: 1.5rem;
}

.search-input {
  width: 100%;
  padding: 0.9rem 1.2rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  direction: rtl;
  text-align: right;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e5e7eb;
}

.tab {
  flex: 1;
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  bottom: -2px;
}

.tab:hover {
  color: #667eea;
  background: #f9fafb;
}

.tab.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: #f9fafb;
}

.tab-count {
  background: #e5e7eb;
  color: #374151;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
}

.tab.active .tab-count {
  background: #667eea;
  color: white;
}

/* Loading & Empty States */
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
  color: #9ca3af;
  font-size: 1.1rem;
}

/* User Cards Grid */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.user-card {
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 1.5rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.user-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.user-card:hover::before {
  opacity: 1;
}

.user-header {
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

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info .email {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge {
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-user {
  background: #dbeafe;
  color: #1e40af;
}

.badge-storeManager {
  background: #fef3c7;
  color: #92400e;
}

.badge-admin {
  background: #fce7f3;
  color: #9f1239;
}

.store-info {
  background: transparent;
  padding: 0.75rem 0;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.shop-name {
  color: #374151;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.shop-address {
  color: #6b7280;
}

.user-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-edit {
  background: #eff6ff;
  color: #1e40af;
}

.btn-edit:hover {
  background: #dbeafe;
  transform: scale(1.1);
}

.btn-delete {
  background: #fee2e2;
  color: #991b1b;
}

.btn-delete:hover {
  background: #fecaca;
  transform: scale(1.1);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-size: 1.5rem;
  color: #1f2937;
}

.close-modal {
  background: none;
  border: none;
  font-size: 2rem;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
  transition: color 0.2s;
}

.close-modal:hover {
  color: #374151;
}

.modal-body {
  margin-bottom: 1.5rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 10px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

/* Unauthorized */
.unauthorized {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unauthorized-content {
  background: white;
  padding: 3rem;
  border-radius: 20px;
  border: 2px solid #e5e7eb;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.unauthorized-content h2 {
  font-size: 2rem;
  color: #1f2937;
  margin-bottom: 1rem;
}

.unauthorized-content p {
  color: #6b7280;
  margin-bottom: 2rem;
}

.btn-back {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 2rem;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-back:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Responsive */
@media (max-width: 480px) {
  .user-management-wrapper {
    padding: 0.5rem;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .page-header .subtitle {
    font-size: 0.9rem;
  }

  .add-user,
  .users-section {
    padding: 1rem;
    border-radius: 12px;
  }

  .add-user__form {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .form-group input,
  .form-group select {
    padding: 0.6rem;
    font-size: 0.95rem;
  }

  .btn-add {
    padding: 0.6rem 1rem;
    font-size: 0.95rem;
  }

  .search-input {
    padding: 0.7rem 1rem;
    font-size: 0.95rem;
  }

  .tabs {
    flex-direction: column;
    gap: 0;
    border-bottom: none;
  }

  .tab {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
    border-bottom: 2px solid #e5e7eb;
    border-left: 3px solid transparent;
    border-radius: 0;
  }

  .tab.active {
    border-bottom-color: #e5e7eb;
    border-left-color: #667eea;
  }

  .users-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .user-card {
    padding: 1rem;
  }

  .user-avatar {
    width: 50px;
    height: 50px;
    font-size: 1rem;
  }

  .user-info h3 {
    font-size: 1rem;
  }

  .user-info .email {
    font-size: 0.8rem;
  }

  .badge {
    font-size: 0.7rem;
    padding: 0.25rem 0.6rem;
  }

  .store-info {
    font-size: 0.8rem;
    padding: 0.5rem 0;
  }

  .btn-icon {
    width: 36px;
    height: 36px;
    font-size: 0.85rem;
  }

  .modal-content {
    width: 95%;
    padding: 1rem;
    border-radius: 12px;
  }

  .modal-header h2 {
    font-size: 1.25rem;
  }
}

@media (min-width: 481px) and (max-width: 768px) {
  .user-management-wrapper {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 2rem;
  }

  .add-user,
  .users-section {
    padding: 1.5rem;
  }

  .add-user__form {
    grid-template-columns: repeat(2, 1fr);
  }

  .tabs {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .tab {
    flex: 1 1 calc(33.333% - 0.5rem);
    min-width: 150px;
  }

  .users-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }

  .modal-content {
    width: 90%;
    padding: 1.5rem;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .user-management {
    max-width: 100%;
    padding: 0 1rem;
  }

  .users-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
  }

  .modal-content {
    width: 80%;
    max-width: 500px;
  }
}

@media (min-width: 1025px) {
  .user-management {
    max-width: 1200px;
  }

  .users-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}
</style>
```
