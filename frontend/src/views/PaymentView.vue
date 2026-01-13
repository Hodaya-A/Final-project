<template>
  <div class="checkout-page">
    <div class="checkout-header">
      <h1>עמוד התשלום</h1>
      <p class="subtitle">אתה בשלב הסופי של ההזמנה שלך</p>
    </div>

    <div v-if="cartStore.items.length === 0" class="empty-cart">
      <p>הסל שלך ריק</p>
      <router-link to="/shop" class="btn-back">חזרה לחנות</router-link>
    </div>

    <div v-else class="checkout-container">
      <!-- Checkout Grid -->
      <div class="checkout-grid">
        <!-- Left: Forms -->
        <div class="forms-section">
          <!-- Shipping Form - For both Delivery and Pickup -->
          <div class="form-card shipping-form">
            <h2>{{ deliveryMethod === 'delivery' ? 'פרטי משלוח' : 'פרטי איסוף' }}</h2>

            <Field name="fullName" rules="required" v-slot="{ field, errorMessage }">
              <div class="form-group" :class="{ 'has-error': errorMessage }">
                <label>שם מלא</label>
                <input v-bind="field" type="text" placeholder="הכנס שם מלא" />
                <span v-if="errorMessage" class="field-error">{{ errorMessage }}</span>
              </div>
            </Field>

            <Field name="phone" rules="required|israeliPhone" v-slot="{ field, errorMessage }">
              <div class="form-group" :class="{ 'has-error': errorMessage }">
                <label>טלפון</label>
                <input v-bind="field" type="tel" placeholder="05x-xxxxxxx" />
                <span v-if="errorMessage" class="field-error">{{ errorMessage }}</span>
              </div>
            </Field>

            <!-- Address fields - Only for Delivery -->
            <div v-if="deliveryMethod === 'delivery'">
              <div class="form-row">
                <Field name="city" rules="required" v-slot="{ field, errorMessage }">
                  <div class="form-group" :class="{ 'has-error': errorMessage }">
                    <label>עיר</label>
                    <input v-bind="field" type="text" placeholder="תל אביב" />
                    <span v-if="errorMessage" class="field-error">{{ errorMessage }}</span>
                  </div>
                </Field>

                <Field name="zip" rules="required|min:5|max:7" v-slot="{ field, errorMessage }">
                  <div class="form-group" :class="{ 'has-error': errorMessage }">
                    <label>מיקוד</label>
                    <input v-bind="field" type="text" placeholder="xxxxx" />
                    <span v-if="errorMessage" class="field-error">{{ errorMessage }}</span>
                  </div>
                </Field>
              </div>

              <Field name="street" rules="required" v-slot="{ field, errorMessage }">
                <div class="form-group" :class="{ 'has-error': errorMessage }">
                  <label>רחוב ומספר בית</label>
                  <input v-bind="field" type="text" placeholder="רחוב כלל בית מספר" />
                  <span v-if="errorMessage" class="field-error">{{ errorMessage }}</span>
                </div>
              </Field>

              <Field name="notes" v-slot="{ field }">
                <div class="form-group">
                  <label>הערות למשלוח (אופציונלי)</label>
                  <textarea
                    v-bind="field"
                    rows="3"
                    placeholder="הוראות למשלוח, קומה, דלת וכו'"
                  ></textarea>
                </div>
              </Field>
            </div>
          </div>

          <!-- Delivery Method Selection -->
          <div class="delivery-section">
            <h2>שיטת משלוח</h2>
            <div class="delivery-options">
              <label class="delivery-card" :class="{ active: deliveryMethod === 'delivery' }">
                <input type="radio" value="delivery" v-model="deliveryMethod" />
                <div class="delivery-content">
                  <h3>משלוח עד הבית</h3>
                  <p>קבל את ההזמנה בדלת ביתך</p>
                  <span class="delivery-price"> ₪{{ shippingPrice.toFixed(2) }}</span>
                </div>
              </label>

              <label class="delivery-card" :class="{ active: deliveryMethod === 'pickup' }">
                <input type="radio" value="pickup" v-model="deliveryMethod" />
                <div class="delivery-content">
                  <h3>איסוף עצמי</h3>
                  <p>בוא לאסוף את ההזמנה מהחנות</p>
                  <span class="delivery-price">חינם</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Right: Order Summary & Payment -->
        <div class="summary-section">
          <div class="summary-card">
            <h2>סיכום הזמנה</h2>

            <div class="items-list">
              <div v-for="item in cartStore.items" :key="item.id" class="item-row">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-qty">×{{ item.quantity }}</span>
                <span class="item-price">₪{{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="summary-row">
              <span>סה"כ פריטים</span>
              <span>₪{{ itemsTotal.toFixed(2) }}</span>
            </div>

            <div v-if="deliveryMethod === 'delivery'" class="summary-row">
              <span>עלות משלוח</span>
              <span class="shipping">₪{{ shippingPrice.toFixed(2) }}</span>
            </div>

            <div v-else class="summary-row">
              <span>עמלת משלוח</span>
              <span class="free">חינם</span>
            </div>

            <div class="divider"></div>

            <div class="total-row">
              <span>סה"כ לתשלום</span>
              <span>₪{{ total.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Payment Form -->
          <div class="form-card payment-form">
            <h2>פרטי תשלום</h2>

            <div v-if="error" class="error-message">
              {{ error }}
            </div>

            <div ref="paypalContainer" class="paypal-buttons"></div>
            <p class="sandbox-note">תשלום יתבצע ב-Sandbox (PayPal Test).</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { Field, useForm, defineRule, configure } from 'vee-validate'
import { required, min, max } from '@vee-validate/rules'

// Configure VeeValidate
defineRule('required', required)
defineRule('min', min)
defineRule('max', max)
defineRule('israeliPhone', (value: string) => {
  const phoneRegex = /^05[0-9](-?[0-9]{7}|[0-9]{7})$/
  const cleanPhone = value.replace(/\s+/g, '')
  if (!phoneRegex.test(cleanPhone)) {
    return 'מספר טלפון לא תקין. נא להזין מספר בפורמט: 05x-xxxxxxx'
  }
  return true
})

// Configure messages in Hebrew
configure({
  generateMessage: (context) => {
    const params = context.rule?.params as unknown as string[]
    const messages: Record<string, string> = {
      required: 'שדה חובה',
      min: `מינימום ${params?.[0] || ''} תווים`,
      max: `מקסימום ${params?.[0] || ''} תווים`,
    }
    return messages[context.rule?.name || ''] || 'שדה לא תקין'
  },
})

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
const cartStore = useCartStore()
const userStore = useUserStore()

// VeeValidate form
const { values, validate } = useForm()

// Delivery & Shipping
const deliveryMethod = ref<'delivery' | 'pickup'>('delivery')
const shippingPrice = 20

// State
const error = ref('')
const paypalContainer = ref<HTMLElement | null>(null)

// Computed
const itemsTotal = computed(() =>
  cartStore.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
)

const shippingAmount = computed(() => (deliveryMethod.value === 'delivery' ? shippingPrice : 0))

const total = computed(() => itemsTotal.value + shippingAmount.value)

const multipleStores = computed(() => {
  const shopIds = new Set(cartStore.items.map((i) => i.shopId))
  return shopIds.size > 1
})

// Validation
async function requireAddress(): Promise<boolean> {
  // Both delivery and pickup require name and phone
  // Only delivery requires address fields

  const validationResult = await validate()
  if (!validationResult.valid) {
    if (deliveryMethod.value === 'delivery') {
      error.value = 'נא למלא את כל שדות החובה בצורה תקינה'
    } else {
      error.value = 'נא למלא שם מלא ומספר טלפון'
    }
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
    Array.from(document.querySelectorAll('script[src*="paypal.com/sdk/js"],[data-pp-sdk]')).forEach(
      (el) => el.parentElement?.removeChild(el),
    )

    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=ILS&intent=capture&locale=he_IL&components=buttons`
    script.dataset.ppSdk = 'vue'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'))
    document.body.appendChild(script)
  })

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
          fullName: (values.fullName as string) || '',
          phone: (values.phone as string) || '',
          street: (values.street as string) || '',
          city: (values.city as string) || '',
          zip: (values.zip as string) || '',
          notes: (values.notes as string) || '',
        }

        if (!(await requireAddress())) return

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

          if (captureResponse.data.success || captureResponse.data.order) {
            cartStore.clearCart()
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
  renderButtons()
})
</script>

<style scoped>
.checkout-page {
  min-height: 100vh;
  background-color: #f9fafb;
  padding: 2rem;
  direction: rtl;
  text-align: right;
}

.checkout-header {
  max-width: 1300px;
  margin: 0 auto 3rem;
  text-align: center;
}

.checkout-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.checkout-header .subtitle {
  color: #6b7280;
  font-size: 1.1rem;
  font-weight: 500;
}

.checkout-container {
  max-width: 1300px;
  margin: 0 auto;
}

/* Delivery Section */
.delivery-section {
  margin-bottom: 2rem;
}

.delivery-section h2 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1rem;
}

.delivery-options {
  display: flex;
  gap: 1rem;
}

.delivery-card {
  flex: 1;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.delivery-card:hover {
  border-color: #a78bfa;
  transform: translateY(-2px);
}

.delivery-card input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #667eea;
  flex-shrink: 0;
  margin-top: 2px;
}

.delivery-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, #ffffff 0%, #faf5ff 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.delivery-card.active::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}

.delivery-content {
  flex: 1;
}

.delivery-content h3 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.delivery-content p {
  color: #6b7280;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.delivery-price {
  display: inline-block;
  font-weight: 600;
  color: #667eea;
  font-size: 0.9rem;
}

/* Checkout Grid */
.checkout-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
  margin-top: 2rem;
}

.forms-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-right: 4px solid #a78bfa;
}

.payment-form {
  position: sticky;
  top: 2rem;
  height: fit-content;
}

.form-card h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

.form-group.has-error input,
.form-group.has-error textarea {
  border-color: #ef4444;
}

.form-group.has-error label {
  color: #ef4444;
}

.field-error {
  display: block;
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 0.35rem;
  font-weight: 500;
  text-align: right;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  text-align: right;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.85rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  direction: rtl;
  text-align: right;
  transition: all 0.3s ease;
  background: white;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #a78bfa;
  box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.error-message {
  background: #fee2e2;
  border: 2px solid #fecaca;
  color: #991b1b;
  padding: 1rem;
  border-radius: 10px;
  margin-top: 1rem;
  font-size: 0.95rem;
  text-align: right;
}

/* Summary Section */
.summary-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.summary-card {
  background: linear-gradient(135deg, #ffffff 0%, #f3e8ff 100%);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.2);
  border-right: 4px solid #a78bfa;
}

.summary-card h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.items-list {
  margin-bottom: 1rem;
}

.item-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
  align-items: center;
  font-size: 0.95rem;
}

.item-row:last-child {
  border-bottom: none;
}

.item-name {
  color: #374151;
  font-weight: 500;
  text-align: right;
}

.item-qty {
  color: #9ca3af;
  font-size: 0.9rem;
}

.item-price {
  color: #667eea;
  font-weight: 700;
  text-align: left;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 1rem 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.summary-row .shipping {
  color: #ea8c55;
  font-weight: 600;
}

.summary-row .free {
  color: #10b981;
  font-weight: 600;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  font-weight: 700;
  font-size: 1.2rem;
  color: #1f2937;
}

.total-row span:last-child {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn-checkout {
  width: 100%;
  padding: 1.2rem;
  margin-top: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 700;
  font-size: 1rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.btn-checkout:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.4);
}

.btn-checkout:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.sandbox-note {
  color: #9ca3af;
  font-size: 0.85rem;
  text-align: center;
  margin-top: 1rem;
}

.paypal-buttons {
  margin: 1rem 0;
}

.btn-back {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-back:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
}

.empty-cart {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  max-width: 600px;
  margin: 2rem auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.empty-cart p {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .checkout-grid {
    grid-template-columns: 1fr;
  }

  .summary-section {
    position: static;
  }

  .payment-form {
    position: static;
    top: auto;
    height: auto;
  }
}

@media (max-width: 768px) {
  .checkout-page {
    padding: 1rem;
  }

  .checkout-header h1 {
    font-size: 1.8rem;
  }

  .checkout-header .subtitle {
    font-size: 0.95rem;
  }

  .form-card {
    padding: 1.5rem;
  }

  .form-card h2 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group input,
  .form-group textarea {
    padding: 0.75rem;
    font-size: 1rem;
    min-height: 44px;
  }

  .delivery-options {
    flex-direction: column;
    gap: 0.75rem;
  }

  .delivery-card {
    padding: 0.75rem;
  }

  .delivery-content h3 {
    font-size: 0.85rem;
  }

  .delivery-content p {
    font-size: 0.75rem;
  }

  .delivery-price {
    font-size: 0.8rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .summary-card {
    padding: 1.5rem;
  }

  .summary-card h2 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .item-row {
    font-size: 0.85rem;
    padding: 0.5rem 0;
  }

  .summary-row {
    font-size: 0.85rem;
    padding: 0.5rem 0;
  }

  .total-row {
    font-size: 1rem;
    padding: 0.75rem 0;
  }

  .field-error {
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }

  .error-message {
    font-size: 0.85rem;
    padding: 0.75rem;
  }

  .payment-form {
    position: static;
    top: auto;
    height: auto;
  }

  .paypal-buttons {
    margin: 0.75rem 0;
  }

  .sandbox-note {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .checkout-page {
    padding: 0.75rem;
  }

  .checkout-header {
    margin: 0 auto 1.5rem;
  }

  .checkout-header h1 {
    font-size: 1.5rem;
    margin-bottom: 0.35rem;
  }

  .checkout-header .subtitle {
    font-size: 0.85rem;
  }

  .checkout-grid {
    gap: 1rem;
    margin-top: 1rem;
  }

  .form-card {
    padding: 1rem;
    border-radius: 12px;
  }

  .form-card h2 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .form-group {
    margin-bottom: 0.75rem;
  }

  .form-group label {
    font-size: 0.85rem;
    margin-bottom: 0.35rem;
  }

  .form-group input,
  .form-group textarea {
    padding: 0.7rem;
    font-size: 16px;
    min-height: 44px;
  }

  .delivery-section {
    margin-bottom: 1.5rem;
  }

  .delivery-section h2 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
  }

  .delivery-options {
    gap: 0.5rem;
  }

  .delivery-card {
    padding: 0.65rem;
    gap: 0.5rem;
  }

  .delivery-card input {
    width: 16px;
    height: 16px;
    margin-top: 1px;
  }

  .delivery-content h3 {
    font-size: 0.8rem;
    margin-bottom: 0.15rem;
  }

  .delivery-content p {
    font-size: 0.7rem;
    margin-bottom: 0.35rem;
  }

  .delivery-price {
    font-size: 0.75rem;
  }

  .form-row {
    gap: 0.5rem;
  }

  .summary-card {
    padding: 1rem;
  }

  .summary-card h2 {
    font-size: 0.95rem;
    margin-bottom: 0.75rem;
  }

  .items-list {
    margin-bottom: 0.75rem;
  }

  .item-row {
    font-size: 0.8rem;
    padding: 0.4rem 0;
    gap: 0.5rem;
  }

  .divider {
    margin: 0.75rem 0;
  }

  .summary-row {
    font-size: 0.8rem;
    padding: 0.4rem 0;
  }

  .total-row {
    font-size: 0.9rem;
    padding: 0.5rem 0;
  }

  .field-error {
    font-size: 0.7rem;
    margin-top: 0.2rem;
  }

  .error-message {
    font-size: 0.8rem;
    padding: 0.65rem;
    margin-top: 0.75rem;
  }

  .btn-back {
    padding: 0.65rem 1.2rem;
    font-size: 0.9rem;
  }

  .empty-cart {
    padding: 1.5rem;
    margin: 1rem auto;
  }

  .empty-cart p {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
}
</style>
