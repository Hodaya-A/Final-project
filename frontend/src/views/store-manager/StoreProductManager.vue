<template>
  <div class="inventory-page animate-fade-in" v-if="isStoreManager">
    <h1 class="page-title">
      <span class="icon">📦</span>
      ניהול מוצרים לחנות שלך
    </h1>

    <!-- גריד עיקרי -->
    <div class="inventory-grid">
      <!-- תיבת העלאה -->
      <div class="upload-card">
        <h2 class="card-title">
          <span class="icon-small">📤</span>
          העלאת קובץ מלאי
        </h2>

        <div class="upload-box">
          <label class="upload-label">
            <span class="icon-small">⬆️</span>
            בחר קובץ
            <input type="file" @change="onFileChange" accept=".csv,.xlsx" class="file-input" />
          </label>

          <button :disabled="!file" @click="openModal" class="upload-btn">
            <span class="icon-small">📤</span>
            העלאה
          </button>
        </div>

        <p v-if="uploadMessage" class="upload-message">
          <span class="icon-small">✓</span>
          {{ uploadMessage }}
        </p>
      </div>

      <!-- טבלת המלאי -->
      <div class="inventory-card">
        <div class="card-header">
          <h2 class="card-title">
            <span class="icon-small">📃</span>
            רשימת מוצרים
          </h2>

          <div class="header-buttons">
            <button @click="loadProducts" class="refresh-btn">
              <span class="icon-tiny">🔄</span>
              רענן
            </button>

            <button @click="downloadExcel" class="download-btn">
              <span class="icon-tiny">⬇️</span>
              הורד קובץ
            </button>
          </div>
        </div>

        <div v-if="products.length" class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ברקוד</th>
                <th>שם מוצר</th>
                <th>מחיר מקורי</th>
                <th>מחיר מבצע</th>
                <th>כמות</th>
                <th>תוקף</th>
                <th>קטגוריה</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product._id">
                <td>{{ product.barcode || '1008' }}</td>
                <td>{{ product.name }}</td>
                <td>₪{{ product.priceOriginal || '-' }}</td>
                <td>₪{{ product.priceDiscounted || product.price }}</td>
                <td>{{ product.quantity || 0 }}</td>
                <td>{{ formatDate(product.expiryDate) }}</td>
                <td>{{ product.category }}</td>
                <td class="actions">
                  <button @click="openEditModal(product)" class="edit-btn">
                    <span class="icon-tiny">✏️</span>
                  </button>
                  <button @click="deleteProduct(product._id)" class="delete-btn">
                    <span class="icon-tiny">🗑️</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="empty-state">
          <p>אין מוצרים להצגה. העלה קובץ או הוסף מוצר בודד.</p>
        </div>
      </div>
    </div>

    <!-- הוספת מוצר בודד -->
    <div class="single-product-card">
      <h2 class="card-title">
        <span class="icon-small">➕</span>
        הוספת מוצר בודד
      </h2>
      <form @submit.prevent="handleSubmit" class="product-form">
        <label>
          שם מוצר:
          <input v-model="name" required />
        </label>

        <label>
          מחיר מקורי:
          <input v-model.number="priceOriginal" type="number" step="0.01" required />
        </label>

        <label>
          מחיר לאחר הנחה:
          <input v-model.number="priceDiscounted" type="number" step="0.01" required />
        </label>

        <label>
          תאריך תפוגה:
          <input v-model="expiryDate" type="date" required />
        </label>

        <label>
          קטגוריה:
          <input v-model="category" required />
        </label>

        <label>
          כתובת תמונה:
          <input v-model="imageUrl" type="url" />
        </label>

        <button type="submit" class="btn-save">{{ editingId ? '💾 עדכן' : '💾 הוסף' }} מוצר</button>
        <button v-if="editingId" type="button" @click="clearForm" class="btn-cancel-edit">
          ❌ בטל עריכה
        </button>
      </form>
    </div>

    <!-- Modal עריכת מוצר -->
    <transition name="fade-zoom">
      <div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
        <div class="modal edit-modal">
          <h2 class="modal-title">
            <span class="icon-small">✏️</span>
            עריכת מוצר
          </h2>
          <form @submit.prevent="updateProduct" class="edit-form">
            <label>
              שם מוצר:
              <input v-model="editedProduct.name" required />
            </label>

            <label>
              מחיר מקורי:
              <input v-model.number="editedProduct.priceOriginal" type="number" step="0.01" />
            </label>

            <label>
              מחיר מבצע:
              <input v-model.number="editedProduct.priceDiscounted" type="number" step="0.01" />
            </label>

            <label>
              תאריך תפוגה:
              <input v-model="editedProduct.expiryDate" type="date" />
            </label>

            <label>
              קטגוריה:
              <input v-model="editedProduct.category" />
            </label>

            <label>
              כתובת תמונה:
              <input v-model="editedProduct.imageUrl" type="url" />
            </label>

            <div class="modal-actions">
              <button type="submit" class="btn-update">💾 שמור שינויים</button>
              <button type="button" @click="closeEditModal" class="btn-cancel">❌ ביטול</button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Modal לבחירת סוג העלאה -->
    <transition name="fade-zoom">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <h2 class="modal-title">
            <span class="icon-small">⚙️</span>
            בחירת סוג העלאה
          </h2>
          <p class="modal-text">האם לעדכן את המלאי הקיים או לחדש לגמרי?</p>
          <div class="modal-actions">
            <button @click="handleUpload('update')" class="btn-update">
              <span class="icon-small">📝</span>
              עדכון מלאי קיים
            </button>
            <button @click="handleUpload('renew')" class="btn-renew">
              <span class="icon-small">🔄</span>
              חידוש מלאי
            </button>
          </div>
          <button @click="closeModal" class="btn-cancel">
            <span class="icon-tiny">❌</span>
            ביטול
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useUserStore } from '@/stores/user'
import * as XLSX from 'xlsx'

const userStore = useUserStore()
const isStoreManager = computed(() => userStore.role === 'storeManager')
const sellerId = userStore.email

const name = ref('')
const priceOriginal = ref(0)
const priceDiscounted = ref(0)
const expiryDate = ref('')
const category = ref('')
const imageUrl = ref('')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const products = ref<Array<Record<string, any>>>([])
const editingId = ref<string | null>(null)

const file = ref<File | null>(null)
const uploadMessage = ref('')
const showModal = ref(false)
const showEditModal = ref(false)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const editedProduct = ref<Record<string, any>>({})

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

function openEditModal(product: Record<string, any>) {
  editedProduct.value = {
    ...product,
    expiryDate: product.expiryDate ? product.expiryDate.slice(0, 10) : '',
  }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editedProduct.value = {}
}

async function updateProduct() {
  try {
    await axios.put(`/api/inventory/${editedProduct.value._id}`, {
      ...editedProduct.value,
      price: editedProduct.value.priceDiscounted || editedProduct.value.priceOriginal,
      sellerId,
    })
    alert('✅ המוצר עודכן בהצלחה!')
    closeEditModal()
    loadProducts()
  } catch (err) {
    console.error(err)
    alert('❌ שגיאה בעדכון המוצר')
  }
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
    const formData = new FormData()
    formData.append('file', file.value)
    formData.append('mode', mode)

    // צרפי גם מזהה המוכר כדי שפריטים ייקלטו עם owner נכון
    formData.append('sellerId', sellerId)
    // אל תקבעי Content-Type ידנית – axios יוסיף boundary נכון
    const { data } = await axios.post('/api/inventory/upload', formData)

    uploadMessage.value =
      (mode === 'renew' ? 'המלאי חודש בהצלחה! ' : 'המלאי עודכן בהצלחה! ') +
      `(הועבדו ${data.processed} שורות, שגיאות ${data.errors?.length || 0})`
    await loadProducts()
  } catch (err) {
    console.error(err)
    uploadMessage.value = '❌ שגיאה בהעלאת הקובץ'
  } finally {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement | null
    if (input) input.value = ''
    file.value = null
  }
}

function downloadExcel() {
  if (!products.value.length) {
    alert('אין נתונים להורדה')
    return
  }

  const worksheet = XLSX.utils.json_to_sheet(
    products.value.map((item) => ({
      'שם מוצר': item.name,
      'מחיר מקורי': item.priceOriginal || '-',
      'מחיר מבצע': item.priceDiscounted || item.price,
      קטגוריה: item.category || '-',
      'תאריך תפוגה': item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('he-IL') : '-',
      'קישור תמונה': item.imageUrl || '-',
    })),
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'מוצרים')
  XLSX.writeFile(workbook, 'מוצרים_החנות_שלי.xlsx')
}

async function loadProducts() {
  try {
    const { data } = await axios.get(`/api/inventory?sellerId=${sellerId}`)
    products.value = data
  } catch (err) {
    console.error('שגיאה בטעינת מוצרים:', err)
    products.value = []
  }
}

onMounted(() => {
  if (isStoreManager.value) loadProducts()
})

async function handleSubmit() {
  const product = {
    name: name.value,
    priceOriginal: priceOriginal.value,
    priceDiscounted: priceDiscounted.value,
    price: priceDiscounted.value || priceOriginal.value,
    expiryDate: expiryDate.value,
    category: category.value,
    imageUrl: imageUrl.value,
    sellerId,
  }

  try {
    if (editingId.value) {
      await axios.put(`/api/inventory/${editingId.value}`, product)
      alert('✅ המוצר עודכן בהצלחה!')
    } else {
      await axios.post('/api/inventory', product)
      alert('✅ המוצר נוסף בהצלחה!')
    }
    clearForm()
    loadProducts()
  } catch (err) {
    console.error('שגיאה:', err)
    alert('❌ שגיאה בשמירת המוצר')
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fillForm(p: Record<string, any>) {
  editingId.value = p._id
  name.value = p.name
  priceOriginal.value = p.priceOriginal
  priceDiscounted.value = p.priceDiscounted
  expiryDate.value = p.expiryDate.slice(0, 10)
  category.value = p.category
  imageUrl.value = p.imageUrl
}

function clearForm() {
  editingId.value = null
  name.value = ''
  priceOriginal.value = 0
  priceDiscounted.value = 0
  expiryDate.value = ''
  category.value = ''
  imageUrl.value = ''
}

async function deleteProduct(id: string) {
  if (confirm('האם למחוק מוצר זה?')) {
    try {
      await axios.delete(`/api/inventory/${id}`)
      alert('✅ המוצר נמחק בהצלחה!')
      loadProducts()
    } catch (err) {
      console.error('שגיאה במחיקה:', err)
      alert('❌ שגיאה במחיקת המוצר')
    }
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('he-IL')
}
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
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
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
.inventory-card,
.single-product-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1f2937;
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #7c3aed;
}

/* --- העלאה --- */
.upload-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.upload-btn {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
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
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.upload-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.upload-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
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
  border: 2px solid #28a745;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

/* --- טבלה --- */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-buttons {
  display: flex;
  gap: 0.6rem;
}

.refresh-btn,
.download-btn {
  background: white;
  border: 2px solid #e5e7eb;
  color: #1f2937;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  cursor: pointer;
}

.refresh-btn:hover,
.download-btn:hover {
  background: #fafbff;
  border-color: #7c3aed;
  color: #7c3aed;
  transform: translateY(-1px);
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

/* --- טבלה --- */
.table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

th,
td {
  padding: 0.75rem;
  text-align: right;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.9rem;
}

th {
  background: #7c3aed;
  font-weight: 600;
  color: white;
  font-size: 0.85rem;
}

tbody tr {
  transition: background 0.15s ease;
}

tbody tr:nth-child(even) {
  background: #fef3c7;
}

tbody tr:hover {
  background: #fde68a;
}

tbody tr:last-child td {
  border-bottom: none;
}

.actions {
  display: flex;
  gap: 0.3rem;
  justify-content: center;
}

.edit-btn,
.delete-btn {
  padding: 0.4rem 0.6rem;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.edit-btn {
  background: #d1fae5;
  color: #059669;
}

.edit-btn:hover {
  background: #10b981;
  color: white;
  transform: scale(1.1);
}

.delete-btn {
  background: #ffe4e6;
  color: #f87171;
}

.delete-btn:hover {
  background: #f87171;
  color: white;
  transform: scale(1.1);
}

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #9ca3af;
  font-size: 0.95rem;
}

/* --- טופס מוצר בודד --- */
.single-product-card {
  margin-top: 2rem;
}

.single-product-card h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.product-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.2rem;
}

.product-form label {
  display: flex;
  flex-direction: column;
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.product-form input {
  margin-top: 0.4rem;
  padding: 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: white;
}

.product-form input:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08);
}

.btn-save,
.btn-cancel-edit {
  grid-column: 1 / -1;
  padding: 0.8rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.btn-save {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.btn-cancel-edit {
  background: #6b7280;
}

.btn-cancel-edit:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

/* --- Modal --- */
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
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}

.edit-modal {
  max-width: 500px;
}

.modal-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.8rem;
  font-size: 1.3rem;
}

.modal-text {
  color: #6b7280;
  margin-bottom: 1.2rem;
}

.edit-form {
  display: grid;
  gap: 1rem;
  text-align: right;
}

.edit-form label {
  display: flex;
  flex-direction: column;
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.edit-form input {
  margin-top: 0.4rem;
  padding: 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.edit-form input:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08);
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1.2rem;
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
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
  cursor: pointer;
}

.btn-update {
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
}

.btn-update:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.btn-renew {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.btn-renew:hover {
  transform: translateY(-2px);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

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
  font-size: 28px;
}

.icon-small {
  font-size: 20px;
}

.icon-tiny {
  font-size: 16px;
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
  color: #1f2937;
  background: #fafbff;
  border: 3px dashed #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-label:hover {
  background: #f0f4ff;
  border-color: #7c3aed;
  color: #7c3aed;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
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
