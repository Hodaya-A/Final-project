# 🧭 Navigation Integration Guide

## Adding Dashboard Links to Existing Navigation

### For Admin Users

Add to your existing admin navigation menu:

```vue
<!-- In your AdminNavigation or AdminMenu component -->
<router-link to="/admin/earnings" class="nav-link">
  📊 הרווחים שלנו
</router-link>
```

Or if using a sidebar:

```vue
<div class="admin-menu">
  <router-link to="/admin" class="menu-item">
    🏠 דף הבית
  </router-link>
  <router-link to="/admin/add-product" class="menu-item">
    ➕ הוסף מוצר
  </router-link>
  <router-link to="/admin/users" class="menu-item">
    👥 ניהול משתמשים
  </router-link>
  <router-link to="/admin/earnings" class="menu-item active-highlight">
    📊 הרווחים החודשיים
  </router-link>
  <router-link to="/admin/reports" class="menu-item">
    📈 דוחות
  </router-link>
</div>
```

### For Store Managers

Add to your existing store manager navigation:

```vue
<!-- In your StoreManagerNavigation component -->
<router-link to="/store/payouts" class="nav-link">
  💳 הכנסה שלי
</router-link>
```

Or in a dropdown menu:

```vue
<div class="store-menu">
  <router-link to="/store" class="menu-item">
    🏪 לוח בקרה
  </router-link>
  <router-link to="/store/payouts" class="menu-item">
    💳 הכנסה שלי החודש
  </router-link>
  <router-link to="/store/products" class="menu-item">
    📦 מוצרים
  </router-link>
  <router-link to="/store/pending-orders" class="menu-item">
    📬 הזמנות חדשות
  </router-link>
</div>
```

### For Couriers

Add to your existing courier dashboard:

```vue
<!-- In your CourierNavigation or CourierDashboard component -->
<router-link to="/courier/wallet" class="nav-link">
  💰 הארנק שלי
</router-link>
```

Full courier menu example:

```vue
<div class="courier-menu">
  <router-link to="/courier" class="menu-item">
    🚚 משלוחים חדשים
  </router-link>
  <router-link to="/courier/wallet" class="menu-item">
    💰 הארנק שלי
  </router-link>
  <router-link to="/notifications" class="menu-item">
    🔔 הודעות
  </router-link>
</div>
```

---

## Quick Links Reference

| Role          | Route             | Component              | Translation  |
| ------------- | ----------------- | ---------------------- | ------------ |
| Admin         | `/admin/earnings` | AdminEarningsDashboard | הרווחים שלנו |
| Store Manager | `/store/payouts`  | StorePayoutDashboard   | הכנסה שלי    |
| Courier       | `/courier/wallet` | CourierWallet          | הארנק שלי    |

---

## Existing Navigation Files to Update

### If you have a navbar component:

**File:** `frontend/src/components/NavBar.vue` (or similar)

```vue
<template>
  <nav>
    <!-- ... existing nav items ... -->

    <!-- Add conditional rendering based on user role -->
    <router-link v-if="isAdmin" to="/admin/earnings" class="nav-link">
      📊 הרווחים
    </router-link>

    <router-link v-if="isStoreManager" to="/store/payouts" class="nav-link">
      💳 הכנסה
    </router-link>

    <router-link v-if="isCourier" to="/courier/wallet" class="nav-link">
      💰 ארנק
    </router-link>
  </nav>
</template>

<script setup>
import { useUserStore } from "@/stores/userStore";
import { computed } from "vue";

const userStore = useUserStore();

const isAdmin = computed(() => userStore.isAdmin);
const isStoreManager = computed(() => userStore.role === "storeManager");
const isCourier = computed(() => userStore.role === "courier");
</script>
```

### If you have a sidebar component:

**File:** `frontend/src/components/Sidebar.vue` (or similar)

```vue
<template>
  <aside class="sidebar">
    <div v-if="isAdmin" class="admin-section">
      <h3>📊 ניתוח נתונים</h3>
      <router-link to="/admin/earnings" class="sidebar-link">
        הרווחים החודשיים
      </router-link>
    </div>

    <div v-if="isStoreManager" class="store-section">
      <h3>🏪 החנות שלי</h3>
      <router-link to="/store/payouts" class="sidebar-link">
        הכנסה לחודש זה
      </router-link>
    </div>

    <div v-if="isCourier" class="courier-section">
      <h3>🚚 משלוחים</h3>
      <router-link to="/courier/wallet" class="sidebar-link">
        הארנק שלי
      </router-link>
    </div>
  </aside>
</template>
```

### If you have a user menu (dropdown):

**File:** `frontend/src/components/UserMenu.vue` (or similar)

```vue
<template>
  <div class="user-menu">
    <button @click="toggleMenu" class="menu-trigger">
      {{ userStore.userName }} ▼
    </button>

    <div v-show="menuOpen" class="menu-dropdown">
      <!-- Dashboard link -->
      <router-link to="/admin/earnings" v-if="isAdmin" class="menu-item">
        📊 לוח הרווחים
      </router-link>

      <router-link to="/store/payouts" v-if="isStoreManager" class="menu-item">
        💳 הכנסה שלי
      </router-link>

      <router-link to="/courier/wallet" v-if="isCourier" class="menu-item">
        💰 הארנק שלי
      </router-link>

      <!-- Other menu items -->
      <router-link to="/my-orders" class="menu-item">
        📦 ההזמנות שלי
      </router-link>

      <button @click="logout" class="menu-item logout">🚪 התנתקות</button>
    </div>
  </div>
</template>
```

---

## Styling Integration

### For your existing nav styling:

```css
/* Use existing classes */
.nav-link {
  /* Your existing styles */
}

.nav-link:hover {
  /* Your existing hover styles */
}

.menu-item {
  /* Your existing styles */
}

.sidebar-link {
  /* Your existing styles */
}

/* Add icon styling if needed */
.nav-link::before {
  content: "📊"; /* Icon will be added by emoji */
  margin-left: 0.5rem;
}
```

---

## Routing Guard Integration

The routes already have proper meta tags:

```typescript
// Admin route
{
  path: '/admin/earnings',
  meta: { requiresAdmin: true, requiresAuth: true },
}

// Store route
{
  path: '/store/payouts',
  meta: { requiresAuth: true, roles: ['storeManager'] },
}

// Courier route
{
  path: '/courier/wallet',
  meta: { requiresAuth: true, roles: ['courier'] },
}
```

Your existing router guard will automatically protect these routes!

---

## Example: Complete Admin Section Navigation

If you want to reorganize your admin section:

```vue
<template>
  <div class="admin-section">
    <div class="admin-header">
      <h1>🏢 אדמין</h1>
    </div>

    <nav class="admin-nav">
      <!-- Dashboard -->
      <router-link to="/admin" class="nav-group-label">
        🏠 דף הבית
      </router-link>

      <!-- Product Management -->
      <div class="nav-group">
        <h3>📦 ניהול מוצרים</h3>
        <router-link to="/admin/add-product"> ➕ הוסף מוצר </router-link>
        <router-link to="/admin/products"> 📋 כל המוצרים </router-link>
      </div>

      <!-- User Management -->
      <div class="nav-group">
        <h3>👥 ניהול משתמשים</h3>
        <router-link to="/admin/users"> 👤 משתמשים </router-link>
        <router-link to="/admin/roles"> 🔐 הרשאות </router-link>
      </div>

      <!-- Analytics & Reports -->
      <div class="nav-group">
        <h3>📊 ניתוח נתונים</h3>
        <router-link to="/admin/earnings" class="nav-item-highlight">
          💰 הרווחים החודשיים
        </router-link>
        <router-link to="/admin/reports"> 📈 דוחות מפורטים </router-link>
        <router-link to="/admin/analytics"> 🔍 ניתוח קדום </router-link>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.admin-section {
  padding: 2rem;
}

.nav-group {
  margin-bottom: 2rem;
}

.nav-group h3 {
  margin-bottom: 1rem;
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.nav-item-highlight {
  background-color: #fff3cd;
  font-weight: bold;
}
</style>
```

---

## Example: Complete Store Manager Section

```vue
<template>
  <div class="store-section">
    <div class="store-header">
      <h1>🏪 {{ storeName }}</h1>
      <span class="status-badge">פעיל</span>
    </div>

    <nav class="store-nav">
      <!-- Overview -->
      <router-link to="/store" class="nav-item"> 📊 סקירה כללית </router-link>

      <!-- Orders -->
      <div class="nav-group">
        <h3>📬 הזמנות</h3>
        <router-link to="/store/pending-orders"> ⏳ הזמנות חדשות </router-link>
        <router-link to="/store/orders"> 📋 כל ההזמנות </router-link>
      </div>

      <!-- Products -->
      <div class="nav-group">
        <h3>📦 מוצרים</h3>
        <router-link to="/store/products"> 📋 ניהול מוצרים </router-link>
        <router-link to="/store/inventory"> 🎯 מלאי </router-link>
      </div>

      <!-- Financial -->
      <div class="nav-group">
        <h3>💳 כלכלה</h3>
        <router-link to="/store/payouts" class="nav-item-highlight">
          💰 הכנסה לחודש זה
        </router-link>
        <router-link to="/store/transactions">
          📝 היסטוריית תשלומים
        </router-link>
        <router-link to="/store/bank-details"> 🏦 פרטי בנק </router-link>
      </div>
    </nav>
  </div>
</template>
```

---

## Example: Courier Dashboard Integration

```vue
<template>
  <div class="courier-dashboard">
    <!-- Main actions -->
    <div class="courier-actions">
      <router-link to="/courier" class="action-card">
        <span class="icon">🚚</span>
        <span>משלוחים חדשים</span>
      </router-link>

      <router-link to="/courier/wallet" class="action-card highlight">
        <span class="icon">💰</span>
        <span>הארנק שלי</span>
      </router-link>

      <router-link to="/notifications" class="action-card">
        <span class="icon">🔔</span>
        <span>הודעות</span>
      </router-link>
    </div>

    <!-- Quick stats -->
    <div class="quick-stats">
      <div class="stat-card">
        <span class="label">משלוחים היום</span>
        <span class="value">{{ todayDeliveries }}</span>
      </div>
      <div class="stat-card">
        <span class="label">הכנסה היום</span>
        <span class="value">₪{{ todayEarnings }}</span>
      </div>
      <div class="stat-card">
        <span class="label">ארנק</span>
        <span class="value">₪{{ walletBalance }}</span>
      </div>
    </div>
  </div>
</template>
```

---

## CSS Tips for Integration

### RTL Navigation

```css
.nav-link {
  direction: rtl;
  text-align: right;
}

.nav-group {
  padding-right: 1rem; /* Indent right side */
}
```

### Active Route Styling

```css
.nav-link.router-link-active {
  background-color: #e3f2fd;
  border-right: 4px solid #1976d2; /* Right side for RTL */
}
```

### Dark Theme Support

```css
.nav-link {
  color: inherit;
  transition: background-color 0.2s;
}

.nav-link:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

@media (prefers-color-scheme: dark) {
  .nav-link:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
```

---

## Testing Navigation Integration

Before deploying, test that:

- [ ] Admin can see `/admin/earnings` link
- [ ] Store manager can see `/store/payouts` link
- [ ] Courier can see `/courier/wallet` link
- [ ] Non-authorized users cannot see links they don't have access to
- [ ] Links navigate to correct pages
- [ ] Pages load successfully when navigated to
- [ ] Active route highlighting works
- [ ] Navigation works on mobile
- [ ] RTL layout correct on desktop and mobile

---

## Next Steps

1. **Identify your navigation component** (NavBar, Sidebar, UserMenu, etc.)
2. **Add the appropriate links** using the examples above
3. **Test navigation** in all user roles
4. **Style to match** your existing design
5. **Deploy alongside** the dashboard components

---

**Ready to integrate!** Choose your navigation pattern and add the links above.
