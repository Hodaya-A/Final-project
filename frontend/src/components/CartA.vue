<template>
  <div class="cart-wrapper">
    <!-- בלוק עליון -->
    <div class="cart-summary">
      <span class="price">₪ {{ totalPrice.toFixed(2) }}</span>
      <div class="cart-icon">
        <span class="badge">{{ totalItems }}</span>
      </div>
    </div>
    <div class="cart-title-row">
      <button class="clear-btn" @click="confirmingClear = true">רוקן סל</button>
    </div>

    <div class="cart-items">
      <!-- אם במצב אישור -->
      <div v-if="confirmingClear" class="confirm-area">
        <p>האם למחוק את כל הפריטים בסל?</p>
        <button class="confirm-clear" @click="clearCart">כן, מחיקת הסל</button>
        <button class="cancel-clear" @click="confirmingClear = false">לא, חזרה לסל שלי</button>
      </div>

      <!-- אחרת, מציגים מוצרים -->
      <div v-else>
        <div v-for="item in items" :key="item.id" class="item">
          <img :src="item.imageUrl" alt="product" class="item-img" />
          <div class="item-info">
            <div class="top">
              <div class="name">{{ item.name }}</div>
              <div class="badge-discount">בהנחה</div>
            </div>
            <div class="bottom">
              <div class="price">₪ {{ item.price.toFixed(2) }}</div>
              <div class="quantity">{{ item.quantity }} יח'</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- סיכום תחתון -->
    <div class="cart-footer">
      <div class="shipping">מחיר משלוח <span>₪ 29.90</span></div>
      <div class="total-footer">
        ₪ {{ (totalPrice + 29.9).toFixed(2) }}
        <button class="checkout-btn">לתשלום</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { ref } from 'vue'

const confirmingClear = ref(false)

function clearCart() {
  cartStore.items = []
  confirmingClear.value = false
}

const cartStore = useCartStore()
const { items, totalItems, totalPrice } = storeToRefs(cartStore)
</script>

<style scoped>
.cart-wrapper {
  width: 100%;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
  overflow: hidden;
}

/* בלוק עליון */
.cart-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.2rem;
  border-bottom: 1px solid #ddd;
  font-size: 1.3rem;
  font-weight: bold;
  color: #111112;
  border-radius: 12px;
  margin-bottom: 3px;
}

.cart-icon {
  position: relative;
  font-size: 1.5rem;
}

.badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background: red;
  color: white;
  font-size: 0.7rem;
  border-radius: 50%;
  padding: 2px 6px;
}

/* כותרת */
.cart-title {
  text-align: right;
  font-size: 0.9rem;
  padding: 0.5rem 1.2rem;
  color: #1c75bc;
  border-bottom: 1px solid #eee;
}

/* רשימת מוצרים */
.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0.5rem;
}

.item {
  display: flex;
  gap: 0.8rem;
  padding: 0.6rem 0.4rem;
  border-bottom: 1px solid #f0f0f0;
}

.item-img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.item-info .top {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.item-info .bottom {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #333;
}

.badge-discount {
  background-color: #dc3545;
  color: white;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 12px;
}

/* תחתית הסל */
.cart-footer {
  border-top: 1px solid #ddd;
  padding: 0.8rem 1rem;
  background-color: #ffffff;
}

.shipping {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 0.6rem;
}

.total-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.3rem;
  font-weight: bold;
  color: #0052cc;
}

.checkout-btn {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
}

.checkout-btn:hover {
  background-color: #0056b3;
}

.cart-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1.2rem;
  color: #1c75bc;
  font-weight: bold;
  font-size: 0.95rem;
  border-bottom: 1px solid #eee;
}

.clear-btn {
  background: none;
  color: #007bff;
  font-size: 0.85rem;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.confirm-area {
  padding: 2rem;
  text-align: center;
  font-size: 1rem;
  color: #333;
}

.confirm-clear {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  margin: 1rem 0;
  cursor: pointer;
  font-size: 1rem;
}

.cancel-clear {
  background: none;
  border: none;
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background-color: #ffffff;
  color: #007bff;
  border: 1px solid #007bff;
  border-radius: 12px;
  padding: 0.4rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;
  margin: 0 auto;
  text-decoration: none; /* 💥 זה מוריד את הקו התחתון */
}

.clear-btn:hover {
  background-color: #e6f0ff;
  transform: scale(1.03);
  color: #0056b3;
  border-color: #0056b3;
  text-decoration: none; /* לוודא שגם ב-hover אין קו */
}

.clear-btn .icon {
  font-size: 1rem;
}
</style>
