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

    <!-- קיצור דרך לדאש משלוחנים -->
    <div
      class="courier-shortcut"
      v-if="userStore.isCourier"
      @click="goToCourier"
      title="דאש משלוחנים"
    >
      <div class="courier-text">משלוחים</div>
    </div>

    <!-- ✅ סל קניות -->
    <div class="cart-summary" @click="toggleCart">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 24 24"
        width="40"
        height="40"
        class="cart-icon"
      >
        <path
          d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
        />
      </svg>
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

function goToCourier() {
  router.push('/courier')
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
  background: var(--bg-secondary);
  height: 110px;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: var(--shadow);
  position: sticky;
  top: 70px;
  z-index: 49;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* עטיפת הקטגוריות */
.category-wrapper {
  background: white;
  box-shadow: var(--shadow-sm);
  border-radius: 12px;
  padding: 0 12px;
  margin-left: 10px;
  margin-inline-end: auto;
  flex-grow: 1;
  overflow: hidden;
  height: 90px;
  border: 1px solid var(--border);
}

.category-bar {
  display: flex;
  align-items: center;
  overflow-x: hidden;
  height: 90px;
  width: 100%;
  gap: 0.25rem;
  justify-content: space-between;
}

/* כרטיס קטגוריה */
.category-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 70px;
  height: 80px;
  background: transparent;
  padding: 0.4rem;
  flex-shrink: 1;
  border: 2px solid transparent;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.category-item:hover {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--primary);
  box-shadow: var(--shadow);
}

.active-category {
  background: var(--primary);
  border-color: var(--primary);
  box-shadow: var(--shadow);
}

.active-category .label {
  color: white;
  font-weight: 600;
}

.active-category .cat-icon-img {
  filter: brightness(0) invert(1);
}

.cat-icon-img {
  width: 32px;
  height: 32px;
  margin-bottom: 6px;
  object-fit: contain;
  filter: brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(223deg)
    brightness(97%) contrast(91%);
  transition: filter 0.2s ease;
}

.category-item:hover .cat-icon-img:not(.active-category .cat-icon-img) {
  filter: brightness(0) saturate(100%) invert(32%) sepia(93%) saturate(2352%) hue-rotate(223deg)
    brightness(107%) contrast(101%);
}
.label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
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
  filter: brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(1352%) hue-rotate(223deg)
    brightness(97%) contrast(91%);
  transition: filter 0.2s ease;
}

.store-shortcut:hover .store-icon {
  filter: brightness(0) saturate(100%) invert(32%) sepia(93%) saturate(2352%) hue-rotate(223deg)
    brightness(107%) contrast(101%);
}
.store-text {
  font-weight: 700;
  color: #1d4320;
  white-space: nowrap;
}
/* קיצור דרך לדאש משלוחנים */
.courier-shortcut {
  width: 140px;
  height: 100px;
  background: linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%);
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
  box-shadow: 0 3px 8px rgba(255, 107, 0, 0.25);
  margin-left: 5px;
}

.courier-shortcut:hover {
  transform: scale(1.03);
  box-shadow: 0 6px 14px rgba(255, 107, 0, 0.35);
}

.courier-icon {
  font-size: 2.5rem;
}

.courier-text {
  font-weight: 700;
  color: white;
  font-size: 0.85rem;
}
/* עיצוב לסל */
.cart-summary {
  width: 240px;
  height: 90px;
  background: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  box-shadow: var(--shadow);
  margin-left: 5px;
  margin-right: 20px;
  border: 2px solid var(--border);
}

.cart-summary:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--primary);
}

.cart-summary .cart-icon {
  width: 40px;
  height: 40px;
  color: var(--primary);
  fill: currentColor;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.cart-summary:hover .cart-icon {
  color: var(--primary-dark);
  transform: scale(1.05);
}

.cart-summary .total {
  font-size: 1.75rem;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.cart-summary .cart-badge {
  position: absolute;
  top: 8px;
  right: 75px;
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 4px 8px;
  font-size: 0.85rem;
  font-weight: bold;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
