<template>
  <nav class="navbar">
    <div class="category-bar">
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

      <!-- סל קניות מעוצב -->
      <div class="cart-summary" @click="toggleCart">
       
        <img src="@/assets/icon_cart.png" alt="סל קניות" class="cart-icon" />
         <div class="total">₪{{ totalPrice.toFixed(2) }}</div>
        <span class="cart-badge">{{ totalItems }}</span>
      </div>
    </div>

    <!-- סל הקניות -->
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
  { name: 'חלב, ביצים וסלטים', icon: '🥚' },
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
  background-color: #ddf8d5b9;
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  /* overflow-x: auto; */
  height: 130px;
}

.category-bar {
  display: flex;
  flex-wrap: nowrap;
  gap: 0;
  overflow-x: auto;
  scrollbar-width: none;
  height: 110px;
}
.category-bar::-webkit-scrollbar {
  display: none;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 75px;
  height: 110px;
  margin-top: 5px;
  padding: 0.6rem;
  background-color: white;
  border: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s;
}
.category-item:hover {
  background-color: #e6f8e6; /* רקע ירוק בהיר */
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}
.cat-icon {
  font-size: 2rem;
  margin-bottom: 2px;
}
.label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #000;
  text-align: center;
  line-height: 1.2;
  white-space: normal;
}
.rounded-dairy {
  border-radius: 12px 0 0 12px;
}
.rounded-bakery {
  border-radius: 0 0 12px 0;
}

/* סל קניות מעוצב */
.cart-summary {
  width: 260px;
  height: 110px;
  margin-right: 28px;
  background-color: white;
  border-radius: 16px;
  margin-top: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
  margin-left: 10px;
}
.cart-summary:hover {
  transform: scale(1.03);
}
.cart-summary .cart-icon {
  width: 40px;
  height: 40px;
}
.cart-summary .total {
  font-size: 1.8rem;
  font-weight: bold;
  color: #114727;
}
.cart-summary .cart-badge {
  position: absolute;
  top: 22px;
  right: 50px;
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 4px 8px;
  font-size: 0.85rem;
  font-weight: bold;
}


</style>
