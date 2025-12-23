<template>
  <transition name="slide-cart">
    <aside v-if="isCartOpen" class="cart-sidebar">
      <!-- כפתור סגירה -->
      <button class="close-btn" @click="closeCart" title="סגור סל קניות">×</button>

      <!-- סיכום סל עליון -->
      <div class="cart-summary-top" v-if="items.length">
        <div class="summary-content">
          <div class="cart-icon-wrapper">
            <svg
              class="cart-icon"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span class="cart-badge">{{ items.length }}</span>
          </div>
          <div class="price-display">
            <span class="currency">₪</span>
            <span class="amount">{{ totalPrice.toFixed(2) }}</span>
          </div>
        </div>
        <button class="clear-cart-btn" @click="confirmClearCart">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"
            />
          </svg>
          רוקן סל
        </button>
      </div>

      <!-- רשימת מוצרים -->
      <div class="cart-items" v-if="items.length">
        <div v-for="item in items" :key="item.id" class="cart-item">
          <img :src="item.imageUrl" alt="" class="item-image" />
          <div class="item-info">
            <p class="item-name">{{ item.name }}</p>
            <div class="item-price-row">
              <span class="currency">₪</span>
              <span class="price">{{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
          </div>
          <div class="item-actions">
            <button class="qty-btn minus" @click="decreaseQuantity(item.id)" title="הפחת כמות">
              −
            </button>
            <span class="qty-display">{{ item.quantity }}</span>
            <button class="qty-btn plus" @click="increaseQuantity(item.id)" title="הוסף כמות">
              +
            </button>
          </div>
        </div>
      </div>

      <!-- סל ריק -->
      <div v-else class="empty-cart">
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <p>הסל ריק</p>
        <button class="go-back-btn" @click="closeCart">חזרה לקניות</button>
      </div>

      <!-- כפתור תשלום -->
      <div class="cart-footer" v-if="items.length">
        <button class="checkout-btn" @click="goToCheckout">
          <span class="btn-text">לתשלום</span>
          <div class="btn-price">
            <span class="currency">₪</span>
            <span class="amount">{{ totalPrice.toFixed(2) }}</span>
          </div>
          <svg
            class="btn-arrow"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
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
  width: 380px;
  height: 100vh;
  background: #f8f9fa;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
  padding: 0;
  overflow-y: auto;
  z-index: 2000;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

/* כפתור סגירה */
.close-btn {
  position: absolute;
  top: 1.2rem;
  right: 1.2rem;
  background: white;
  border: 2px solid var(--primary);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  transition: all 0.2s;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
  font-size: 2rem;
  font-weight: 300;
  line-height: 1;
}

.close-btn:hover {
  background: var(--primary);
  color: white;
  transform: rotate(90deg) scale(1.05);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* סיכום סל עליון */
.cart-summary-top {
  background: white;
  padding: 1.5rem;
  margin: 1rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4rem;
}

.summary-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cart-icon-wrapper {
  position: relative;
}

.cart-icon {
  color: var(--primary);
  stroke-width: 2;
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #e53e3e;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.price-display {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.price-display .currency {
  color: var(--primary);
  font-size: 1rem;
  font-weight: 600;
}

.price-display .amount {
  color: var(--primary);
  font-size: 1.8rem;
  font-weight: bold;
}

/* כפתור חוקן סל */
.clear-cart-btn {
  background: #e8f0fe;
  color: var(--primary);
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
}

.clear-cart-btn:hover {
  background: #d2e3fc;
}

/* רשימת מוצרים */
.cart-items {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0 1rem 1rem;
  overflow-y: auto;
}

.cart-item {
  background: white;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: all 0.2s;
  width: 100%;
}

.cart-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.item-image {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: 10px;
  flex-shrink: 0;
  border: 2px solid #f0f0f0;
  background: white;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.item-name {
  font-weight: 600;
  margin: 0;
  font-size: 0.95rem;
  color: #2d3748;
  line-height: 1.3;
  overflow: visible;
  white-space: normal;
  word-wrap: break-word;
}

.item-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
}

.item-price-row .currency {
  color: var(--primary);
  font-size: 0.7rem;
  font-weight: 600;
}

.item-price-row .price {
  color: var(--primary);
  font-size: 1rem;
  font-weight: bold;
}

/* בקרת כמות ומחיקה */
.item-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.qty-btn {
  background: white;
  border: 2px solid var(--primary);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  transition: all 0.2s;
  font-weight: bold;
  font-size: 1.4rem;
  line-height: 1;
}

.qty-btn:hover {
  background: var(--primary);
  color: white;
  transform: scale(1.1);
}

.qty-display {
  font-weight: 700;
  color: #2d3748;
  min-width: 32px;
  text-align: center;
  font-size: 1.2rem;
  padding: 0 0.3rem;
}

.remove-btn {
  background: white;
  border: 2px solid #e53e3e;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e53e3e;
  transition: all 0.2s;
  margin-right: 0.2rem;
  font-weight: bold;
  font-size: 1.6rem;
  line-height: 1;
}

.remove-btn:hover {
  background: #e53e3e;
  color: white;
  transform: scale(1.1);
}

/* סל ריק */
.empty-cart {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #a0aec0;
  padding: 3rem 2rem;
}

.empty-cart svg {
  opacity: 0.3;
  margin-bottom: 1rem;
}

.empty-cart p {
  font-size: 1.1rem;
  margin: 1rem 0;
  color: #718096;
}

.go-back-btn {
  margin-top: 1rem;
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}

.go-back-btn:hover {
  transform: scale(1.05);
}

/* כפתור תשלום */
.cart-footer {
  padding: 1rem;
  background: #f8f9fa;
}

.checkout-btn {
  width: 100%;
  background: var(--gradient-primary);
  color: white;
  border: none;
  padding: 1.2rem 1.5rem;
  font-weight: bold;
  border-radius: 16px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.checkout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.btn-text {
  flex: 1;
  text-align: center;
  font-size: 1.2rem;
}

.btn-price {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
}

.btn-price .currency {
  font-size: 0.9rem;
}

.btn-price .amount {
  font-size: 1.3rem;
  font-weight: bold;
}

.btn-arrow {
  flex-shrink: 0;
}

/* אנימציית כניסה */
.slide-cart-enter-active,
.slide-cart-leave-active {
  transition: transform 0.3s ease;
}

.slide-cart-enter-from {
  transform: translateX(-100%);
}

.slide-cart-leave-to {
  transform: translateX(-100%);
}
</style>
