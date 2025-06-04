<template>
  <div class="user-management" v-if="isAdmin">
    <h1>👥 ניהול משתמשים</h1>

    <table>
      <thead>
        <tr>
          <th>אימייל</th>
          <th>תפקיד</th>
          <th>פעולות</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <td>{{ user.email }}</td>
          <td>{{ user.role }}</td>
          <td>
            <button @click="toggleRole(user)">
              שנה לתפקיד {{ user.role === 'admin' ? 'user' : 'admin' }}
            </button>
            <button @click="deleteUser(user.id)">מחק</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else class="unauthorized">
    <h2>⛔ אין לך גישה לעמוד זה</h2>
    <router-link to="/">חזרה</router-link>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/services/firebase'
import { useUserStore } from '@/stores/user'
import { deleteUserByUid, updateUserRole } from '@/services/userService'

interface User {
  id: string
  uid: string
  email: string
  role: 'admin' | 'user'
}

const userStore = useUserStore()
const isAdmin = userStore.isAdmin
const users = ref<User[]>([])

const loadUsers = async () => {
  const querySnapshot = await getDocs(collection(db, 'users'))
  users.value = querySnapshot.docs.map(doc => ({
    id: doc.id,
    uid: doc.data().uid,
    email: doc.data().email,
    role: doc.data().role
  })) as User[]
}

async function deleteUser(userId: string) {
  const user = users.value.find(u => u.id === userId)
  if (!user) return

  try {
    await deleteUserByUid(user.uid)
    users.value = users.value.filter(u => u.id !== userId)
  } catch (err) {
    console.error('שגיאה במחיקת המשתמש:', err)
    alert('שגיאה במחיקה')
  }
}

async function toggleRole(user: User) {
  const newRole = user.role === 'admin' ? 'user' : 'admin'

  try {
    await updateUserRole(user.uid, newRole)
    user.role = newRole
  } catch (err) {
    console.error('שגיאה בעדכון התפקיד:', err)
    alert('שגיאה בעדכון התפקיד')
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
  max-width: 800px;
  margin: auto;
  padding: 2rem;
  background-color: #f3f3f3;
  border-radius: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #ccc;
  padding: 0.75rem;
  text-align: center;
}

button {
  margin: 0 0.5rem;
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  background-color: #2c3e50;
  color: white;
}

button:hover {
  background-color: #34495e;
}

.unauthorized {
  text-align: center;
  padding: 4rem;
  color: red;
}
</style>
