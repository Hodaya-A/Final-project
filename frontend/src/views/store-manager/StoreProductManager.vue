<template>
  <div class="store-products" v-if="isStoreManager">
    <h1 class="page-title">📦 ניהול מוצרים לחנות שלך</h1>

    <!-- גריד עיקרי -->
    <div class="inventory-grid">
      <!-- תיבת העלאה -->
      <div class="upload-card">
        <h2 class="card-title">📤 העלאת קובץ מלאי</h2>

        <div class="upload-box">
          <label class="upload-label">
            בחר קובץ CSV/XLSX
            <input type="file" @change="onFileChange" accept=".csv,.xlsx" class="file-input" />
          </label>

          <button :disabled="!file" @click="openModal" class="upload-btn">העלאה</button>
        </div>

        <p v-if="uploadMessage" class="upload-message">{{ uploadMessage }}</p>
      </div>

      <!-- טבלת המלאי -->
      <div class="inventory-card">
        <div class="card-header">
          <h2 class="card-title">📃 רשימת מוצרים</h2>

          <div class="header-buttons">
            <button @click="loadProducts" class="refresh-btn">🔄 רענן</button>
            <button @click="downloadExcel" class="download-btn">⬇️ הורד קובץ</button>
          </div>
        </div>

        <div v-if="products.length" class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>שם</th>
                <th>מחיר מקורי</th>
                <th>מחיר מבצע</th>
                <th>תפוגה</th>
                <th>קטגוריה</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product._id">
                <td>{{ product.name }}</td>
                <td>₪{{ product.priceOriginal || '-' }}</td>
                <td>₪{{ product.priceDiscounted || product.price }}</td>
                <td>{{ formatDate(product.expiryDate) }}</td>
                <td>{{ product.category }}</td>
                <td>
                  <button @click="fillForm(product)" class="btn-edit">✏️ ערוך</button>
                  <button @click="deleteProduct(product._id)" class="btn-delete">🗑️ מחק</button>
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
      <h2>➕ הוספת מוצר בודד</h2>
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

    <!-- Modal לבחירת סוג העלאה -->
    <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <h2>בחירת סוג העלאה</h2>
        <p>האם לעדכן את המלאי הקיים או לחדש לגמרי?</p>
        <div class="modal-actions">
          <button @click="handleUpload('update')" class="btn-update">📝 עדכון מלאי קיים</button>
          <button @click="handleUpload('renew')" class="btn-renew">
            🔄 חידוש מלאי (מחיקת הכל)
          </button>
        </div>
        <button @click="closeModal" class="btn-cancel">❌ ביטול</button>
      </div>
    </div>
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
  const { data } = await axios.get(`/api/products?sellerId=${sellerId}`)
  products.value = data
}

onMounted(() => {
  if (isStoreManager.value) loadProducts()
})

async function handleSubmit() {
  const product = {
    name: name.value,
    priceOriginal: priceOriginal.value,
    priceDiscounted: priceDiscounted.value,
    expiryDate: expiryDate.value,
    category: category.value,
    imageUrl: imageUrl.value,
    sellerId,
  }

  try {
    if (editingId.value) {
      await axios.put(`/api/products/${editingId.value}`, product)
    } else {
      await axios.post('/api/products', product)
    }
    clearForm()
    loadProducts()
  } catch {
    alert('שגיאה בשמירה')
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
    await axios.delete(`/api/products/${id}`)
    loadProducts()
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('he-IL')
}
</script>

<style scoped>
/* --- מבנה כללי --- */
.store-products {
  direction: rtl;
  padding: 2rem;
  background: linear-gradient(180deg, #f7faf7 0%, #edf7f0 100%);
  min-height: 100vh;
}

.page-title {
  font-size: 2rem;
  font-weight: 800;
  color: #1f5131;
  margin-bottom: 1.5rem;
}

.inventory-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  margin-bottom: 2rem;
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
  border-radius: 1.5rem;
  padding: 1.5rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.upload-card:hover,
.inventory-card:hover,
.single-product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #24452b;
  margin-bottom: 1rem;
}

/* --- העלאת קובץ --- */
.upload-box {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.upload-label {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.upload-label:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
}

.file-input {
  display: none;
}

.upload-btn {
  padding: 0.75rem 1.5rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.upload-btn:hover {
  background: #1976d2;
  transform: translateY(-2px);
}

.upload-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.upload-message {
  margin-top: 1rem;
  padding: 0.8rem;
  background: #e8f5e9;
  border-radius: 8px;
  font-weight: bold;
  color: #2e7d32;
}

/* --- כותרת כרטיס --- */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
}

.refresh-btn,
.download-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn {
  background: #2196f3;
  color: white;
}

.refresh-btn:hover {
  background: #1976d2;
}

.download-btn {
  background: #4caf50;
  color: white;
}

.download-btn:hover {
  background: #45a049;
}

/* --- טבלה --- */
.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

th,
td {
  padding: 1rem;
  text-align: right;
  border-bottom: 1px solid #e0e0e0;
}

th {
  background: #f5f5f5;
  font-weight: 700;
  color: #24452b;
}

tbody tr:hover {
  background: #f9f9f9;
}

.btn-edit,
.btn-delete {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  margin-left: 0.3rem;
  transition: all 0.2s ease;
}

.btn-edit {
  background: #2196f3;
  color: white;
}

.btn-edit:hover {
  background: #1976d2;
}

.btn-delete {
  background: #f44336;
  color: white;
}

.btn-delete:hover {
  background: #d32f2f;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

/* --- טופס מוצר בודד --- */
.single-product-card {
  margin-top: 2rem;
}

.single-product-card h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #24452b;
  margin-bottom: 1rem;
}

.product-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.product-form label {
  display: flex;
  flex-direction: column;
  font-weight: 600;
  color: #333;
}

.product-form input {
  margin-top: 0.3rem;
  padding: 0.7rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.product-form input:focus {
  outline: none;
  border-color: #4caf50;
}

.btn-save,
.btn-cancel-edit {
  grid-column: 1 / -1;
  padding: 0.9rem;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-save {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
}

.btn-cancel-edit {
  background: #9e9e9e;
  color: white;
}

.btn-cancel-edit:hover {
  background: #757575;
}

/* --- Modal --- */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal h2 {
  margin-bottom: 1rem;
  color: #24452b;
}

.modal p {
  margin-bottom: 1.5rem;
  color: #666;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.btn-update,
.btn-renew {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  color: white;
  transition: all 0.3s ease;
}

.btn-update {
  background: #2196f3;
}

.btn-update:hover {
  background: #1976d2;
}

.btn-renew {
  background: #ff9800;
}

.btn-renew:hover {
  background: #f57c00;
}

.btn-cancel {
  width: 100%;
  padding: 0.8rem;
  background: #9e9e9e;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  background: #757575;
}
</style>
