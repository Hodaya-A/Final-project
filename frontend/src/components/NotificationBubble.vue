<template>
  <div class="bubble" @click="toggleChat">
    <svg xmlns="http://www.w3.org/2000/svg" fill="#ffffff" viewBox="0 0 24 24" width="28" height="28" class="rtl-icon">
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7l-4 4V6a2 2 0 0 1 2-2z"/>
    </svg>
  </div>

  <transition name="fade">
    <div v-if="chatOpen" class="chat-box">
      <h4>צ'אט עם Fresh End</h4>

      <div class="chat-content">
        <div v-for="(msg, i) in messages" :key="i" :class="['msg', msg.from]">
          {{ msg.text }}
        </div>
      </div>

      <div class="chat-buttons">
        <label for="range">בחר טווח חיפוש:</label>
        <select id="range" v-model="selectedRadius">
          <option :value="2000">2 ק"מ</option>
          <option :value="5000">5 ק"מ</option>
          <option :value="10000">10 ק"מ</option>
        </select>

        <button @click="handleOption('מוצרים באזור שלי')"> הצג מוצרים באזור שלי</button>
        <button @click="handleOption('מבצעים חמים')"> הצג מבצעים</button>
        <button @click="handleOption('התראות')"> הצג התראות</button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const chatOpen = ref(false)
const messages = ref<{ text: string; from: 'user' | 'bot' }[]>([])
const selectedRadius = ref(10000)

const toggleChat = () => {
  chatOpen.value = !chatOpen.value
}

async function handleOption(option: string) {
  messages.value.push({ text: option, from: 'user' })

  if (option.includes('מוצרים')) {
    if (!navigator.geolocation) {
      messages.value.push({ text: '🚫 לא ניתן לגשת למיקום שלך.', from: 'bot' })
      return
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
        console.log('📍 מיקום מהדפדפן:', latitude, longitude); // ✅ הדפסת מיקום


      try {
        const res = await fetch(`http://localhost:3000/api/products/nearby?lat=${latitude}&lng=${longitude}&radius=${selectedRadius.value}`)
        const data = await res.json()

        if (!Array.isArray(data) || data.length === 0) {
          messages.value.push({ text: ' לא נמצאו מוצרים קרובים אליך כרגע.', from: 'bot' })
        } else {
          const response = ' מוצרים באזור שלך:'+ 
            data.map((p: any) => `- ${p.name} ב-₪${p.priceDiscounted}`).join('\n')

          messages.value.push({ text: response, from: 'bot' })
        }
      } catch (err) {
        console.error(err)
        messages.value.push({ text: '❌ שגיאה בעת טעינת מוצרים.', from: 'bot' })
      }
    }, () => {
      messages.value.push({ text: '⚠️ לא הצלחנו לקבל מיקום מהדפדפן.', from: 'bot' })
    })

  } else if (option.includes('מבצעים')) {
    messages.value.push({
      text: ' מבצעי היום:\n1+1 על מוצרי חלב \n15% הנחה על ירקות טריים ',
      from: 'bot'
    })
  } else if (option.includes('התראות')) {
    messages.value.push({
      text: ' אין התראות חדשות כרגע. נחזור אליך ברגע שיהיו עדכונים!',
      from: 'bot'
    })
  } else {
    messages.value.push({ text: ' לא זיהיתי את הבקשה. נסה שוב.', from: 'bot' })
  }
}
</script>

<style scoped>
.bubble {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #24452b;
  color: white;
  font-size: 1.6rem;
  width: 55px;
  height: 55px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  transition: background-color 0.2s;
}
.bubble:hover {
  background-color: #1b3623;
}

.rtl-icon {
  transform: scaleX(-1);
}

.chat-box {
  position: fixed;
  bottom: 85px;
  right: 20px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 12px;
  width: 280px;
  padding: 0.5rem 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chat-content {
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.msg {
  padding: 6px 10px;
  border-radius: 8px;
  max-width: 80%;
  font-size: 0.85rem;
  white-space: pre-line;
}
.msg.user {
  align-self: flex-end;
  background: #e1f3e8;
  color: #24452b;
}
.msg.bot {
  align-self: flex-start;
  background: #f0f0f0;
  color: #333;
}

.chat-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.chat-buttons select {
  font-size: 0.85rem;
  padding: 0.3rem;
  border-radius: 6px;
  margin-bottom: 0.3rem;
}
.chat-buttons button {
  background: #24452b;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.4rem;
  font-size: 0.85rem;
  cursor: pointer;
}
.chat-buttons button:hover {
  background-color: #1b3623;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
