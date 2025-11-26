<template>
  <div class="inventory-page animate-fade-in">
    <h1 class="page-title">
      <PackageSearch class="icon" />
      ניהול מלאי
    </h1>

    <!-- גריד עיקרי -->
    <div class="inventory-grid">
      <!-- תיבת העלאה -->
      <div class="upload-card">
        <h2 class="card-title">
          <Upload class="icon-small" />
          העלאת קובץ מלאי
        </h2>

        <div class="upload-box">
          <label class="upload-label">
            <ArrowUpFromLine class="icon-small" />
            בחר קובץ
            <input type="file" @change="onFileChange" accept=".csv,.xlsx" class="file-input" />
          </label>

          <button :disabled="!file" @click="openModal" class="upload-btn">
            <Upload class="icon-small" />
            העלאה
          </button>
        </div>

        <p v-if="message" class="upload-message">
          <CheckCircle2 class="icon-small" />
          {{ message }}
        </p>
      </div>

      <!-- טבלת המלאי -->
      <div class="inventory-card">
        <div class="card-header">
          <h2 class="card-title">
            <ListChecks class="icon-small" />
            רשימת מלאי
          </h2>

          <div class="header-buttons">
            <button @click="loadInventory" class="refresh-btn">
              <RotateCw class="icon-tiny" />
              רענן
            </button>

            <button @click="downloadExcel" class="download-btn">
              <ArrowDownToLine class="icon-tiny" />
              הורד קובץ
            </button>
          </div>
        </div>

        <InventoryTable :items="inventory" />
      </div>
    </div>

    <!-- Modal -->
    <transition name="fade-zoom">
      <div v-if="showModal" class="modal-backdrop">
        <div class="modal">
          <h2 class="modal-title">
            <Settings class="icon-small" />
            בחירת סוג העלאה
          </h2>
          <p class="modal-text">האם לעדכן את המלאי הקיים או לחדש לגמרי (ימחק הכל)?</p>

          <div class="modal-actions">
            <button @click="handleUpload('update')" class="btn-update">
              <DatabaseBackup class="icon-small" />
              עדכון מלאי קיים
            </button>
            <button @click="handleUpload('renew')" class="btn-renew">
              <Trash2 class="icon-small" />
              חידוש מלאי
            </button>
          </div>

          <button @click="closeModal" class="btn-cancel">
            <XCircle class="icon-tiny" />
            ביטול
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import InventoryTable from '@/components/InventoryTable.vue'
import { getInventory, uploadInventory, type InventoryItem } from '@/services/inventory'
import * as XLSX from 'xlsx'

// 🧩 אייקונים
import {
  PackageSearch,
  Upload,
  ArrowUpFromLine,
  CheckCircle2,
  ListChecks,
  RotateCw,
  Settings,
  DatabaseBackup,
  Trash2,
  XCircle,
  ArrowDownToLine,
} from 'lucide-vue-next'

const inventory = ref<InventoryItem[]>([])
const file = ref<File | null>(null)
const message = ref('')
const showModal = ref(false)

/* --- העלאת קובץ --- */
function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  file.value = target.files?.[0] || null
}

function openModal() {
  if (!file.value) return alert('בחרי קובץ קודם')
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleUpload(mode: 'update' | 'renew') {
  if (!file.value) return
  showModal.value = false

  if (mode === 'renew') {
    const confirmDelete = confirm(
      'האם את בטוחה שברצונך לחדש את המלאי? פעולה זו תמחק את כל המוצרים הקיימים!',
    )
    if (!confirmDelete) return
  }

  try {
    const res = await uploadInventory(file.value, mode) // ← שימוש ב-service, בלי /api כפול
    console.log('✅ תשובת העלאה:', res)
    message.value =
      (mode === 'renew' ? 'המלאי חודש בהצלחה! ' : 'המלאי עודכן בהצלחה! ') +
      `(הועבדו ${res.processed} שורות, שגיאות ${res.errors?.length || 0})`
    await loadInventory()
  } catch (err) {
    console.error(err)
    message.value = '❌ שגיאה בהעלאת הקובץ'
  } finally {
    // ניקוי בחירת הקובץ
    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null
    if (input) input.value = ''
    file.value = null
  }
}

/* --- שליפת מלאי --- */
async function loadInventory() {
  try {
    const data = await getInventory({ _page: 1, _limit: 50 })
    console.log('Inventory loaded:', data)
    inventory.value = data
  } catch (e) {
    console.error(e)
  }
}

/* --- הורדת קובץ אקסל --- */
function downloadExcel() {
  if (!inventory.value.length) {
    alert('אין נתונים להורדה')
    return
  }

  const worksheet = XLSX.utils.json_to_sheet(
    inventory.value.map((item) => ({
      ברקוד: item.barcode,
      'שם מוצר': item.name,
      קטגוריה: item.category,
      מחיר: item.price,
      'מחיר מבצע': item.salePrice ?? '-',
      כמות: item.quantity,
      'תאריך תפוגה': item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('he-IL') : '-',
    })),
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'מלאי')
  XLSX.writeFile(workbook, 'מלאי_FreshEnd.xlsx')
}

onMounted(() => loadInventory())
</script>

<style scoped>
/* --- מבנה כללי --- */
.inventory-page {
  direction: rtl;
  padding: 2rem;
  background: linear-gradient(180deg, #f7faf7 0%, #edf7f0 100%);
  min-height: 100vh;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 2rem;
  font-weight: 800;
  color: #1f5131;
  margin-bottom: 1.5rem;
}

.inventory-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
}

@media (max-width: 900px) {
  .inventory-grid {
    grid-template-columns: 1fr;
  }
}

/* --- כרטיסים --- */
.upload-card,
.inventory-card {
  background: white;
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}
.upload-card:hover,
.inventory-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2b6243;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* --- העלאה --- */
.upload-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.upload-btn {
  background-color: #1f5131;
  color: white;
  border: none;
  padding: 0.7rem 1.2rem;
  border-radius: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.3s;
}
.upload-btn:hover {
  background-color: #24733b;
}
.upload-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* --- הודעה לאחר העלאה --- */
.upload-message {
  color: #2b6243;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1rem;
  font-weight: 500;
}

/* --- טבלה --- */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-buttons {
  display: flex;
  gap: 0.6rem;
}

.refresh-btn,
.download-btn {
  background: transparent;
  border: 1.5px solid #a9cbb0;
  color: #2b6243;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  transition: all 0.3s;
}

.refresh-btn:hover,
.download-btn:hover {
  background: #e9f4eb;
  border-color: #6abf69;
  transform: translateY(-2px);
}

/* --- מודל --- */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.modal-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 700;
  color: #1f5131;
  margin-bottom: 0.8rem;
}

.modal-text {
  color: #555;
  margin-bottom: 1.2rem;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn-update,
.btn-renew {
  padding: 0.6rem 1rem;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  transition: all 0.3s;
}

.btn-update {
  background-color: #1f5131;
}
.btn-update:hover {
  background-color: #24733b;
}
.btn-renew {
  background-color: #c0392b;
}
.btn-renew:hover {
  background-color: #e74c3c;
}

/* --- כפתור ביטול --- */
.btn-cancel {
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  justify-content: center;
  background: white;
  border: 2px solid #ccc;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  color: #444;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}
.btn-cancel:hover {
  background: #f5f5f5;
  border-color: #aaa;
  color: #000;
  transform: translateY(-2px);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

/* --- אייקונים --- */
.icon {
  width: 28px;
  height: 28px;
}
.icon-small {
  width: 22px;
  height: 22px;
}
.icon-tiny {
  width: 16px;
  height: 16px;
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* --- כפתור בחירת קובץ --- */
.file-input {
  display: none;
}

.upload-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.2rem;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.95rem;
  color: #1f5131;
  background: #f2f9f3;
  border: 2px dashed #b9d8bf;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-label:hover {
  background: #e5f5e7;
  border-color: #76c48f;
  color: #0f3d21;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(33, 81, 49, 0.1);
}
</style>
