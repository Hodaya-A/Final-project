<template>
  <nav class="navbar">
    <!-- ✅ חלק עם צל רק לקטגוריות -->
    <div class="category-wrapper">
      <div class="category-bar">
        <!-- קטגוריות בלבד -->
        <div
          class="category-item"
          :class="getCategoryClass(cat.name)"
          v-for="cat in categories"
          :key="cat.name"
          @click="toggleCategory(cat.name)"
        >
          <span class="cat-icon">{{ cat.icon }}</span>
          <div class="label">{{ cat.name }}</div>
        </div>
      </div>
    </div>

    <!-- ✅ סל נפרד מחוץ לעטיפת הקטגוריות -->
    <div class="cart-summary" @click="toggleCart">
      <img src="@/assets/icon_cart.png" alt="סל קניות" class="cart-icon" />
      <div class="total">₪{{ totalPrice.toFixed(2) }}</div>
      <span class="cart-badge">{{ totalItems }}</span>
    </div>

    <CartSidebar :isOpen="isCartOpen" @close="closeCart" />
  </nav>
</template>


<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { storeToRefs } from 'pinia'
import CartSidebar from '@/components/CartSidebar.vue'

const router = useRouter()
const cartStore = useCartStore()
const { isCartOpen, totalItems, totalPrice } = storeToRefs(cartStore)

const categories = [
  { name: 'לחם ומאפים טריים', icon: '🍞' },
  { name: 'פארם ותינוקות', icon: '🍼' },
  { name: 'חד פעמי ומטבח', icon: '🍽️' },
  { name: 'אחזקת הבית ובע"ח', icon: '🏠' },
  { name: 'חטיפים ומתוקים', icon: '🍬' },
  { name: 'קטניות ודגנים', icon: '🌾' },
  { name: 'שימורים ובישול', icon: '🥫' },
  { name: 'קפואים', icon: '❄️' },
  { name: 'אורגני ובריאות', icon: '🌿' },
  { name: 'משקאות', icon: '🥤' },
  { name: 'בשר ודגים', icon: '🥩' },
  { name: 'חלב, ביצים וסלטים', icon: '🥚' }
]

function toggleCategory(name: string) {
  router.push({ name: 'home', query: { category: name } })
}

function getCategoryClass(name: string) {
  if (name === 'חלב, ביצים וסלטים') return 'rounded-dairy'
  if (name === 'לחם ומאפים טריים') return 'rounded-bakery'
  return ''
}

function toggleCart() {
  cartStore.isCartOpen = !cartStore.isCartOpen
}

function closeCart() {
  cartStore.isCartOpen = false
}
</script>


<style scoped>
.navbar {
  direction: rtl;
  background-color: #f5f8fc;
  height: 120px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 16px;
}


.category-bar {
  display: flex;
  align-items: center;
  overflow-x: auto;
  height: 100px;
  width: 100%;
  scrollbar-width: none;
  background-color: #f5f8fc;
  /* box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06); צל לשורת הקטגוריות עצמה */
  /* border-radius: 16px; */
}
.category-bar::-webkit-scrollbar {
  display: none;
}

/* קטגוריה רגילה */
.category-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 75px;
  height: 100px;
  background-color: white;
  padding: 0.5rem 0.25rem;
  flex-shrink: 0;
  border-left: 1px solid #eee;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
    /* box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06); צל לשורת הקטגוריות עצמה */
  /* border-radius: 16px; */
}
/* .category-item:first-child {
  border-right: 1px solid #eee;
} */
.category-item:hover {
  background-color: #e6f8e6;
  transform: scale(1.05);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}
.cat-icon {
  font-size: 1.9rem;
  margin-bottom: 4px;
}
.label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #000;
  text-align: center;
  line-height: 1.1;
  white-space: normal;
}
/* .rounded-dairy {
  border-radius: 12px 0 0 12px;
}
.rounded-bakery {
  border-radius: 0 12px 12px 0;
} */

/* כפתור סל קניות */
.cart-summary {
  width: 290px;
  height: 100px;
  background-color: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  margin-left: 5px;
  margin-right: 20px;
}
.cart-summary:hover {
  transform: scale(1.03);
}
.cart-summary .cart-icon {
  width: 38px;
  height: 38px;
}
.cart-summary .total {
  font-size: 1.6rem;
  font-weight: bold;
  color: #1d4320;
}
.cart-summary .cart-badge {
  position: absolute;
  top: 16px;
  /* left: 50px; */
  right: 60px;
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 4px 8px;
  font-size: 0.85rem;
  font-weight: bold;
  z-index: 2;
}
.category-wrapper {
  background-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 0 10px;
  margin-left: 10px;
  margin-inline-end: auto;
  flex-grow: 1;
  overflow: hidden;
  height: 100px;
}

</style>
