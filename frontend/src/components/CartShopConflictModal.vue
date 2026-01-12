<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="isOpen" class="overlay" role="dialog" aria-modal="true">
        <div class="modal">
          <h3 class="modal__title">הזמנה מחנות אחת</h3>
          <p class="modal__text">
            ניתן להזמין רק ממסעדה/חנות אחת בכל פעם. למחוק את הסל הנוכחי ולהתחיל הזמנה חדשה?
          </p>
          <div v-if="shopIdsText" class="modal__meta">{{ shopIdsText }}</div>
          <div class="modal__actions">
            <button class="btn btn--ghost" @click="handleChoice(false)">השאר סל</button>
            <button class="btn btn--primary" @click="handleChoice(true)">אפס והמשך</button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

type ShopConflictDetail = {
  resolve: (accept: boolean) => void
  existingShopId?: string
  incomingShopId?: string
  existingShopName?: string
  incomingShopName?: string
}

const isOpen = ref(false)
let resolver: ((accept: boolean) => void) | null = null
const existingShopId = ref<string | undefined>()
const incomingShopId = ref<string | undefined>()
const existingShopName = ref<string | undefined>()
const incomingShopName = ref<string | undefined>()

const shopIdsText = computed(() => {
  if (!existingShopId.value && !incomingShopId.value) return ''
  const current = existingShopName.value || existingShopId.value || 'חנות קיימת'
  const next = incomingShopName.value || incomingShopId.value || 'חנות חדשה'
  return `חנות נוכחית: ${current} → חדשה: ${next}`
})

function handleChoice(accept: boolean) {
  resolver?.(accept)
  isOpen.value = false
  resolver = null
}

function handleConflict(event: Event) {
  const { detail } = event as CustomEvent<ShopConflictDetail>
  resolver = detail.resolve
  existingShopId.value = detail.existingShopId
  incomingShopId.value = detail.incomingShopId
  existingShopName.value = detail.existingShopName
  incomingShopName.value = detail.incomingShopName
  isOpen.value = true
}

onMounted(() => {
  window.addEventListener('single-shop-cart-conflict', handleConflict as EventListener)
})

onBeforeUnmount(() => {
  window.removeEventListener('single-shop-cart-conflict', handleConflict as EventListener)
})
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: grid;
  place-items: center;
  z-index: 10000;
  padding: 16px;
}

.modal {
  width: min(420px, 100%);
  background: #ffffff;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.14);
  text-align: center;
  color: #1f2937;
}

.modal__title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
}

.modal__text {
  margin: 0 0 12px;
  color: #4b5563;
  line-height: 1.5;
  font-size: 15px;
}

.modal__meta {
  margin: 0 0 16px;
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 8px 10px;
}

.modal__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.btn {
  padding: 10px 12px;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 120ms ease,
    box-shadow 120ms ease,
    opacity 120ms ease;
}

.btn--ghost {
  background: #f3f4f6;
  color: #374151;
}

.btn--ghost:hover {
  background: #e5e7eb;
}

.btn--primary {
  background: linear-gradient(135deg, #10b981, #0ea5e9);
  color: white;
  box-shadow: 0 8px 18px rgba(16, 185, 129, 0.35);
}

.btn--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(14, 165, 233, 0.4);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
