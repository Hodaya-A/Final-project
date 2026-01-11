<template>
  <div class="cart-view">
    <h1>סל הקניות שלי</h1>

    <div class="cart-title-row" v-if="cartStore.items.length > 0 && !confirmingClear">
      <button class="clear-btn" @click="confirmingClear = true">רוקן סל</button>
    </div>

    <div v-if="confirmingClear" class="confirm-area">
      <p>האם למחוק את כל הפריטים בסל?</p>
      <button class="confirm-clear" @click="clearCart">כן, מחיקת הסל</button>
      <button class="cancel-clear" @click="confirmingClear = false">לא, חזרה לסל שלי</button>
    </div>

    <div v-else>
      <div v-if="cartStore.items.length === 0" class="empty">הסל שלך ריק</div>

      <div v-else>
        <!-- התראה על חנויות מרובות -->
        <div v-if="hasMultipleStores" class="multi-store-warning">
          <strong>שים לב:</strong> בסל שלך יש מוצרים מ-{{ storeCount }} חנויות שונות.
          <br />
          ההזמנה תפוצל ל-{{ storeCount }} הזמנות נפרדות, כל אחת תאושר על ידי מנהל החנות המתאים.
        </div>

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
          <p>
            סה"כ פריטים: <strong>{{ totalCount }}</strong>
          </p>
          <p>
            מחיר מוצרים: <strong>₪{{ totalPrice.toFixed(2) }}</strong>
          </p>

          <!-- בחירת משלוח/איסוף -->
          <div class="delivery-choice">
            <label class="delivery-option">
              <input type="radio" v-model="deliveryMethod" value="delivery" />
              <span>משלוח עד הבית (+₪{{ shippingPrice.toFixed(2) }})</span>
            </label>
            <label class="delivery-option">
              <input type="radio" v-model="deliveryMethod" value="pickup" />
              <span>איסוף עצמי מהחנות (חינם)</span>
            </label>
          </div>

          <p v-if="deliveryMethod === 'delivery'">
            מחיר משלוח: <strong>₪{{ shippingPrice.toFixed(2) }}</strong>
          </p>
          <p v-else>איסוף עצמי: <strong>חינם</strong></p>
          <p class="total-sum">
            לתשלום כולל: <strong>₪{{ finalTotal.toFixed(2) }}</strong>
          </p>
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

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const confirmingClear = ref(false)
const shippingPrice = 29.9
const deliveryMethod = ref<'delivery' | 'pickup'>('delivery')

async function goToThankYou() {
  console.log('[goToThankYou] Function called!')
  const userId = userStore.uid
  const email = userStore.email
  const items = cartStore.items

  try {
    if (!userId) {
      console.error('[goToThankYou] No userId!')
      throw new Error('No userId available for order')
    }
    if (!email) console.warn('[goToThankYou] No email provided')

    // פיצול הזמנות לפי חנות
    const ordersByStore = itemsByStore.value
    const storeIds = Object.keys(ordersByStore)

    console.log(
      `[goToThankYou] Creating ${storeIds.length} separate orders for ${storeIds.length} stores`,
    )

    // יצירת הזמנה נפרדת לכל חנות
    const orderPromises = storeIds.map(async (shopId) => {
      const storeItems = ordersByStore[shopId]
      const storeTotal =
        storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0) +
        (deliveryMethod.value === 'delivery' ? shippingPrice : 0)
      const sellerId = storeItems[0].sellerId || ''

      console.log(
        `[goToThankYou] Saving order for store ${shopId}, items: ${storeItems.length}, total: ${storeTotal}, delivery: ${deliveryMethod.value}`,
      )

      return await saveOrder(
        userId,
        email,
        shopId,
        sellerId,
        storeItems,
        storeTotal,
        deliveryMethod.value,
      )
    })

    // המתן לכל ההזמנות
    const results = await Promise.all(orderPromises)
    console.log(`[goToThankYou] All ${results.length} orders saved successfully`)

    console.log('[goToThankYou] Clearing cart and redirecting...')
    cartStore.clearCart()
    router.push('/thank-you')
    console.log('[goToThankYou] Redirected to thank-you')
  } catch (err) {
    console.error('[goToThankYou] Error:', err)
    alert('אירעה שגיאה בעת ביצוע ההזמנה או שליחת המייל.')
  }
}

function clearCart() {
  cartStore.items = []
  confirmingClear.value = false
}

const totalPrice = computed(() =>
  cartStore.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
)

const totalCount = computed(() => cartStore.items.reduce((sum, item) => sum + item.quantity, 0))

const finalTotal = computed(() => {
  if (cartStore.items.length === 0) return 0
  const shipping = deliveryMethod.value === 'delivery' ? shippingPrice : 0
  return totalPrice.value + shipping
})

// קיבוץ פריטים לפי חנות
const itemsByStore = computed(() => {
  const groups: Record<string, typeof cartStore.items> = {}
  cartStore.items.forEach((item) => {
    const shopId = item.shopId || 'unknown'
    if (!groups[shopId]) {
      groups[shopId] = []
    }
    groups[shopId].push(item)
  })
  return groups
})

const hasMultipleStores = computed(() => {
  return Object.keys(itemsByStore.value).length > 1
})

const storeCount = computed(() => {
  return Object.keys(itemsByStore.value).length
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

.multi-store-warning {
  background: linear-gradient(135deg, #fff3cd 0%, #ffe8a1 100%);
  border: 2px solid var(--warning);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  color: #856404;
  font-size: 0.95rem;
  line-height: 1.6;
  box-shadow: var(--shadow-sm);
}

.multi-store-warning strong {
  color: var(--warning);
  font-size: 1.05rem;
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

th,
td {
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

.delivery-choice {
  margin: 1.5rem 0;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  border: 2px solid var(--border);
}

.delivery-option {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  margin: 0.5rem 0;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.delivery-option:hover {
  background: var(--bg-secondary);
}

.delivery-option input[type='radio'] {
  margin-left: 0.75rem;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.delivery-option span {
  font-size: 1rem;
  font-weight: 500;
  color: var(--neutral-dark);
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
