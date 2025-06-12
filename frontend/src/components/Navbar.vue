<template>
  <nav class="navbar">
    <!-- ✅ עטיפת קטגוריות עם צל -->
    <div class="category-wrapper">
      <div class="category-bar">
        <div
          class="category-item"
          :class="getCategoryClass(cat.name)"
          v-for="cat in categories"
          :key="cat.name"
          @click="toggleCategory(cat.name)"
        >
          <img :src="`/src/assets/${cat.icon}`" alt="" class="cat-icon-img" />
          <div class="label">{{ cat.name }}</div>
        </div>
      </div>
    </div>

    <!-- ✅ סל קניות -->
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
  { name: 'לחם ומאפים טריים', icon: 'icon_bread.png' },
  { name: 'פארם ותינוקות', icon: 'icon_baby.png' },
  { name: 'חד פעמי ומטבח', icon: 'icon_kitchen.png' },
  { name: 'אחזקת הבית ובע"ח', icon: 'icon_home.png' },
  { name: 'חטיפים ומתוקים', icon: 'icon_metukim.png' },
  { name: 'קטניות ודגנים', icon: 'icon_dganim.png' },
  { name: 'שימורים ובישול', icon: 'icon_shimurim.png' },
  { name: 'קפואים', icon: 'icon_frozen.png' },
  { name: 'אורגני ובריאות', icon: 'icon_organi.png' },
  { name: 'משקאות', icon: 'icon_drink.png' },
  { name: 'בשר ודגים', icon: 'icon_fish.png' },
  { name: 'חלב, ביצים וסלטים', icon: 'icon_milk.png' }
]

function toggleCategory(name: string) {
  router.push({ name: 'home', query: { category: name } })
}

function getCategoryClass(name: string) {
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

/* עטיפת הקטגוריות */
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
  width: 80px;
}

.category-bar {
  display: flex;
  align-items: center;
  overflow-x: auto;
  height: 100px;
  width: 100%;
  /* width: 900px; */
  scrollbar-width: none;
  background-color: #f5f8fc;
}
/* .category-bar::-webkit-scrollbar {
  display: none;
} */

/* כרטיס קטגוריה */
.category-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 70px;
  height: 100px;
  background-color: white;
  padding: 0.5rem 0.25rem;
  flex-shrink: 0;
  border: none;
  transition: all 0.3s ease;
  cursor: pointer;
}
.category-item:hover {
  background-color: #d8dbd8;
  transform: scale(1.05);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
}
.cat-icon-img {
  width: 32px;
  height: 32px;
  margin-bottom: 6px;
  object-fit: contain;
}
.label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #000;
  text-align: center;
  line-height: 1.1;
  white-space: normal;
}

/* עיצוב לסל */
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
  right: 60px;
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 4px 8px;
  font-size: 0.85rem;
  font-weight: bold;
  z-index: 2;
}
</style>
