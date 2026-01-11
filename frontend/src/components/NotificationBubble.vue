<template>
  <div class="bubble" @click="toggleChat">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="#ffffff"
      viewBox="0 0 24 24"
      width="28"
      height="28"
      class="rtl-icon"
    >
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7l-4 4V6a2 2 0 0 1 2-2z" />
    </svg>
  </div>
  <transition name="fade">
    <div v-if="chatOpen" class="chat-box">
      <div class="chat-header">
        <img src="@/assets/avatar_woman.png" alt="אביבה" class="bot-avatar" />
        <span>אביבה - העוזרת הדיגיטלית</span>
      </div>

      <div class="chat-content">
        <div v-for="(msg, i) in messages" :key="i" :class="['msg', msg.from]" v-html="msg.text" />
      </div>

      <div v-if="currentStep === 'menu'" class="chat-buttons">
        <button @click="handleOption('order')">מעקב אחרי הזמנה</button>
        <button @click="handleOption('offers')">לראות מבצעים</button>
        <button @click="handleOption('agent')">לדבר עם נציג</button>
        <button @click="handleOption('nearby')">לחפש מוצרים קרובים</button>
        <button @click="handleOption('restart')">לחזור להתחלה</button>
      </div>

      <div v-if="currentStep === 'chooseRadius'" class="chat-buttons">
        <button @click="handleRadius(2000)">2 ק״מ</button>
        <button @click="handleRadius(5000)">5 ק״מ</button>
        <button @click="handleRadius(10000)">10 ק״מ</button>
      </div>

      <div v-if="currentStep === 'askOrder' || currentStep === 'askMore'" class="chat-input">
        <input
          v-model="currentInput"
          type="text"
          placeholder="הקלד כאן..."
          @keydown.enter="handleSend"
        />
        <button @click="handleSend">שלח</button>
      </div>

      <div v-if="currentStep === 'closed'" class="chat-buttons">
        <button @click="restartChat">התחל שיחה חדשה</button>
        <button @click="restartChat">התחל שיחה חדשה</button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast, POSITION } from 'vue-toastification'
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()
const toast = useToast()

// ---- Types ----
type Step = 'menu' | 'chooseRadius' | 'askOrder' | 'askMore' | 'flow' | 'closed'
type Option = 'order' | 'offers' | 'agent' | 'nearby' | 'restart'
type Sender = 'user' | 'bot'

interface ChatMessage {
  text: string
  from: Sender
}

interface ProductFromApi {
  _id: string
  name: string
  priceDiscounted: number
  imageUrl?: string | null
}

interface ProductForCart {
  id: string
  name: string
  price: number
  imageUrl: string
}

// expose safe global
declare global {
  interface Window {
    addToCart: (product: ProductForCart) => void
  }
}

const chatOpen = ref(false)
const messages = ref<ChatMessage[]>([])
const currentStep = ref<Step>('menu')
const currentInput = ref('')
const userOrder = ref('')
const selectedRadius = ref<number>(10000)

const toggleChat = () => {
  chatOpen.value = !chatOpen.value
  if (chatOpen.value && messages.value.length === 0) {
    messages.value.push({
      text: 'שלום, אני אביבה הנציגה הוירטואלית. במה אפשר לעזור?',
      from: 'bot',
    })
  }
}

const optionLabel = (option: Option): string => {
  if (option === 'order') return 'מעקב אחרי הזמנה'
  if (option === 'offers') return 'לראות מבצעים'
  if (option === 'agent') return 'לדבר עם נציג'
  if (option === 'nearby') return 'לחפש מוצרים קרובים'
  if (option === 'restart') return 'לחזור להתחלה'
  return option
}

const handleOption = (option: Option) => {
  messages.value.push({ text: optionLabel(option), from: 'user' })

  if (option === 'order') {
    messages.value.push({ text: 'מה מספר ההזמנה שלך?', from: 'bot' })
    currentStep.value = 'askOrder'
  } else if (option === 'offers') {
    messages.value.push({
      text: ' מבצעי היום: <br>- 1+1 על מוצרי חלב <br>- 15% הנחה על ירקות',
      from: 'bot',
    })
    currentStep.value = 'flow'
    askMore()
  } else if (option === 'agent') {
    messages.value.push({ text: ' מעבירה אותך לנציג... אנא המתן', from: 'bot' })
    currentStep.value = 'flow'
    askMore()
  } else if (option === 'nearby') {
    messages.value.push({ text: ' באיזה טווח לחפש מוצרים?', from: 'bot' })
    currentStep.value = 'chooseRadius'
  } else if (option === 'restart') {
    restartChat()
  }
}

const handleSend = () => {
  const trimmed = currentInput.value.trim()
  if (!trimmed) return

  messages.value.push({ text: trimmed, from: 'user' })

  if (currentStep.value === 'askOrder') {
    userOrder.value = trimmed
    messages.value.push({
      text: ` מעקב אחרי הזמנה מספר ${userOrder.value}: <br>ההזמנה נשלחה והיא בדרכה אליך 🚚`,
      from: 'bot',
    })
    currentStep.value = 'flow'
    askMore()
  } else if (currentStep.value === 'askMore') {
    const norm = trimmed.toLowerCase()
    if (norm === 'לא') {
      messages.value.push({ text: ' השיחה נסגרה. תודה שפנית אלי!', from: 'bot' })
      currentStep.value = 'closed'
    } else if (norm === 'כן') {
      currentStep.value = 'menu'
      messages.value.push({ text: ' מצויין, במה אפשר לעזור?', from: 'bot' })
    } else {
      messages.value.push({ text: 'לא הבנתי, אנא כתבי "כן" או "לא".', from: 'bot' })
    }
  }

  currentInput.value = ''
}

const askMore = () => {
  setTimeout(() => {
    messages.value.push({ text: ' האם יש משהו נוסף שתרצי? (כתבי כן / לא)', from: 'bot' })
    currentStep.value = 'askMore'
  }, 800)
}

const restartChat = () => {
  messages.value = []
  currentStep.value = 'menu'
  messages.value.push({ text: 'שלום, אני אביבה . במה אפשר לעזור?', from: 'bot' })
}

const handleRadius = (radius: number) => {
  selectedRadius.value = radius
  messages.value.push({ text: `טווח ${radius / 1000} ק״מ נבחר`, from: 'user' })
  currentStep.value = 'flow'
  getNearbyProducts()
}

const getNearbyProducts = () => {
  if (!navigator.geolocation) {
    messages.value.push({ text: '❌ הדפדפן לא תומך במיקום.', from: 'bot' })
    return askMore()
  }

  navigator.geolocation.getCurrentPosition(
    async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords

      // Reverse geocoding (address)
      const resGeo = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      )
      const geoData: { display_name?: string } = await resGeo.json()
      const address = geoData.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
      messages.value.push({ text: ` מיקום נוכחי: ${address}`, from: 'bot' })

      try {
        const res = await fetch(
          `http://localhost:3000/api/products/nearby?lat=${latitude}&lng=${longitude}&radius=${selectedRadius.value}`,
        )
        const data: unknown = await res.json()

        if (Array.isArray(data)) {
          const list = data
            .map((x) => x as ProductFromApi)
            .map(
              (p) => `
              <div class="product-item">
                <div class="product-info">
                  <strong>${p.name}</strong><br>
                  ₪${p.priceDiscounted}
                </div>
                <button class="add-btn" onclick='window.addToCart(${JSON.stringify({
                  id: p._id,
                  name: p.name,
                  price: p.priceDiscounted,
                  imageUrl: p.imageUrl ?? '',
                } as ProductForCart)}">הוסף לסל</button>
              </div>
            `,
            )
            .join('')

          messages.value.push({ text: ` מוצרים קרובים:<br>${list}`, from: 'bot' })
        } else {
          messages.value.push({ text: ' לא נמצאו מוצרים קרובים.', from: 'bot' })
        }

        askMore()
      } catch (err: unknown) {
        console.error('❌ שגיאה:', err)
        messages.value.push({ text: '❌ שגיאה בעת טעינת מוצרים.', from: 'bot' })
        askMore()
      }
    },
    () => {
      messages.value.push({ text: '❌ לא ניתן לגשת למיקום שלך.', from: 'bot' })
      askMore()
    },
  )
}

// safe global (no any)
window.addToCart = (product: ProductForCart) => {
  cartStore.addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    quantity: 1,
  })

  toast.success(`✅ "${product.name}" נוסף לסל!`, {
    timeout: 3000,
    position: POSITION.BOTTOM_LEFT,
  })
}
</script>

<style scoped>
/* כפתור bubble */
.bubble {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #24452b;
  color: white;
  font-size: 1.8rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  transition: background-color 0.3s ease;
}
.bubble:hover {
  background-color: #1b3623;
}

/* chat-box הכללי */
.chat-box {
  position: fixed;
  bottom: 90px;
  right: 20px;
  background: #fff;
  border-radius: 16px;
  width: 360px;
  max-height: 520px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  border: 3px solid #24452b;
}

/* header */
.chat-header {
  background-color: #24452b;
  color: #fff;
  padding: 0.9rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.bot-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

/* content */
.chat-content {
  max-height: 350px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.8rem;
  background: #f9f9f9;
}

/* הודעת בוט */
.msg.bot {
  align-self: flex-start;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background-color: #f8fef8;
  border: 2px solid #24452b;
  color: #24452b;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 0.95rem;
  max-width: 85%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
.msg.bot::before {
  content: '';
  display: inline-block;
  width: 28px;
  height: 31px;
  border-radius: 50%;
  background-image: url('@/assets/avatar_woman.png');
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
}

/* הודעת user */
.msg.user {
  align-self: flex-end;
  background-color: #e1f3e8;
  color: #24452b;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 0.95rem;
  max-width: 85%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* כפתורים */
.chat-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
}
.chat-buttons button {
  background-color: #24452b;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.chat-buttons button:hover {
  background-color: #1b3623;
}

/* שורת הקלדה */
.chat-input {
  display: flex;
  padding: 0.6rem;
  gap: 0.6rem;
  border-top: 1px solid #ddd;
  background: #fafafa;
}
.chat-input input {
  flex: 1;
  padding: 0.5rem 0.7rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 0.95rem;
}
.chat-input button {
  background-color: #24452b;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 0.9rem;
  cursor: pointer;
  font-size: 0.95rem;
}
.chat-input button:hover {
  background-color: #1b3623;
}

/* מוצר */
.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2px solid #24452b;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 10px;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}
.product-item:hover {
  transform: scale(1.02);
}
.product-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 1rem;
  color: #222;
}
.product-info strong {
  font-size: 1.05rem;
  color: #24452b;
}
.add-btn {
  background: #24452b;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.add-btn:hover {
  background: #1b3623;
}

/* fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
