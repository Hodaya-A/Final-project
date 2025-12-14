<template>
  <table class="inventory-table">
    <thead>
      <tr>
        <th>ברקוד</th>
        <th>שם מוצר</th>
        <th>קטגוריה</th>
        <th>מחיר</th>
        <th>מבצע</th>
        <th>כמות</th>
        <th>תוקף</th>
        <th>פעולות</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in items"
        :key="item._id"
        :class="{ 'expiring-soon': isExpiringSoon(item.expiryDate) }"
      >
        <td>{{ item.barcode }}</td>
        <td>{{ item.name }}</td>
        <td>{{ item.category }}</td>
        <td>{{ item.price }} ₪</td>
        <td>{{ item.salePrice ? item.salePrice + ' ₪' : '-' }}</td>
        <td>{{ item.quantity }}</td>
        <td>{{ formatDate(item.expiryDate) }}</td>
        <td class="actions">
          <button class="edit-btn" @click="openEditModal(item)">
            <Pencil class="icon-tiny" />
          </button>
          <button class="delete-btn" @click="deleteItem(item._id!)">
            <Trash2 class="icon-tiny" />
          </button>
        </td>
      </tr>
    </tbody>

    <!-- חלון עריכה -->
    <div v-if="showEditModal" class="edit-modal-backdrop">
      <div class="edit-modal">
        <h3>עריכת מוצר</h3>
        <input v-model="editedItem.name" placeholder="שם מוצר" />
        <input v-model.number="editedItem.price" placeholder="מחיר" type="number" />
        <input v-model.number="editedItem.salePrice" placeholder="מחיר מבצע" type="number" />
        <input v-model.number="editedItem.quantity" placeholder="כמות" type="number" />
        <input v-model="editedItem.expiryDate" type="date" />

        <div class="edit-buttons">
          <button class="save-btn" @click="updateItem">שמור</button>
          <button class="cancel-btn" @click="closeEditModal">ביטול</button>
        </div>
      </div>
    </div>
  </table>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/services/api'
import type { InventoryItem } from '@/services/inventory'
import { Pencil, Trash2 } from 'lucide-vue-next'

defineProps<{ items: InventoryItem[] }>()

const showEditModal = ref(false)
const editedItem = ref<Partial<InventoryItem>>({})

function formatDate(date?: string) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('he-IL')
}

function isExpiringSoon(date?: string) {
  if (!date) return false
  const expiry = new Date(date)
  if (isNaN(expiry.getTime())) return false
  const diff = (expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return diff < 10
}

function openEditModal(item: InventoryItem) {
  editedItem.value = { ...item }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
}

async function updateItem() {
  try {
    await api.put(`/api/products/${editedItem.value._id}`, editedItem.value)
    alert('✅ המוצר עודכן בהצלחה')
    showEditModal.value = false
    window.location.reload()
  } catch (err) {
    console.error(err)
    alert('❌ שגיאה בעדכון המוצר')
  }
}

async function deleteItem(id: string) {
  const confirmDelete = confirm('האם את בטוחה שברצונך למחוק את המוצר הזה?')
  if (!confirmDelete) return

  try {
    await api.delete(`/api/products/${id}`)
    alert('🗑️ המוצר נמחק בהצלחה')
    window.location.reload()
  } catch (err) {
    console.error(err)
    alert('❌ שגיאה במחיקה')
  }
}
</script>

<style scoped>
.inventory-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

th {
  background: #e9f4eb;
  color: #1f5131;
  text-align: center;
  padding: 0.6rem;
}

td {
  border-bottom: 1px solid #eee;
  text-align: center;
  padding: 0.6rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 0.6rem;
}

/* --- כפתורי פעולה --- */
.edit-btn,
.delete-btn {
  border: none;
  border-radius: 8px;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.25s ease;
  font-size: 0.9rem;
}

/* כפתור עדכון */
.edit-btn {
  background: #e6f7e9;
  color: #1f5131;
  border: 1px solid #b8e2b9;
  box-shadow: 0 0 0 transparent;
}
.edit-btn:hover {
  background: #c7f0ce;
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(47, 125, 75, 0.2);
}

/* כפתור מחיקה */
.delete-btn {
  background: #fde8e8;
  color: #a11b1b;
  border: 1px solid #f5b8b8;
}
.delete-btn:hover {
  background: #fbcaca;
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(197, 60, 60, 0.2);
}

/* --- רקע לתוקף קצר --- */
.expiring-soon {
  background: #fff4e5;
}

/* --- מודל עריכה --- */
.edit-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.edit-modal {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  width: 350px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.edit-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 0.8rem;
}

.save-btn {
  background: #1f5131;
  color: white;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.cancel-btn {
  background: #ccc;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.icon-tiny {
  width: 16px;
  height: 16px;
}
</style>
