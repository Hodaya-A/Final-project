import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import CartView from '@/views/CartView.vue'
import AdminDashboardView from '@/views/AdminDashboard.vue'
import AddProductView from '@/views/AddProductView.vue'
import UserManagementView from '@/views/UserManagementView.vue'
import ThankYouView from '@/views/ThankYouView.vue'
import MyOrdersView from '@/views/MyOrdersView.vue'

import { useUserStore } from '@/stores/user'
import { auth } from '@/services/firebase'

const routes: RouteRecordRaw[] = [
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
    path: '/thank-you',
    name: 'thank-you',
    component: ThankYouView,
  },
  {
    path: '/checkout',
    name: 'checkout',
    component: () => import('@/views/ThankYouView.vue'),
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

  // ---- Admin ----
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminDashboardView,
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
    component: () => import('@/views/StoreManagerDashboard.vue'),
    meta: { requiresAuth: true, roles: ['storeManager'] },
  },
  // {
  // path: '/store-products',
  // name: 'store-products',
  // component: () => import('@/views/StoreProducts.vue'),
  // meta: { requiresAuth: true, roles: ['storeManager'] },
  // },
  // {
  // path: '/store-reports',
  // name: 'store-reports',
  // component: () => import('@/views/StoreReports.vue'),
  // meta: { requiresAuth: true, roles: ['storeManager'] },
  // },

  // אופציונלי 404:
  // { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// גארד גלובלי
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  const requiresAuth = Boolean(to.meta?.requiresAuth)
  const requiresAdmin = Boolean(to.meta?.requiresAdmin)
  const allowedRoles = (to.meta?.roles as string[] | undefined) || []

  const isLoggedIn = !!auth.currentUser

  // דרוש חיבור
  if (requiresAuth && !isLoggedIn) {
    return next({ path: '/auth', query: { redirect: to.fullPath } })
  }

  // וודאי שה־store טעון (תפקיד, storeId וכו')
  if (!userStore.role && isLoggedIn) {
    // פעולה שאת הוספת ב־pinia כדי למשוך את users/{uid}
    if (typeof userStore.hydrateFromAuth === 'function') {
      await userStore.hydrateFromAuth()
    }
  }

  // אדמין
  if (requiresAdmin) {
    const isAdmin =
      userStore.role === 'admin' ||
      // אם שמרת דגל isAdmin ב-store
      // ts-ignore
      userStore.isAdmin === true
    if (!isAdmin) {
      return next('/')
    }
  }

  // תפקידי גישה ספציפיים
  if (allowedRoles.length > 0) {
    if (!userStore.role || !allowedRoles.includes(userStore.role)) {
      return next('/')
    }
  }

  next()
})

export default router
