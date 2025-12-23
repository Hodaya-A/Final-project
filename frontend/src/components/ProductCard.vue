<template>
  <div class="product-card-wrapper">
    <router-link :to="`/product/${product._id}`" class="product-card">
      <!-- 🖼️ תמונה עם Fallback -->
      <img
        :src="imgSrc"
        :alt="product.name"
        class="product-image"
        loading="lazy"
        @error="onImgError"
      />

      <!-- 🏷️ שם וקטגוריה -->
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="product-category">{{ product.category }}</p>

      <!-- 💰 מחיר רגיל + מחיר מבצע -->
      <p class="product-price">
        <span v-if="product.salePrice" class="discounted">
          ₪{{ product.salePrice.toFixed(2) }}
        </span>
        <span :class="{ original: product.salePrice }"> ₪{{ product.price.toFixed(2) }} </span>
      </p>

      <!-- 🗓️ תאריך תפוגה -->
      <p class="product-expiry">פג תוקף: {{ formattedDate }}</p>
    </router-link>

    <!-- 🛒 כפתור הוספה לסל -->
    <button class="add-btn" @click="addToCart">הוסף לסל</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import type { Product } from '@/stores/products'

const cartStore = useCartStore()

const props = defineProps<{ product: Product }>()
const formattedDate = new Date(props.product.expiryDate || '').toLocaleDateString('he-IL')

// מיפוי קטגוריות לתמונות ברירת מחדל - מערך של תמונות שונות לכל קטגוריה
const categoryImages: Record<string, string[]> = {
  'מוצרי חלב': [
    'https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/SGG26_L_P_48185_1.png',
    'https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/JCY12_L_P_42015_1.png',
    'https://images.openfoodfacts.org/images/products/729/000/000/0001/front_he.3.400.jpg',
    'https://images.openfoodfacts.org/images/products/729/000/000/0002/front_he.3.400.jpg',
  ],
  'לחם ומאפים טריים': [
    'https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/KXY14_L_P_97825_1.png',
    'https://images.openfoodfacts.org/images/products/729/000/000/0010/front_he.3.400.jpg',
    'https://images.openfoodfacts.org/images/products/729/000/000/0011/front_he.3.400.jpg',
  ],
  'ירקות ופירות': [
    'https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/YYK17_L_P_15872_1.png',
    'https://images.openfoodfacts.org/images/products/000/000/000/0100/front_he.3.400.jpg',
    'https://images.openfoodfacts.org/images/products/000/000/000/0101/front_he.3.400.jpg',
  ],
  קפואים: [
    'https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/FBI28_L_P_56845_1.png',
    'https://images.openfoodfacts.org/images/products/729/000/000/0020/front_he.3.400.jpg',
  ],
  'משקאות חמים': [
    'https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/BYR52_L_P_17859_1.png',
    'https://images.openfoodfacts.org/images/products/729/000/000/0030/front_he.3.400.jpg',
  ],
  משקאות: [
    'https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/MYF38_L_P_97412_1.png',
    'https://images.openfoodfacts.org/images/products/729/000/000/0031/front_he.3.400.jpg',
  ],
  'אחזקת הבית': [
    'https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/DFV47_L_P_23678_1.png',
    'https://images.openfoodfacts.org/images/products/729/000/000/0040/front_he.3.400.jpg',
  ],
  'חטיפים ומתוקים': [
    'https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/KOP29_L_P_78945_1.png',
    'https://images.openfoodfacts.org/images/products/729/000/000/0050/front_he.3.400.jpg',
  ],
  'מוצרי יסוד': [
    'https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/JCY12_L_P_42015_1.png',
    'https://images.openfoodfacts.org/images/products/729/000/000/0060/front_he.3.400.jpg',
  ],
}

// פונקציה לבחירת תמונה מתוך מערך בצורה קבועה (לפי hash של שם המוצר)
function getImageFromArray(images: string[], seed: string): string {
  if (images.length === 0) return FALLBACK
  if (images.length === 1) return images[0]
  // יצירת hash פשוט מהשם כדי לבחור באופן קבוע אותו אינדקס
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash = hash & hash
  }
  return images[Math.abs(hash) % images.length]
}

// ✅ אם אין imageUrl – ננסה לפי קטגוריה, אחרת fallback כללי
const FALLBACK = 'https://via.placeholder.com/300x300/e0e0e0/666666?text=No+Image'
const getDefaultImage = () => {
  // בדיקה אם יש תמונה תקפה (לא ריק, לא null, לא undefined)
  if (props.product.imageUrl && props.product.imageUrl.trim()) {
    return props.product.imageUrl
  }
  const category = props.product.category
  if (category && categoryImages[category]) {
    return getImageFromArray(categoryImages[category], props.product.name + props.product._id)
  }
  return FALLBACK
}
const imgSrc = ref<string>(getDefaultImage())

function onImgError() {
  // אם התמונה נכשלה, ננסה את תמונת הקטגוריה
  const category = props.product.category
  if (category && categoryImages[category]) {
    const categoryFallback = getImageFromArray(
      categoryImages[category],
      props.product.name + props.product._id,
    )
    if (categoryFallback && imgSrc.value !== categoryFallback) {
      imgSrc.value = categoryFallback
      return
    }
  }
  if (imgSrc.value !== FALLBACK) {
    imgSrc.value = FALLBACK
  }
}

function addToCart() {
  const category = props.product.category
  let defaultImg = FALLBACK
  if (category && categoryImages[category]) {
    defaultImg = getImageFromArray(categoryImages[category], props.product.name + props.product._id)
  }
  const validImageUrl = props.product.imageUrl?.trim() || defaultImg
  cartStore.addToCart({
    id: props.product._id,
    name: props.product.name,
    price: props.product.salePrice || props.product.price,
    imageUrl: validImageUrl,
  })
}
</script>

<style scoped>
.product-card-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 240px;
}

.product-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  min-height: 360px;
  background: white;
  border: 2px solid var(--border);
  border-radius: 16px;
  padding: 1.25rem;
  text-align: center;
  transition: all 0.3s ease;
  color: inherit;
  text-decoration: none;
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
}

.product-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity 0.3s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.product-card:hover::before {
  opacity: 1;
}

.product-image {
  width: 100%;
  height: 150px;
  object-fit: contain;
  border-radius: 12px;
  margin-bottom: 1rem;
  background: var(--bg-secondary);
  padding: 0.5rem;
  transition: transform 0.2s ease;
}

.product-card:hover .product-image {
  transform: scale(1.03);
}

.product-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--neutral-dark, #1f2937);
  margin: 0.5rem 0;
  line-height: 1.4;
}

.product-category {
  font-size: 0.875rem;
  color: var(--neutral, #6b7280);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.product-price {
  font-size: 1.1rem;
  margin: 0.75rem 0;
  font-weight: 700;
}

.product-price .original {
  text-decoration: line-through;
  color: var(--neutral-light, #9ca3af);
  margin-left: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
}

.product-price .discounted {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.4rem;
  font-weight: 800;
}

.product-expiry {
  font-size: 0.8rem;
  color: var(--neutral, #6b7280);
  margin-bottom: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary, #f9fafb);
  border-radius: 20px;
  display: inline-block;
}

.add-btn {
  margin-top: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
  box-shadow: var(--shadow);
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.add-btn:active {
  transform: translateY(0);
}
</style>
