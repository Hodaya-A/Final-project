import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import CartView from '../views/CartView.vue'
import AdminDashboardView from '../views/AdminDashboard.vue'
import AddProductView from '../views/AddProductView.vue'
import UserManagementView from '../views/UserManagementView.vue'
import UserProfile from '../views/UserProfile.vue'
import ThankYouView from '@/views/ThankYouView.vue'
import MyOrdersView from '@/views/MyOrdersView.vue'

import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
  },
  {
    path: '/map',
    name: 'ProductMapView',
    component: () => import('@/views/ProductMapView.vue'),
  },
  {
    path: '/my-orders',
    name: 'my-orders',
    component: MyOrdersView,
    meta: { requiresAuth: true },
  },
  {
    path: '/debug-user',
    name: 'debug-user',
    component: () => import('@/views/UserStatusDebug.vue'),
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('@/views/NotificationsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/notification-settings',
    name: 'notification-settings',
    component: () => import('@/views/NotificationSettingsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/shop/inventory',
    name: 'ShopInventory',
    component: () => import('@/views/ShopInventoryView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/thank-you',
    name: 'thank-you',
    component: ThankYouView,
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/views/PaymentView.vue'),
  },
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/cart',
    name: 'cart',
    component: CartView,
  },
  {
    path: '/product/:id',
    name: 'product-details',
    component: () => import('@/views/ProductDetailsView.vue'),
    props: true,
  },
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/views/AuthView.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: UserProfile,
    meta: { requiresAuth: true },
  },

  // ---- Admin ----
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminDashboardView,
    meta: { requiresAdmin: true, requiresAuth: true },
  },
  {
    path: '/admin/earnings',
    name: 'admin-earnings',
    component: () => import('@/components/AdminEarningsDashboard.vue'),
    meta: { requiresAdmin: true, requiresAuth: true },
  },
  {
    path: '/admin/add-product',
    name: 'add-product',
    component: AddProductView,
    meta: { requiresAdmin: true, requiresAuth: true },
  },
  {
    path: '/admin/users',
    name: 'user-management',
    component: UserManagementView,
    meta: { requiresAdmin: true, requiresAuth: true },
  },
  {
    path: '/admin/reports',
    name: 'admin-reports',
    component: () => import('@/views/AdminReportsView.vue'),
    meta: { requiresAdmin: true, requiresAuth: true },
  },

  // ---- Store Manager ----
  {
    path: '/store',
    name: 'store-dashboard',
    component: () => import('@/views/store-manager/StoreManagerDashboard.vue'),
    meta: { requiresAuth: true, roles: ['storeManager'] },
  },
  {
    path: '/store/payouts',
    name: 'store-payouts',
    component: () => import('@/components/StorePayoutDashboard.vue'),
    meta: { requiresAuth: true, roles: ['storeManager'] },
  },
  {
    path: '/store/pending-orders',
    name: 'pending-orders',
    component: () => import('@/views/PendingOrdersView.vue'),
    meta: { requiresAuth: true, roles: ['storeManager'] },
  },
  {
    path: '/store/products',
    name: 'store-products',
    component: () => import('@/views/store-manager/StoreProductManager.vue'),
    meta: { requiresAuth: true, roles: ['storeManager'] },
  },
  {
    path: '/store/reports',
    name: 'store-reports',
    component: () => import('@/views/store-manager/StoreReportsView.vue'),
    meta: { requiresAuth: true, roles: ['storeManager'] },
  },

  // ---- Courier ----
  {
    path: '/courier',
    name: 'courier-dashboard',
    component: () => import('@/views/CourierDashboard.vue'),
    // ✅ תיקון: הוספתי כאן את בדיקת התפקיד כדי שלא כולם יוכלו להיכנס
    meta: { requiresAuth: true, roles: ['courier'] },
  },
  {
    path: '/courier/wallet',
    name: 'courier-wallet',
    component: () => import('@/components/CourierWallet.vue'),
    meta: { requiresAuth: true, roles: ['courier'] },
  },

  // אופציונלי: דף 404 (מומלץ להשאיר פעיל אם יש לך קומפוננטה כזו)
  // { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0, behavior: 'smooth' }
  },
})

// ✅ הגנה משופרת על הנתיבים
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // 1. אתחול המשתמש
  try {
    await userStore.initializeUser()
  } catch (e) {
    console.warn('User initialization error in router guard', e)
  }

  // 2. בדיקת אדמין
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    // אם נדרש אדמין והמשתמש אינו אדמין -> לדף הבית
    return next('/')
  }

  // 3. בדיקת התחברות כללית
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // אם נדרשת התחברות והמשתמש לא מחובר -> לדף התחברות
    return next('/auth')
  }

  // 4. ✅ בדיקת תפקידים (Roles) - התיקון הקריטי
  if (to.meta.roles) {
    const requiredRoles = to.meta.roles as string[]

    // בדיקה מיוחדת לשליחים - תומך גם ב-role וגם ב-isCourier
    if (requiredRoles.includes('courier')) {
      if (!userStore.isCourier) {
        console.warn('Access denied: courier role required', {
          role: userStore.role,
          isCourier: userStore.isCourier,
        })
        return next('/')
      }
    } else {
      // בדיקה רגילה לתפקידים אחרים
      const userRole = userStore.role
      if (!userRole || !requiredRoles.includes(userRole)) {
        console.warn('Access denied: role mismatch', { required: requiredRoles, actual: userRole })
        return next('/')
      }
    }
  }

  // אם הכל תקין, המשך לנתיב
  next()
})

export default router
