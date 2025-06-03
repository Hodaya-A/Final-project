<template>
  <div class="cart-view">
    <h1>סל הקניות שלי</h1>

    <!-- ריקון סל -->
    <div class="cart-title-row" v-if="cartStore.items.length > 0 && !confirmingClear">
      <button class="clear-btn" @click="confirmingClear = true">
        <span class="icon">🗑️</span> רוקן סל
      </button>
    </div>

    <!-- אישור ריקון -->
    <div v-if="confirmingClear" class="confirm-area">
      <p>האם למחוק את כל הפריטים בסל?</p>
      <button class="confirm-clear" @click="clearCart">כן, מחיקת הסל</button>
      <button class="cancel-clear" @click="confirmingClear = false">לא, חזרה לסל שלי</button>
    </div>

    <!-- תוכן הסל -->
    <div v-else>
      <div v-if="cartStore.items.length === 0" class="empty">
        הסל שלך ריק 🛒
      </div>

      <div v-else>
        <table>
          <thead>
            <tr>
              <th>מוצר</th>
              <th>כמות</th>
              <th>מחיר ליח'</th>
              <th>סה"כ</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in cartStore.items" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ item.quantity }}</td>
              <td>₪{{ item.price.toFixed(2) }}</td>
              <td>₪{{ (item.price * item.quantity).toFixed(2) }}</td>
              <td>
                <button @click="cartStore.increaseQuantity(item.id)">+</button>
                <button @click="cartStore.decreaseQuantity(item.id)">-</button>
                <button @click="cartStore.removeFromCart(item.id)">הסר</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="summary">
          <p>סה"כ פריטים: <strong>{{ totalCount }}</strong></p>
          <p>מחיר מוצרים: <strong>₪{{ totalPrice.toFixed(2) }}</strong></p>
          <p>מחיר משלוח: <strong>₪{{ shippingPrice.toFixed(2) }}</strong></p>
          <p class="total-sum">לתשלום כולל: <strong>₪{{ finalTotal.toFixed(2) }}</strong></p>
          <button class="checkout-btn" @click="goToThankYou">לתשלום</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useRouter } from 'vue-router'
import { saveOrder } from '@/services/orders'
import { useUserStore } from '@/stores/user'
import { sendOrderConfirmation } from '@/services/email'





const userStore = useUserStore()

async function goToThankYou() {
  const email = userStore.email
  const items = cartStore.items
  const total = finalTotal.value

  try {
    // שמירת ההזמנה במסד הנתונים
    await saveOrder(email, items, total)

    // שליחת מייל אישור
    console.log('🔔 שולחת מייל ל:', userStore.email)

    await sendOrderConfirmation(email, total, items)

    // איפוס סל והפניה לדף תודה
    cartStore.items = []
    router.push('/thank-you')

  } catch (err) {
    console.error('שגיאה בהזמנה:', err)

    alert(
      'אירעה שגיאה בעת ביצוע ההזמנה או שליחת המייל. \n\n' +
      'אם את/ה משתמש/ת בחוסם פרסומות, יש להשבית אותו זמנית ולנסות שוב.'
    )
  }
}



const router = useRouter()
const cartStore = useCartStore()
const confirmingClear = ref(false)
const shippingPrice = 29.9



function clearCart() {
  cartStore.items = []
  confirmingClear.value = false
}

const totalPrice = computed(() =>
  cartStore.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
)

const totalCount = computed(() =>
  cartStore.items.reduce((sum, item) => sum + item.quantity, 0)
)

const finalTotal = computed(() => {
  return cartStore.items.length === 0 ? 0 : totalPrice.value + shippingPrice
})
</script>

<style scoped>
.cart-view {
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.empty {
  text-align: center;
  font-size: 1.2rem;
  padding: 2rem;
  color: #888;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

th, td {
  padding: 0.75rem;
  text-align: center;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f5f5f5;
  color: #444;
}

button {
  margin: 0 0.25rem;
  padding: 0.3rem 0.6rem;
  border: none;
  border-radius: 5px;
  background-color: #ff9800;
  color: white;
  cursor: pointer;
  font-weight: bold;
  font-size: 0.95rem;
}

button:hover {
  background-color: #f57c00;
}

.summary {
  text-align: right;
  font-size: 1.05rem;
  font-weight: bold;
  padding-top: 1rem;
  border-top: 1px solid #eee;
  color: #333;
}

.total-sum {
  font-size: 1.3rem;
  margin-top: 1rem;
  color: #0052cc;
}

.checkout-btn {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.8rem 1.5rem;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 1rem;
}

.checkout-btn:hover {
  background-color: #0056b3;
}

.cart-title-row {
  display: flex;
  justify-content: flex-end;
  padding-bottom: 1rem;
}

.clear-btn {
  background: none;
  border: 1px solid #007bff;
  color: #007bff;
  padding: 0.4rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.clear-btn:hover {
  background-color: #e6f0ff;
  border-color: #0056b3;
  color: #0056b3;
}

.confirm-area {
  text-align: center;
  padding: 2rem;
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
</style>
