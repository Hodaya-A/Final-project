<template>
  <div class="inventory-page animate-fade-in" v-if="isStoreManager">
    <h1 class="page-title">ניהול מוצרים לחנות שלך</h1>

    <div class="inventory-grid">
      <div class="upload-card">
        <h2 class="card-title">העלאת קובץ מלאי</h2>

        <div class="upload-box">
          <label class="upload-label">
            בחר קובץ
            <input type="file" @change="onFileChange" accept=".csv,.xlsx" class="file-input" />
          </label>

          <button :disabled="!file" @click="openModal" class="upload-btn-excel">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            העלאה
          </button>
        </div>

        <p v-if="uploadMessage" class="upload-message">
          {{ uploadMessage }}
        </p>
      </div>

      <div class="inventory-card">
        <div class="card-header">
          <h2 class="card-title">רשימת מוצרים</h2>

          <div class="header-buttons">
            <button @click="loadProducts" class="refresh-btn">רענן</button>

            <button @click="downloadExcel" class="download-btn">הורד קובץ</button>

            <button @click="deleteAllInventory" class="delete-all-btn">מחק כל המלאי</button>
          </div>
        </div>

        <div v-if="products.length" class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ברקוד</th>
                <th>שם מוצר</th>
                <th>מותג</th>
                <th>תמונה</th>
                <th>קטגוריה</th>
                <th>מחיר מקורי</th>
                <th>מחיר מבצע</th>
                <th>כמות</th>
                <th>תוקף</th>
                <th>פעולות</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in products" :key="product._id">
                <td>{{ product._id?.slice(-4) || '-' }}</td>
                <td>{{ product.name }}</td>

                <td>
                  <strong>{{ product.brand || '-' }}</strong>
                </td>

                <td class="image-cell">
                  <div
                    v-if="product.imageUrl && isValidImageUrl(product.imageUrl)"
                    class="product-image-preview"
                  >
                    <img :src="product.imageUrl" :alt="product.name" @error="handleImageError" />
                    <span class="image-badge">✓</span>
                  </div>
                  <span v-else class="no-image">אין תמונה</span>
                </td>
                <td>{{ product.category }}</td>

                <td>
                  <span
                    :style="
                      product.salePrice && product.salePrice < product.price
                        ? 'text-decoration: line-through; color: #999;'
                        : ''
                    "
                  >
                    ₪{{ product.price }}
                  </span>
                </td>

                <td>
                  <strong
                    v-if="product.salePrice && product.salePrice < product.price"
                    style="color: #d32f2f; font-size: 1.1em"
                  >
                    ₪{{ product.salePrice }}
                  </strong>
                  <span v-else>-</span>
                </td>

                <td>{{ product.quantity ?? 0 }}</td>
                <td>{{ formatDate(product.expiryDate || '') }}</td>

                <td class="actions">
                  <button @click="openEditModal(product)" class="edit-btn" title="ערוך">
                    <svg
                      class="action-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button @click="deleteProduct(product._id)" class="delete-btn" title="מחק">
                    <svg
                      class="action-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path
                        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                      ></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                  <button
                    @click="openUploadImageModal(product)"
                    class="upload-btn"
                    title="העלה תמונה"
                  >
                    <svg
                      class="action-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </button>
                  <button
                    @click="generateImageForProduct(product)"
                    class="ai-btn"
                    :disabled="generatingImageForId === product._id"
                    title="חפש תמונה עם AI"
                  >
                    <span class="action-icon ai-stars">{{
                      generatingImageForId === product._id ? '⏳' : '✨'
                    }}</span>
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

    <div class="single-product-card">
      <h2 class="card-title">הוספת מוצר בודד</h2>
      <form @submit.prevent="handleSubmit" class="product-form">
        <label>
          שם מוצר:
          <input v-model="name" required placeholder="לדוגמה: חלב טרי" />
        </label>

        <label>
          מותג / חברה:
          <input v-model="brand" required placeholder="לדוגמה: תנובה" />
        </label>

        <label>
          מחיר:
          <input v-model.number="price" type="number" step="0.01" required />
        </label>

        <label>
          מחיר מבצע:
          <input v-model.number="salePrice" type="number" step="0.01" />
        </label>

        <label>
          כמות במלאי:
          <input v-model.number="quantity" type="number" min="0" required />
        </label>

        <label>
          תאריך תפוגה:
          <input v-model="expiryDate" type="date" required />
        </label>

        <label>
          קטגוריה:
          <select v-model="category" required>
            <option value="" disabled selected>בחר קטגוריה...</option>
            <option v-for="cat in categories" :key="cat" :value="cat">
              {{ cat }}
            </option>
          </select>
        </label>

        <div class="image-upload-section">
          <label class="section-label">תמונת מוצר:</label>

          <div v-if="!imageUrl" class="image-buttons-group">
            <label class="btn-upload-file">
              <input
                type="file"
                @change="onSingleProductImageChange"
                accept="image/*"
                style="display: none"
              />
              <svg
                class="btn-icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              העלה תמונה מהמחשב
            </label>

            <button
              type="button"
              @click="generateAIImageForSingleProduct"
              class="btn-ai-image"
              :disabled="!name || generatingImage"
            >
              <span class="btn-icon">{{ generatingImage ? '⏳' : '✨' }}</span>
              {{ generatingImage ? 'מחפש...' : 'חפש תמונה באמצעות AI' }}
            </button>
          </div>

          <div v-if="imageUrl" class="current-image-preview">
            <div class="image-with-checkmark">
              <img :src="imageUrl" alt="תמונת מוצר" />
              <span class="checkmark-badge">✓</span>
            </div>
            <button type="button" @click="changeImage" class="btn-change-image">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              שנה תמונה
            </button>
          </div>
        </div>

        <button type="submit" class="btn-save">{{ editingId ? 'עדכן' : 'הוסף' }} מוצר</button>
        <button v-if="editingId" type="button" @click="clearForm" class="btn-cancel-edit">
          בטל עריכה
        </button>
      </form>
    </div>

    <transition name="fade-zoom">
      <div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
        <div class="modal edit-modal">
          <h2 class="modal-title">עריכת מוצר</h2>
          <form @submit.prevent="updateProduct" class="edit-form">
            <label>
              שם מוצר:
              <input v-model="editedProduct.name" required />
            </label>

            <label>
              מותג:
              <input v-model="editedProduct.brand" />
            </label>

            <label>
              מחיר:
              <input v-model.number="editedProduct.price" type="number" step="0.01" />
            </label>

            <label>
              מחיר מבצע:
              <input v-model.number="editedProduct.salePrice" type="number" step="0.01" />
            </label>

            <label>
              כמות במלאי:
              <input v-model.number="editedProduct.quantity" type="number" />
            </label>

            <label>
              תאריך תפוגה:
              <input v-model="editedProduct.expiryDate" type="date" />
            </label>

            <label>
              קטגוריה:
              <select v-model="editedProduct.category">
                <option v-for="cat in categories" :key="cat" :value="cat">
                  {{ cat }}
                </option>
              </select>
            </label>

            <label>
              כתובת תמונה:
              <div class="image-input-group">
                <input
                  v-model="editedProduct.imageUrl"
                  type="url"
                  placeholder="הדבק URL של תמונה"
                />
                <button
                  type="button"
                  @click="generateAIImageForEdit"
                  class="btn-ai-image btn-ai-small"
                  :disabled="!editedProduct.name || generatingImage"
                >
                  {{ generatingImage ? '🎨' : '✨ AI' }}
                </button>
              </div>
            </label>

            <div class="modal-actions">
              <button type="submit" class="btn-update">שמור שינויים</button>
              <button type="button" @click="closeEditModal" class="btn-cancel">ביטול</button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <transition name="fade-zoom">
      <div v-if="showImagePreviewModal" class="modal-backdrop" @click.self="closeImagePreviewModal">
        <div class="modal preview-modal">
          <h2 class="modal-title">אישור תמונה</h2>
          <p class="modal-text">
            {{ previewImageSource === 'ai' ? 'תמונה שנוצרה באמצעות AI' : 'תמונה שהועלתה' }}
          </p>

          <div class="preview-image-container">
            <img :src="previewImageUrl" alt="תצוגה מקדימה" class="preview-image" />
          </div>

          <p class="modal-question">האם לשמור את התמונה הזו?</p>

          <div class="modal-actions">
            <button type="button" @click="confirmImageAndSave" class="btn-confirm">
              ✓ אישור ושמירה
            </button>
            <button type="button" @click="closeImagePreviewModal" class="btn-cancel">
              ✗ בטל ונסה שוב
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade-zoom">
      <div
        v-if="showImageSelectionModal"
        class="modal-backdrop"
        @click.self="showImageSelectionModal = false"
      >
        <div class="modal image-selection-modal">
          <h2 class="modal-title">בחרי תמונה עבור: {{ selectedProduct?.name }}</h2>

          <div v-if="searchingImages" class="loading-message">מחפש תמונות...</div>

          <div v-else class="images-grid">
            <div
              v-for="(image, index) in searchedImages"
              :key="index"
              class="image-card"
              @click="selectSearchedImage(image.url)"
            >
              <img :src="image.thumbnail" :alt="image.title" />
              <p class="image-source">{{ image.title }}</p>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showImageSelectionModal = false" class="btn-cancel">
              ✗ ביטול
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade-zoom">
      <div v-if="showUploadImageModal" class="modal-backdrop" @click.self="closeUploadImageModal">
        <div class="modal">
          <h2 class="modal-title">העלאת תמונה</h2>
          <p class="modal-text">בחר תמונה עבור: {{ selectedProductForImage?.name }}</p>

          <div class="upload-image-section">
            <input
              type="file"
              @change="onImageFileChange"
              accept="image/*"
              ref="imageFileInput"
              class="file-input"
              id="image-upload-input"
            />
            <label for="image-upload-input" class="upload-label-image"> ⬆ בחר תמונה </label>
            <p v-if="imageFileToUpload" class="file-selected">✅ {{ imageFileToUpload.name }}</p>
          </div>

          <div class="modal-actions">
            <button @click="uploadImageFile" class="btn-update" :disabled="!imageFileToUpload">
              העלה תמונה
            </button>
            <button @click="closeUploadImageModal" class="btn-cancel">ביטול</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade-zoom">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <h2 class="modal-title">בחירת סוג העלאה</h2>
          <p class="modal-text">האם לעדכן את המלאי הקיים או לחדש לגמרי?</p>

          <div class="modal-actions">
            <button @click="handleUpload('update')" class="btn-update">עדכון מלאי קיים</button>
            <button @click="handleUpload('renew')" class="btn-renew">חידוש מלאי</button>
          </div>
          <button @click="closeModal" class="btn-cancel">ביטול</button>
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
import type { Product } from '@/stores/products'

const userStore = useUserStore()
const isStoreManager = computed(() => userStore.role === 'storeManager')
const sellerId = userStore.email

// משתנים לטופס הוספה/עריכה
const name = ref('')
const brand = ref('') // ✅ הוספתי משתנה למותג
const price = ref(0)
const salePrice = ref(0)
const quantity = ref(0)
const expiryDate = ref('')
const category = ref('')
const imageUrl = ref('')

// רשימת הקטגוריות הקבועה
const categories = [
  'לחם ומאפים טריים',
  'פארם ותינוקות',
  'חד פעמי ומטבח',
  'אחזקת הבית ובעלי חיים',
  'חטיפים ומתוקים',
  'קטניות ודגנים',
  'שימורים ובישול',
  'קפואים',
  'אורגני ובריאות',
  'משקאות',
  'בשר ודגים',
  'חלב, ביצים וסלטים',
]

const products = ref<Product[]>([])
const editingId = ref<string | null>(null)

const file = ref<File | null>(null)
const uploadMessage = ref('')
const generatingImage = ref(false)
const useAIForImages = ref(true)
const generatingImageForId = ref<string | null>(null)
const showUploadImageModal = ref(false)
const selectedProductForImage = ref<Product | null>(null)
const imageFileToUpload = ref<File | null>(null)
const showModal = ref(false)
const showEditModal = ref(false)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const editedProduct = ref<Record<string, any>>({})

const showImageSelectionModal = ref(false)
const searchedImages = ref<SearchedImage[]>([])
const selectedProduct = ref<Product | null>(null)
const searchingImages = ref(false)

const uploadingImageForSingleProduct = ref(false)
const singleProductImageFile = ref<File | null>(null)
const showImagePreviewModal = ref(false)
const previewImageUrl = ref('')
const previewImageSource = ref<'upload' | 'ai'>('upload')

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

function changeImage() {
  imageUrl.value = ''
  singleProductImageFile.value = null
}

async function generateAIImageForSingleProduct() {
  if (!name.value) {
    alert('אנא הזן שם מוצר קודם')
    return
  }

  selectedProduct.value = {
    _id: '',
    name: name.value,
    price: price.value,
    salePrice: salePrice.value,
    quantity: quantity.value,
    category: category.value,
    brand: brand.value, // הוספת מותג לאובייקט הזמני
    expiryDate: expiryDate.value,
    imageUrl: imageUrl.value,
    shopId: '',
    updatedAt: '',
  }
  searchingImages.value = true
  showImageSelectionModal.value = true

  try {
    const { data } = await axios.post('/api/images/search-images', {
      productName: name.value,
    })

    if (data.ok && data.images?.length) {
      searchedImages.value = data.images
    } else {
      alert('❌ לא נמצאו תמונות')
      showImageSelectionModal.value = false
    }
  } catch (err) {
    console.error(err)
    alert('❌ שגיאה בחיפוש תמונות')
    showImageSelectionModal.value = false
  } finally {
    searchingImages.value = false
  }
}

function onSingleProductImageChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  singleProductImageFile.value = file
  uploadingImageForSingleProduct.value = true

  const formData = new FormData()
  formData.append('image', file)

  axios
    .post('/api/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(({ data }) => {
      if (data.success && data.imageUrl) {
        previewImageUrl.value = data.imageUrl
        previewImageSource.value = 'upload'
        showImagePreviewModal.value = true
      }
    })
    .catch((err) => {
      console.error(err)
      alert('❌ שגיאה בהעלאת התמונה')
    })
    .finally(() => {
      uploadingImageForSingleProduct.value = false
    })
}

function confirmImageAndSave() {
  imageUrl.value = previewImageUrl.value
  showImagePreviewModal.value = false
  alert(
    `✅ התמונה ${previewImageSource.value === 'ai' ? 'נוצרה' : 'הועלתה'} בהצלחה! כעת תוכל לשמור את המוצר.`,
  )
}

function closeImagePreviewModal() {
  showImagePreviewModal.value = false
  previewImageUrl.value = ''
  previewImageSource.value = 'upload'
  singleProductImageFile.value = null
}

async function generateAIImageForEdit() {
  if (!editedProduct.value.name) {
    alert('אנא הזן שם מוצר קודם')
    return
  }

  generatingImage.value = true

  try {
    const { data } = await axios.post('/api/images/generate-ai', {
      productName: editedProduct.value.name,
      category: editedProduct.value.category || undefined,
    })

    if (data.ok && data.imageUrl) {
      editedProduct.value.imageUrl = data.imageUrl
      if (data.method !== 'placeholder') {
        alert('✅ תמונה נוצרה בהצלחה!')
      }
    }
  } catch (err) {
    console.error(err)
    alert('❌ שגיאה ביצירת תמונה')
  } finally {
    generatingImage.value = false
  }
}

function openUploadImageModal(product: Product) {
  selectedProductForImage.value = product
  showUploadImageModal.value = true
  imageFileToUpload.value = null
}

function closeUploadImageModal() {
  showUploadImageModal.value = false
  selectedProductForImage.value = null
  imageFileToUpload.value = null
}

function onImageFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  imageFileToUpload.value = target.files?.[0] || null
}

async function uploadImageFile() {
  if (!imageFileToUpload.value || !selectedProductForImage.value) {
    alert('❌ אנא בחר קובץ תמונה')
    return
  }

  try {
    const formData = new FormData()
    formData.append('image', imageFileToUpload.value)

    const { data } = await axios.post('/api/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    if (data.success && data.imageUrl) {
      await axios.put(`/api/inventory/${selectedProductForImage.value._id}`, {
        imageUrl: data.imageUrl,
      })

      alert('✅ התמונה הועלתה בהצלחה!')
      closeUploadImageModal()
      await loadProducts()
    }
  } catch (err) {
    console.error(err)
    alert('❌ שגיאה בהעלאת התמונה')
  }
}

async function generateImageForProduct(product: Product) {
  selectedProduct.value = product
  searchingImages.value = true
  showImageSelectionModal.value = true

  try {
    const { data } = await axios.post('/api/images/search-images', {
      productName: product.name,
    })

    if (data.ok && data.images?.length) {
      searchedImages.value = data.images
    } else {
      alert('❌ לא נמצאו תמונות')
      showImageSelectionModal.value = false
    }
  } catch (err) {
    console.error(err)
    alert('❌ שגיאה בחיפוש תמונות')
    showImageSelectionModal.value = false
  } finally {
    searchingImages.value = false
  }
}

async function selectSearchedImage(selectedImageUrl: string) {
  if (!selectedProduct.value) return

  try {
    if (selectedProduct.value._id) {
      console.log('עדכון תמונה למוצר:', selectedProduct.value._id, 'URL:', selectedImageUrl)
      const response = await axios.put(`/api/inventory/${selectedProduct.value._id}`, {
        imageUrl: selectedImageUrl,
        sellerId: sellerId,
      })
      console.log('תגובה מהשרת:', response.data)

      showImageSelectionModal.value = false
      searchedImages.value = []
      selectedProduct.value = null

      await loadProducts()

      alert('✅ התמונה נשמרה בהצלחה!')
    } else {
      imageUrl.value = selectedImageUrl
      alert('✅ תמונה נבחרה בהצלחה!')

      showImageSelectionModal.value = false
      searchedImages.value = []
      selectedProduct.value = null
    }
  } catch (err) {
    console.error('שגיאה בשמירת התמונה:', err)
    alert('❌ שגיאה בשמירת התמונה')
  }
}

function openEditModal(product: Product) {
  editedProduct.value = { ...product }
  editingId.value = product._id
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editedProduct.value = {}
}

async function updateProduct() {
  try {
    console.log('עדכון מוצר:', editedProduct.value._id, 'נתונים:', editedProduct.value)
    const response = await axios.put(`/api/inventory/${editedProduct.value._id}`, {
      ...editedProduct.value,
      price: editedProduct.value.salePrice || editedProduct.value.price,
      sellerId,
    })
    console.log('תגובה מהשרת:', response.data)
    alert('✅ המוצר עודכן בהצלחה!')
    closeEditModal()
    loadProducts()
  } catch (err) {
    console.error('שגיאה בעדכון מוצר:', err)
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
    formData.append('useAI', useAIForImages.value.toString())

    formData.append('shopId', userStore.storeId || userStore.uid || '')
    formData.append('sellerId', sellerId)

    formData.append('shopName', userStore.storeName || '')
    formData.append('shopCity', userStore.city || '')
    formData.append('shopStreet', userStore.street || '')
    formData.append('shopNumber', userStore.houseNumber || '')

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
    products.value.map((item: Product) => ({
      'שם מוצר': item.name,
      מותג: item.brand || '-', // הוספה לאקסל
      מחיר: item.price,
      'מחיר מבצע': item.salePrice || '-',
      קטגוריה: item.category || '-',
      כמות: item.quantity || 0,
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
    console.log('🔄 טוען מוצרים מהשרת...')
    const { data } = await axios.get(`/api/inventory?sellerId=${encodeURIComponent(sellerId)}`)
    products.value = [...data]
    console.log(`✅ נטענו ${products.value.length} מוצרים`)
  } catch (err) {
    console.error('שגיאה בטעינת מוצרים:', err)
    products.value = []
  }
}

async function deleteAllInventory() {
  const confirmDelete = confirm(
    'האם את בטוחה למחוק את כל המלאי? פעולה זו תמחק את כל המוצרים שלך ולא ניתן לשחזר אותם!',
  )
  if (!confirmDelete) return

  try {
    await axios.delete(`/api/inventory/all?sellerId=${encodeURIComponent(sellerId)}`)
    alert('✅ כל המלאי נמחק בהצלחה!')
    await loadProducts()
  } catch (err) {
    console.error('שגיאה במחיקת המלאי:', err)
    alert('❌ שגיאה במחיקת המלאי')
  }
}

onMounted(() => {
  if (isStoreManager.value) loadProducts()
})

async function handleSubmit() {
  const product = {
    name: name.value,
    brand: brand.value, // ✅ הוספת המותג לאובייקט
    price: price.value,
    salePrice: salePrice.value,
    quantity: quantity.value,
    expiryDate: expiryDate.value,
    category: category.value,
    imageUrl: imageUrl.value,
    shopId: userStore.storeId || userStore.uid,
    sellerId,
  }

  try {
    if (editingId.value) {
      await axios.put(`/api/inventory/${editingId.value}`, product)
      alert('✅ המוצר עודכן בהצלחה!')
    } else {
      await axios.post('/api/products', product)
      alert('✅ המוצר נוסף בהצלחה!')
    }
    clearForm()
    loadProducts()
  } catch (err) {
    console.error('שגיאה:', err)
    alert('❌ שגיאה בשמירת המוצר')
  }
}

function clearForm() {
  editingId.value = null
  name.value = ''
  brand.value = '' // איפוס המותג
  price.value = 0
  salePrice.value = 0
  quantity.value = 0
  expiryDate.value = ''
  category.value = ''
  imageUrl.value = ''
}

async function deleteProduct(id: string) {
  if (confirm('האם למחוק מוצר זה?')) {
    try {
      await axios.delete(`/api/inventory/${id}?sellerId=${encodeURIComponent(sellerId)}`)
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

function isValidImageUrl(url: string): boolean {
  if (!url) return false
  if (url.startsWith('/uploads/')) return true
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return (
      url.includes('.jpg') ||
      url.includes('.jpeg') ||
      url.includes('.png') ||
      url.includes('.gif') ||
      url.includes('.webp')
    )
  }
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  if (img.parentElement) {
    img.parentElement.innerHTML = '<span class="no-image">אין תמונה</span>'
  }
}

type SearchedImage = {
  url: string
  thumbnail: string
  title: string
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

.upload-btn-excel {
  background: white;
  color: #7c3aed;
  border: 2px solid #7c3aed;
  padding: 0.85rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  transition: all 0.3s ease;
  cursor: pointer;
  font-size: 1rem;
}

.upload-btn-excel svg {
  stroke-width: 2.5;
}

.upload-btn-excel:hover:not(:disabled) {
  background: #f3e8ff;
  border-color: #6d28d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(124, 58, 237, 0.3);
}

.upload-btn-excel:disabled {
  background: #f9fafb;
  color: #9ca3af;
  border-color: #e5e7eb;
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
  border: 2px solid #8b5cf6;
  color: #8b5cf6;
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  transition: all 0.3s ease;
  cursor: pointer;
}

.refresh-btn:hover,
.download-btn:hover {
  background: #f3e8ff;
  border-color: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(124, 58, 237, 0.2);
}

.delete-all-btn {
  padding: 0.5rem 1rem;
  background: white;
  color: #8b5cf6;
  border: 2px solid #8b5cf6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.delete-all-btn:hover {
  background: #f3e8ff;
  border-color: #7c3aed;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
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
  background: #a78bfa;
  font-weight: 600;
  color: white;
  font-size: 0.85rem;
}

tbody tr {
  transition: background 0.15s ease;
}

tbody tr:nth-child(even) {
  background: #f3e8ff;
}

tbody tr:hover {
  background: #e9d5ff;
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
.delete-btn,
.upload-btn,
.ai-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  background: #7c3aed;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
}

.action-icon {
  color: white;
  width: 20px;
  height: 20px;
  stroke-width: 2.5;
}

.action-icon.ai-stars {
  font-size: 1.3rem;
  color: white;
}

.edit-btn:hover,
.delete-btn:hover,
.upload-btn:hover:not(:disabled),
.ai-btn:hover:not(:disabled) {
  background: #6d28d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.5);
}

.ai-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #9ca3af;
  box-shadow: none;
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

.product-form input,
.product-form select {
  margin-top: 0.4rem;
  padding: 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: white;
}

.product-form input:focus,
.product-form select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.08);
}

.btn-save {
  grid-column: 1 / -1;
  padding: 0.9rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #7c3aed;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
}

.btn-save:hover {
  background: #6d28d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(124, 58, 237, 0.5);
}

.btn-cancel-edit {
  grid-column: 1 / -1;
  padding: 0.9rem;
  border: 2px solid #7c3aed;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  color: #7c3aed;
}

.btn-cancel-edit:hover {
  background: #f3e8ff;
  border-color: #6d28d9;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.2);
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

.edit-form input,
.edit-form select {
  margin-top: 0.4rem;
  padding: 0.7rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.edit-form input:focus,
.edit-form select:focus {
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
  padding: 0.85rem 1.4rem;
  border-radius: 10px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
  font-size: 1rem;
}

.btn-update {
  background: #7c3aed;
  color: white;
}

.btn-update:hover:not(:disabled) {
  background: #6d28d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(124, 58, 237, 0.5);
}

.btn-update:disabled {
  background: #9ca3af;
  color: white;
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.btn-renew {
  background: #7c3aed;
  color: white;
}

.btn-renew:hover {
  background: #6d28d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(124, 58, 237, 0.5);
}

.btn-cancel {
  margin-top: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
  background: white;
  border: 2px solid #7c3aed;
  border-radius: 10px;
  padding: 0.75rem 1.4rem;
  color: #7c3aed;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-cancel:hover {
  background: #f3e8ff;
  border-color: #6d28d9;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.2);
}

/* --- אייקונים --- */
.icon {
  font-size: 28px;
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

/* --- כפתור יצירת תמונה באמצעות AI --- */
.image-input-group {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.4rem;
}

.image-input-group input {
  flex: 1;
  margin-top: 0 !important;
}

.btn-ai-image {
  padding: 0.7rem 1rem;
  border-radius: 8px;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  color: white;
  border: none;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

.btn-ai-image:hover:not(:disabled) {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(139, 92, 246, 0.5);
}

.btn-ai-image:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #d1d5db;
}

.btn-ai-small {
  padding: 0.5rem 0.8rem;
  font-size: 0.85rem;
  min-width: 60px;
}

.hint {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.8rem;
  color: #6b7280;
  font-style: italic;
}

/* --- אופציית AI במודל --- */
.ai-option {
  margin: 1.5rem 0;
  padding: 1rem;
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  border-radius: 10px;
  border: 2px solid #c084fc;
}

.ai-checkbox {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  cursor: pointer;
  font-weight: 600;
  color: #6b21a8;
  font-size: 1rem;
}

.ai-checkbox input[type='checkbox'] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #7c3aed;
}

.ai-checkbox span {
  flex: 1;
}

.ai-hint {
  display: block;
  margin-top: 0.5rem;
  margin-right: 2rem;
  font-size: 0.85rem;
  color: #7c3aed;
  font-style: italic;
}

/* --- כפתורי פעולה בטבלה --- */
.ai-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f3f4f6;
  border-color: #d1d5db;
}

/* --- מודל העלאת תמונה --- */
.file-selected {
  color: #10b981;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.upload-image-section {
  text-align: center;
  padding: 1.5rem;
}

.upload-label-image {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background: white;
  color: #8b5cf6;
  border: 2px solid #8b5cf6;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-label-image:hover {
  background: #f3e8ff;
  border-color: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(139, 92, 246, 0.2);
}

/* --- סגנון לחלק העלאת תמונה במוצר בודד --- */
.image-upload-section {
  margin: 1rem 0;
  padding: 1rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 10px;
  border: 2px dashed #9ca3af;
}

.section-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.image-buttons-group {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-upload-file,
.btn-ai-image {
  flex: 1;
  min-width: 200px;
  padding: 0.9rem 1.3rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  font-size: 0.95rem;
}

.btn-upload-file:hover,
.btn-ai-image:hover:not(:disabled) {
  background: #6d28d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(124, 58, 237, 0.5);
}

.btn-ai-image:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  background: #9ca3af;
  box-shadow: none;
}

.btn-icon {
  color: white;
  width: 18px;
  height: 18px;
  stroke-width: 2.5;
}

.current-image-preview {
  margin-top: 1rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.image-with-checkmark {
  position: relative;
  display: inline-block;
}

.image-with-checkmark img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.checkmark-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.btn-change-image {
  padding: 0.7rem 1.3rem;
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-change-image svg {
  width: 18px;
  height: 18px;
  stroke-width: 2.5;
}

.btn-change-image:hover {
  background: #6d28d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(124, 58, 237, 0.5);
}

/* --- מודל תצוגה מקדימה --- */
.preview-modal {
  max-width: 600px;
}

.preview-image-container {
  margin: 1.5rem 0;
  text-align: center;
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-question {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin: 1rem 0;
}

.btn-confirm {
  background: #7c3aed;
  color: white;
  border: none;
  padding: 0.85rem 1.6rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
  font-size: 1rem;
}

.btn-confirm:hover {
  background: #6d28d9;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(124, 58, 237, 0.5);
}

/* ⭐ חדש: modal לבחירת תמונות */
.image-selection-modal {
  max-width: 900px;
  max-height: 80vh;
  overflow-y: auto;
}

.loading-message {
  text-align: center;
  padding: 2rem;
  font-size: 1.2rem;
  color: #8b5cf6;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
}

.image-card {
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: #f9fafb;
}

.image-card:hover {
  border-color: #8b5cf6;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.image-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.image-source {
  padding: 0.5rem;
  font-size: 0.8rem;
  color: #6b7280;
  text-align: center;
  background: white;
}

/* --- תצוגת תמונות בטבלה --- */
.image-cell {
  text-align: center;
  padding: 0.5rem;
}

.product-image-preview {
  position: relative;
  display: inline-block;
}

.product-image-preview img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e9d5ff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.no-image {
  color: #9ca3af;
  font-size: 0.85rem;
  font-style: italic;
}
</style>
