<template>
  <header class="top-bar">
    <!-- לוגו -->
    <div class="logo">
      <router-link to="/" class="brand">
        <img src="@/assets/logo2.png" alt="Fresh End Logo" class="logo-img" />
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
        <img src="@/assets/icon_search.png" alt="חיפוש" class="search-icon" />
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          width="28"
          height="28"
        >
          <path
            d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
          />
        </svg>
      </router-link>

      <!-- מוצרים לפי מפה -->
      <router-link to="/map" class="icon-button" title="מוצרים לפי מיקום">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          width="28"
          height="28"
        >
          <path
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
          />
        </svg>
      </router-link>

      <!-- הזמנות קודמות -->
      <router-link to="/my-orders" class="icon-button" title="ההזמנות שלי">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 24 24"
          width="28"
          height="28"
          class="icon-svg"
        >
          <path
            d="M21 6.5V17a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6.5l9 5.25 9-5.25Zm-9 3.25L4.62 5.77A3 3 0 0 1 6 5h12a3 3 0 0 1 1.38.32L12 9.75Z"
          />
        </svg>
      </router-link>

      <!-- תפריט משתמש -->
      <div class="user-menu-wrapper" :class="{ open: showMenu }">
        <div class="icon-button" @click="toggleMenu" ref="userIconRef">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            width="28"
            height="28"
          >
            <path
              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
            />
          </svg>
        </div>
        <transition name="fade-slide">
          <div v-if="showMenu" class="user-dropdown" :style="dropdownStyle">
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
import { useUserStore } from '@/stores/user'
import { signOut } from 'firebase/auth'
import { auth } from '@/services/firebase'
import CartSidebar from '@/components/CartSidebar.vue'

const router = useRouter()
const userStore = useUserStore()

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
        left: `${rect.left}px`,
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
  // First let the user store save the cart to server, then sign out
  await userStore.logout()
  await signOut(auth)
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
.header {
  max-height: 48px;
}

.search-icon {
  width: 22px;
  height: 22px;
  max-width: 22px;
  max-height: 22px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.top-bar {
  direction: rtl;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-secondary);
  padding: 1rem 2rem;
  gap: 1.5rem;
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
}
.logo {
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

/* לוגו */
.logo-img {
  height: 55px;
  width: auto;
  max-width: 250px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

/* חיפוש מודרני */
.search-box {
  flex: 1;
  display: flex;
  max-width: 500px;
  min-width: 250px;
  border: 2px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  background-color: white;
  transition: all 0.3s ease;
}

.search-box:focus-within {
  border-color: var(--primary);
  background-color: white;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-box input {
  flex: 1;
  padding: 0.75rem 1.25rem;
  border: none;
  font-size: 0.95rem;
  outline: none;
  text-align: right;
  color: var(--neutral-dark, #1f2937);
  background-color: transparent;
  font-family: 'Courier New', Courier, monospace;
}

.search-box input::placeholder {
  color: var(--neutral-light, #9ca3af);
}

.search-btn {
  padding: 0 1.5rem;
  background: var(--gradient-primary, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  color: white;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.search-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}

/* אייקונים */
.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-icon {
  width: 28px;
  height: 28px;
  max-width: 28px;
  max-height: 28px;
  border-radius: 50%;
  transition: all 0.2s ease;
  object-fit: contain;
  cursor: pointer;
}

/* .interactive-icon:hover {
  transform: scale(1.1);
} */

.icon-button {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 0.5rem;
  background: transparent;
  border: 1px solid transparent;
  color: var(--primary);
  flex-shrink: 0;
}

.icon-button:hover {
  background: rgba(99, 102, 241, 0.1);
  transform: scale(1.05);
}

.icon-button svg {
  width: 28px;
  height: 28px;
  color: var(--primary);
  fill: currentColor;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.icon-button img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  transition: all 0.2s ease;
  flex-shrink: 0;
  display: block;
}

.icon-button:hover svg {
  color: var(--primary-dark);
  transform: scale(1.1);
}

.icon-button:hover img {
  transform: scale(1.1);
}

.user-icon {
  display: block !important;
  visibility: visible !important;
}
/* .icon-button:hover {
  transform: scale(1.1);
} */

/* סל קניות */
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

/* תפריט משתמש */
.user-menu-wrapper {
  position: relative;
  cursor: pointer;
}
.user-dropdown {
  position: fixed;
  background: white;
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-xl);
  padding: 1.25rem;
  min-width: 220px;
  z-index: 10000;
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  transition: all 0.2s ease;
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
  padding: 0.75rem 1rem;
  background: var(--gradient-primary, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow, 0 4px 6px rgba(0, 0, 0, 0.1));
  font-family: 'Courier New', Courier, monospace;
}

.login-link:hover,
.user-dropdown button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg, 0 10px 15px rgba(0, 0, 0, 0.15));
}

/* אנימציה */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
