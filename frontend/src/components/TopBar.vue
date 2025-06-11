<template>
  <header class="top-bar">
    <!-- לוגו -->
    <div class="logo">
      <router-link to="/" class="brand">
        <img
          src="https://res.cloudinary.com/dvb1k0trx/image/upload/v1748971282/ChatGPT_Image_Jun_3_2025_07_26_22_PM_qoilfz.png"
          alt="לוגו האתר"
          class="logo-img"
        />
      </router-link>
    </div>

    <!-- שדה חיפוש -->
    <div class="search-box">
      <input
        type="text"
        v-model="searchTerm"
        ref="searchInput"
        @keydown.enter="submitSearch"
        placeholder="חיפוש פריט, קטגוריה או מותג..."
        autocomplete="on"
      />
      <button class="search-btn" @click="submitSearch">
        חיפוש <span style="color: white">🔍</span>
      </button>
    </div>

    <!-- פעולות -->
    <div class="actions">
      <!-- ניהול מערכת -->
      <router-link
        v-if="userStore.isLoggedIn && userStore.isAdmin"
        to="/admin"
        class="icon-button"
        title="ניהול מערכת"
      >
        <img src="@/assets/icon_managment.png" alt="ניהול" class="icon-img" />
      </router-link>

      <!-- מוצרים לפי מפה -->
      <router-link to="/map" class="icon-button" title="מוצרים לפי מפה">
        <img src="@/assets/icon_location.png" alt="מיקום" class="icon-img" />
      </router-link>

      <!-- תפריט משתמש -->
      <div class="user-menu-wrapper" :class="{ open: showMenu }" @click="toggleMenu">
        <img :src="userIcon" ref="userIconRef" alt="משתמש" class="user-icon interactive-icon" title="פרופיל משתמש" />
        <transition name="fade-slide">
          <div
            v-if="showMenu"
            class="user-dropdown"
            :style="dropdownStyle"
          >
            <template v-if="userStore.isLoggedIn">
              <p class="username">שלום, {{ userStore.email }}</p>
              <hr class="divider" />
              <button @click="logout">התנתקות</button>
            </template>
            <template v-else>
              <router-link to="/auth" class="login-link">התחברות / הצטרפות</router-link>
            </template>
          </div>
        </transition>
      </div>
      
    </div>

    <!-- קומפוננטת CartSidebar -->
    <CartSidebar :isOpen="isCartOpen" @close="isCartOpen = false" />
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { signOut } from 'firebase/auth'
import { auth } from '@/services/firebase'
import userIcon from '@/assets/icon_user.png'
import CartSidebar from '@/components/CartSidebar.vue'

const cartStore = useCartStore()
const { totalItems } = storeToRefs(cartStore)
const userStore = useUserStore()
const router = useRouter()

const searchTerm = ref('')
const showMenu = ref(false)
const isCartOpen = ref(false)
const userIconRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref({ top: '0px', left: '0px' })

const toggleMenu = async () => {
  showMenu.value = !showMenu.value
  if (showMenu.value) {
    await nextTick()
    const icon = userIconRef.value
    if (icon) {
      const rect = icon.getBoundingClientRect()
      dropdownStyle.value = {
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`
      }
    }
  }
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  const menu = document.querySelector('.user-menu-wrapper')
  if (menu && !menu.contains(target)) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const logout = async () => {
  await signOut(auth)
  userStore.logout()
  showMenu.value = false
  router.push('/')
}

const submitSearch = () => {
  if (searchTerm.value.trim() !== '') {
    router.push({ name: 'home', query: { search: searchTerm.value.trim() } })
  }
}
</script>


<style scoped>
.header{
  max-height: 60px;
}
.top-bar {
  direction: rtl;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ddf8d5b9;
  padding: 1rem;
  border: none; 
  flex-wrap: wrap;
  gap: 1rem;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
  height:60px;
  padding: 0.5rem 1rem; /* היה 1rem – עכשיו יותר קטן */
  height: auto; /* ביטול גובה קשיח */
  min-height: 60px;
}

.logo-img {
  height: 80px;
  object-fit: contain;
}

.search-box {
  flex: 1;
  display: flex;
  max-width: 600px;
  min-width: 0;
  border: 1px solid #108a2a;
  border-radius: 40px;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.search-box input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: none;
  font-size: 1rem;
  outline: none;
  text-align: right;
  color: #333;
  background-color: #fff;
}

.search-btn {
  padding: 0 1.5rem;
  background-color: #108a2a;
  color: white;
  border: none;
  border-radius: 40px 0 0 40px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-icon,
.cart-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.interactive-icon:hover {
  transform: scale(1.1);
}

.cart-wrapper {
  position: relative;
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: bold;
}

.user-menu-wrapper {
  position: relative;
  cursor: pointer;
}

.user-dropdown {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  min-width: 200px;
  z-index: 10000;
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.user-menu-wrapper.open .user-dropdown {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.username {
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #333;
}

.divider {
  margin: 0.5rem 0;
  border: none;
  border-top: 1px solid #ccc;
}

.login-link,
.user-dropdown button {
  display: block;
  width: 100%;
  text-align: center;
  padding: 0.5rem;
  background-color: #0f571f;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  text-decoration: none;
  cursor: pointer;
}

.login-link:hover,
.user-dropdown button:hover {
  background-color: #0c4619;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.cart-wrapper:hover {
  background-color: transparent !important;
}

.icon-button {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.icon-button:hover {
  transform: scale(1.1);
}

.icon-img {
   width: 40px;
  height: 40px;
  /* border-radius: 50%; */
  transition: transform 0.2s ease;
}
</style>
