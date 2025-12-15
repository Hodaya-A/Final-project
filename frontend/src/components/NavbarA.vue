<template>
  <nav class="navbar">
    <!-- ✅ עטיפת קטגוריות עם צל -->
    <div class="category-wrapper">
      <div class="category-bar">
        <div
          v-for="cat in categories"
          :key="cat.name"
          :class="['category-item', getCategoryClass(cat.name)]"
          @click="toggleCategory(cat.name)"
        >
          <img :src="`/src/assets/${cat.icon}`" alt="" class="cat-icon-img" />
          <div class="label">{{ cat.name }}</div>
        </div>
      </div>
    </div>
    <!-- ✅ קיצור דרך למנהל חנות -->
    <div
      class="store-shortcut"
      v-if="userStore.role === 'storeManager'"
      @click="goToStore"
      title="לוח מנהל החנות"
    >
      <img src="@/assets/icon_store.png" alt="החנות שלי" class="store-icon" />
      <div class="store-text">החנות שלי</div>
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
import { useUserStore } from '@/stores/user'
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { storeToRefs } from 'pinia'
import CartSidebar from '@/components/CartSidebar.vue'

const router = useRouter()
const route = useRoute()

const cartStore = useCartStore()
const { isCartOpen, totalItems, totalPrice } = storeToRefs(cartStore)

const userStore = useUserStore()

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
  { name: 'חלב, ביצים וסלטים', icon: 'icon_milk.png' },
]

const activeCategory = computed(() => (route.query.category as string) || '')

function getCategoryClass(name: string) {
  return activeCategory.value === name ? 'active-category' : ''
}

function toggleCategory(name: string) {
  router.push({ name: 'home', query: { category: name } })
}

function goToStore() {
  router.push('/store')
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
  scrollbar-width: none;
  background-color: #f5f8fc;
}

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
.active-category {
  background-color: #e8f5e9;
  box-shadow: 0 3px 10px rgba(39, 174, 96, 0.25);
  transform: scale(1.04);
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

/* קיצור דרך למנהל חנות */
.store-shortcut {
  width: 140px;
  height: 100px;
  background-color: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  margin-left: 5px;
}
.store-shortcut:hover {
  transform: scale(1.03);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
}
.store-icon {
  width: 34px;
  height: 34px;
  object-fit: contain;
}
.store-text {
  font-weight: 700;
  color: #1d4320;
  white-space: nowrap;
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
