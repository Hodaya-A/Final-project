<template>
  <transition name="slide-cart">
    <aside v-if="isCartOpen" class="cart-sidebar">
      <div class="cart-header">
        <h3>🛒 סל הקניות</h3>
        <button class="close-btn" @click="closeCart">✖</button>
      </div>

      <div class="cart-items" v-if="items.length">
        <div v-for="item in items" :key="item.id" class="cart-item">
          <img :src="item.imageUrl" alt="" class="item-image" />
          <div class="item-details">
            <p class="item-name">{{ item.name }}</p>
            <p class="item-info">₪{{ item.price.toFixed(2) }} × {{ item.quantity }}</p>
            <div class="quantity-controls">
              <button @click="decreaseQuantity(item.id)">➖</button>
              <span>{{ item.quantity }}</span>
              <button @click="increaseQuantity(item.id)">➕</button>
            </div>
          </div>
        </div>
        <button class="clear-cart-btn" @click="confirmClearCart">🗑️ רוקן סל</button>
      </div>

      <div v-else class="empty-cart">
        הסל ריק.
        <button class="go-back-btn" @click="closeCart">⬅ חזרה</button>
      </div>

      <div class="cart-footer" v-if="items.length">
        <p class="total">סה"כ לתשלום: ₪{{ totalPrice.toFixed(2) }}</p>
        <button class="checkout-btn" @click="goToCheckout">לתשלום</button>
      </div>
    </aside>
  </transition>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'

const cartStore = useCartStore()
const { items, totalPrice, isCartOpen } = storeToRefs(cartStore)
const { closeCart } = cartStore
const router = useRouter()

const increaseQuantity = (id: string) => cartStore.increaseQuantity(id)
const decreaseQuantity = (id: string) => cartStore.decreaseQuantity(id)

const confirmClearCart = () => {
  if (confirm('האם אתה בטוח שברצונך לרוקן את הסל?')) {
    cartStore.clearCart()
  }
}

const goToCheckout = () => {
  router.push('/checkout')
  closeCart()
}
</script>

<style scoped>
/* אותו עיצוב כמו קודם... */
.cart-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 300px;
  height: 100vh;
  background: #fff;
  border-right: 1px solid #ccc;
  padding: 1rem;
  z-index: 2000;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
}
/* ... שאר הסטייל נשאר זהה */
</style>


<style scoped>
.cart-sidebar {
  width: 300px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #ccc;
  padding: 1rem;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: transform 0.3s ease;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.item-image {
  width: 50px;
  height: 50px;
  object-fit: cover;
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: bold;
  margin: 0;
}

.item-info {
  color: #555;
  font-size: 0.9rem;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.3rem;
}

.quantity-controls button {
  background-color: #eee;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.clear-cart-btn {
  margin-top: 1rem;
  background-color: #ff4d4d;
  color: white;
  border: none;
  padding: 0.5rem;
  width: 100%;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}

.clear-cart-btn:hover {
  background-color: #cc0000;
}

.empty-cart {
  text-align: center;
  color: #888;
  margin-top: 2rem;
}

.go-back-btn {
  margin-top: 1rem;
  background-color: #0f571f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}

.cart-footer {
  margin-top: 1.5rem;
  border-top: 1px solid #ccc;
  padding-top: 1rem;
}

.total {
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.checkout-btn {
  width: 100%;
  background-color: #0f571f;
  color: white;
  border: none;
  padding: 0.75rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
}

.checkout-btn:hover {
  background-color: #0c4619;
}

.slide-cart-enter-active,
.slide-cart-leave-active {
  transition: transform 0.3s ease;
}
.slide-cart-enter-from,
.slide-cart-leave-to {
  transform: translateX(-100%);
}
</style>
