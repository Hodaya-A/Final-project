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
  console.log('🎯 handleUpload called with mode:', mode)
  console.log('📁 file.value:', file.value)

  if (!file.value) {
    console.warn('⚠️ No file selected')
    return
  }

  showModal.value = false

  if (mode === 'renew') {
    const confirmDelete = confirm(
      'האם את בטוחה שברצונך לחדש את המלאי? פעולה זו תמחק את כל המוצרים הקיימים!',
    )
    if (!confirmDelete) {
      console.log('❌ User cancelled renew operation')
      return
    }
  }

  try {
    console.log('📤 Calling uploadInventory...')
    const res = await uploadInventory(file.value, mode) // ← שימוש ב-service, בלי /api כפול
    console.log('✅ תשובת העלאה:', res)
    message.value =
      (mode === 'renew' ? 'המלאי חודש בהצלחה! ' : 'המלאי עודכן בהצלחה! ') +
      `(הועבדו ${res.processed} שורות, שגיאות ${res.errors?.length || 0})`
    await loadInventory()
  } catch (err) {
    const error = err as { response?: { data?: { error?: string } }; message?: string }
    console.error('❌ Error in handleUpload:', error)
    console.error('Error message:', error.message)
    console.error('Error response:', error.response)
    message.value =
      '❌ שגיאה בהעלאת הקובץ: ' + (error.response?.data?.error || error.message || 'שגיאה לא ידועה')
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
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 2rem;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 2rem;
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
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--neutral-dark);
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary);
}

/* --- העלאה --- */
.upload-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.upload-btn {
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 0.75rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.3s ease;
  box-shadow: var(--shadow);
}

.upload-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.upload-btn:disabled {
  background: var(--neutral-light);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* --- הודעה לאחר העלאה --- */
.upload-message {
  color: #155724;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 1rem;
  font-weight: 500;
  padding: 0.75rem;
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-radius: 8px;
  border: 2px solid var(--success);
  box-shadow: var(--shadow-sm);
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
  background: white;
  border: 2px solid var(--border);
  color: var(--neutral-dark);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-sm);
}

.refresh-btn:hover,
.download-btn:hover {
  background: linear-gradient(135deg, #fafbff 0%, #f5f7ff 100%);
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow) 8f9fa;
  border-color: #3498db;
  color: #3498db;
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
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--border);
}

.modal-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 700;
  color: var(--neutral-dark);
  margin-bottom: 0.8rem;
}

.modal-text {
  color: var(--neutral);
  margin-bottom: 1.2rem;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-update,
.btn-renew {
  padding: 0.75rem 1.2rem;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  transition: all 0.3s ease;
  box-shadow: var(--shadow);
}

.btn-update {
  background: var(--gradient-primary);
}

.btn-update:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-renew {
  background: var(--gradient-secondary);
}

.btn-renew:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-renew:hover {
  background-color: #c0392b;
}

/* --- כפתור ביטול --- */
.btn-cancel {
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  justify-content: center;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 0.6rem 1.2rem;
  color: #555;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f8f9fa;
  border-color: #aaa;
  color: #2c3e50;
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
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--neutral-dark);
  background: linear-gradient(135deg, #fafbff 0%, #f5f7ff 100%);
  border: 3px dashed var(--border);
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-label:hover {
  background: linear-gradient(135deg, #f0f4ff 0%, #e8ecff 100%);
  border-color: var(--primary);
  color: var(--primary);
  box-shadow: var(--shadow);
}

/* --- אנימציה --- */
.fade-zoom-enter-active,
.fade-zoom-leave-active {
  transition: all 0.2s;
}

.fade-zoom-enter-from,
.fade-zoom-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
