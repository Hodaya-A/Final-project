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
  closeCart() // סגור את הסל הצדדי
  router.push('/cart') // נווט לדף סל המלא
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
  position: fixed;
  top: 0;
  left: 0;
  width: 320px;
  height: 100vh;
  background: #ffffff;
  border-inline-end: 1px solid #d4d4d4;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.08);
  padding: 1.2rem;
  overflow-y: auto;
  z-index: 2000;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* כותרת עליונה */
.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
}

.cart-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #24452b;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.3rem;
  color: #444;
  cursor: pointer;
  transition: transform 0.2s;
}

.close-btn:hover {
  transform: scale(1.2);
}

/* מוצרים */
.cart-items {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.item-image {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.item-details {
  flex: 1;
}

.item-name {
  font-weight: bold;
  margin: 0;
  font-size: 0.95rem;
  color: #333;
}

.item-info {
  font-size: 0.85rem;
  color: #666;
  margin-top: 2px;
}

.quantity-controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.quantity-controls button {
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  color: #333;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.quantity-controls button:hover {
  background-color: #e0e0e0;
}

/* כפתור ריקון */
.clear-cart-btn {
  background-color: #a22c2c;
  color: white;
  border: none;
  padding: 0.5rem;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 0.5rem;
}

.clear-cart-btn:hover {
  background-color: #881f1f;
}

/* ריק */
.empty-cart {
  text-align: center;
  font-size: 1rem;
  color: #888;
  margin-top: 2rem;
}

/* כפתור חזרה */
.go-back-btn {
  margin-top: 1rem;
  background-color: #24452b;
  color: white;
  border: none;
  padding: 0.5rem 1.1rem;
  font-weight: bold;
  border-radius: 6px;
  cursor: pointer;
}

.go-back-btn:hover {
  background-color: #1b3521;
}

/* תחתית */
.cart-footer {
  border-top: 1px solid #ccc;
  padding-top: 1rem;
  margin-top: 1rem;
}

.total {
  font-size: 1.05rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #333;
}

/* כפתור תשלום */
.checkout-btn {
  width: 100%;
  background-color: #24452b;
  color: white;
  border: none;
  padding: 0.75rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.checkout-btn:hover {
  background-color: #1b3521;
}
</style>
