<template>
  <div class="payment-page">
    <h1>תשלום</h1>

    <div v-if="cartStore.items.length === 0" class="empty">הסל ריק - חזרה לחנות</div>
    <div v-else>
      <div v-if="multipleStores" class="warning">
        בסל קיימות מספר חנויות. אנא השלם רכישה עבור חנות אחת בכל פעם.
      </div>

      <section class="layout">
        <div class="form-panel">
          <h2>פרטי קשר ומשלוח</h2>
          <div class="field">
            <label>שם מלא</label>
            <input v-model="fullName" type="text" placeholder="שם מלא" />
          </div>
          <div class="field">
            <label>טלפון</label>
            <input v-model="phone" type="tel" placeholder="05x-xxxxxxx" />
          </div>

          <div class="field">
            <label>עיר</label>
            <input v-model="city" type="text" />
          </div>
          <div class="field">
            <label>רחוב</label>
            <input v-model="street" type="text" />
          </div>
          <div class="field">
            <label>מיקוד</label>
            <input v-model="zip" type="text" />
          </div>
          <div class="field">
            <label>הערות למשלוח</label>
            <textarea v-model="notes" rows="3" placeholder="הוראות שליח"></textarea>
          </div>

          <div class="delivery-choice">
            <label class="delivery-option">
              <input type="radio" value="delivery" v-model="deliveryMethod" />
              <span>משלוח עד הבית (+₪{{ shippingPrice.toFixed(2) }})</span>
            </label>
            <label class="delivery-option">
              <input type="radio" value="pickup" v-model="deliveryMethod" />
              <span>איסוף עצמי (חינם)</span>
            </label>
          </div>

          <p class="hint" v-if="deliveryMethod === 'pickup'">
            לא ייגבה משלוח, וההזמנה תסומן לאיסוף עצמי.
          </p>
        </div>

        <div class="summary-panel">
          <h2>סיכום הזמנה</h2>
          <ul class="items">
            <li v-for="item in cartStore.items" :key="item.id">
              <span>{{ item.name }} × {{ item.quantity }}</span>
              <span>₪{{ (item.price * item.quantity).toFixed(2) }}</span>
            </li>
          </ul>
          <div class="row">
            <span>סה"כ פריטים</span>
            <span>₪{{ itemsTotal.toFixed(2) }}</span>
          </div>
          <div class="row">
            <span>משלוח</span>
            <span>
              <template v-if="deliveryMethod === 'delivery'"
                >₪{{ shippingAmount.toFixed(2) }}</template
              >
              <template v-else>חינם</template>
            </span>
          </div>
          <div class="total">
            <span>לתשלום</span>
            <span>₪{{ total.toFixed(2) }}</span>
          </div>

          <div v-if="error" class="error">{{ error }}</div>
          <div id="paypal-buttons" ref="paypalContainer" class="paypal"></div>
          <p class="sandbox-hint">תשלום יתבצע ב-Sandbox (PayPal Test).</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useRouter, useRoute } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

type PayPalButtons = {
  render: (el: HTMLElement) => void
}

type PayPalNamespace = {
  Buttons: (options: {
    createOrder: () => Promise<string>
    onApprove: (data: { orderID: string }) => Promise<void>
    onError?: (err: unknown) => void
  }) => PayPalButtons
}

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const userStore = useUserStore()

const shippingPrice = 29.9
const deliveryMethod = ref<'delivery' | 'pickup'>(
  (route.query.method as 'delivery' | 'pickup') || 'delivery',
)

const fullName = ref('')
const phone = ref('')
const street = ref('')
const city = ref('')
const zip = ref('')
const notes = ref('')

const paypalContainer = ref<HTMLElement | null>(null)
const error = ref('')

const itemsTotal = computed(() =>
  cartStore.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
)
const shippingAmount = computed(() => (deliveryMethod.value === 'delivery' ? shippingPrice : 0))
const total = computed(() => itemsTotal.value + shippingAmount.value)

const multipleStores = computed(() => {
  const shopIds = new Set(cartStore.items.map((i) => i.shopId))
  return shopIds.size > 1
})

function requireAddress(): boolean {
  if (deliveryMethod.value === 'pickup') return true
  if (!fullName.value || !phone.value || !street.value || !city.value || !zip.value) {
    error.value = 'נא למלא שם, טלפון, עיר, רחוב ומיקוד למשלוח'
    return false
  }
  return true
}

async function loadPayPalScript() {
  if (typeof window === 'undefined') return
  const win = window as Window & { paypal?: PayPalNamespace }
  if (win.paypal) return
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID
  if (!clientId) {
    error.value = 'חסר PAYPAL CLIENT ID'
    return
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script') as HTMLScriptElement
    // נוודא שאין סקריפט קודם שמפריע
    Array.from(document.querySelectorAll('script[src*="paypal.com/sdk/js"],[data-pp-sdk]')).forEach(
      (el) => el.parentElement?.removeChild(el),
    )

    // טען SDK עם רכיב הכפתורים ו-RTL
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=ILS&intent=capture&locale=he_IL&components=buttons`
    script.dataset.ppSdk = 'vue'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'))
    document.body.appendChild(script)
  })

  // המתנה בטוחה ליצירת window.paypal גם אחרי onload
  if (!win.paypal) {
    await new Promise<void>((resolve, reject) => {
      let tries = 0
      const timer = setInterval(() => {
        if (win.paypal) {
          clearInterval(timer)
          resolve()
        } else if (tries++ > 40) {
          clearInterval(timer)
          error.value = 'PayPal SDK לא נטען — בדוק את ה-Client ID ואת החוסם פרסומות'
          reject(new Error('PayPal SDK not available on window after load'))
        }
      }, 75)
    })
  }
}

async function renderButtons() {
  if (!paypalContainer.value) return
  if (multipleStores.value) {
    error.value = 'לא ניתן לשלם עבור מספר חנויות יחד.'
    return
  }

  await loadPayPalScript()
  const paypal = (window as Window & { paypal?: PayPalNamespace }).paypal
  if (!paypal) {
    error.value = 'PayPal SDK לא נטען'
    return
  }

  // נקה כפתורים קודמים אם קיימים
  paypalContainer.value.innerHTML = ''

  paypal
    .Buttons({
      createOrder: async () => {
        error.value = ''
        const response = await axios.post('http://localhost:3000/api/payments/create', {
          items: cartStore.items,
          deliveryMethod: deliveryMethod.value,
          shippingAmount: shippingAmount.value,
          currency: 'ILS',
        })
        return response.data.id
      },
      onApprove: async (data: { orderID: string }) => {
        error.value = ''
        const userId = userStore.uid
        const userEmail = userStore.email
        if (!userId) {
          error.value = 'נדרש להתחבר לפני תשלום'
          return
        }

        const shopId = cartStore.items[0]?.shopId || ''
        const sellerId = cartStore.items[0]?.sellerId || ''

        if (!shopId) {
          error.value = 'לא נמצא מזהה חנות עבור הסל'
          return
        }

        const shippingAddress = {
          fullName: fullName.value,
          phone: phone.value,
          street: street.value,
          city: city.value,
          zip: zip.value,
          notes: notes.value,
        }

        if (!requireAddress()) return

        try {
          const captureResponse = await axios.post('http://localhost:3000/api/payments/capture', {
            paypalOrderId: data.orderID,
            userId,
            userEmail,
            shopId,
            sellerId,
            items: cartStore.items,
            deliveryMethod: deliveryMethod.value,
            shippingAddress,
            shippingAmount: shippingAmount.value,
          })

          // ✅ התשלום בוצע בהצלחה!
          if (captureResponse.data.success || captureResponse.data.order) {
            // נקה את הסל
            cartStore.clearCart()

            // נווט לעמוד תודה
            router.push({
              name: 'thank-you',
              query: { orderId: captureResponse.data.order?._id || data.orderID },
            })
          }
        } catch (err: unknown) {
          const axiosErr = err as { response?: { data?: unknown } }
          const resp = axiosErr.response?.data as
            | {
                paypal?: { status?: string; name?: string; details?: string; debugId?: string }
                error?: string
              }
            | undefined
          // הראה פירוט שגיאה מהשרת כדי להבין את מקור ה-500
          if (resp?.paypal) {
            const { status, name, details, debugId } = resp.paypal
            error.value = `שגיאה בתפיסת תשלום (PayPal ${status || ''} ${name || ''} ${debugId || ''}): ${details || ''}`
          } else if (resp?.error) {
            error.value = `שגיאת תשלום: ${resp.error}`
          } else {
            error.value = 'התשלום נכשל (500). נסה שוב.'
          }
          console.error('Capture failed', resp || err)
        }
      },
      onError: (err: unknown) => {
        console.error('PayPal error', err)
        error.value = 'התשלום נכשל, נסה שוב.'
      },
    })
    .render(paypalContainer.value)
}

onMounted(() => {
  if (cartStore.items.length === 0) {
    router.push('/cart')
    return
  }
  renderButtons()
})

watch(deliveryMethod, () => {
  error.value = ''
  // רענון כפתורים כדי לעדכן סכום משלוח
  renderButtons()
})
</script>

<style scoped>
.payment-page {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 1rem;
  direction: rtl;
}

.layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.form-panel,
.summary-panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: var(--shadow, 0 2px 8px rgba(0, 0, 0, 0.08));
  padding: 1.5rem;
  position: sticky;
  top: 1rem;
  align-self: start;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 0.75rem;
}

.field label {
  font-weight: 600;
  margin-bottom: 0.35rem;
}

.field input,
.field textarea {
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  font-size: 0.95rem;
}

.delivery-choice {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 10px;
  background: var(--bg-secondary, #f8fafc);
}

.delivery-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
}

.summary-panel .items {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem 0;
}

.summary-panel .items li {
  display: flex;
  justify-content: space-between;
  padding: 0.35rem 0;
  border-bottom: 1px solid #eee;
}

.row {
  display: flex;
  justify-content: space-between;
  margin: 0.35rem 0;
}

.total {
  display: flex;
  justify-content: space-between;
  margin-top: 0.75rem;
  font-weight: 700;
  font-size: 1.1rem;
}

.paypal {
  margin-top: 1rem;
}

.error {
  color: var(--danger, #e53e3e);
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  margin-top: 0.5rem;
}

.warning {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.hint,
.sandbox-hint {
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 0.35rem;
}

.empty {
  text-align: center;
  padding: 2rem;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
