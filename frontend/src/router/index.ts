import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import CartView from '../views/CartView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ProductCard from '../components/ProductCard.vue'
import AdminDashboardView from '../views/AdminDashboard.vue'
import AddProductView from '../views/AddProductView.vue'
import UserManagementView from '../views/UserManagementView.vue'
import ThankYouView from '@/views/ThankYouView.vue'
import MyOrdersView from '@/views/MyOrdersView.vue' // ✅ חדש
import AdminReportsView from '@/views/AdminReportsView.vue'

import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/map',
    name: 'ProductMapView',
    component: () => import('@/views/ProductMapView.vue'),
  },
  {
    path: '/orders',
    name: 'orders',
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
  component: () => import('@/views/ThankYouView.vue')
}
,
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
    name: 'ProductDetails',
    component: () => import('@/views/ProductDetailsView.vue'),
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/AuthView.vue'),
  },
  {
    path: '/product/:id',
    name: 'product-details',
    component: ProductCard,
    props: true,
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminDashboardView,
    meta: { requiresAdmin: true },
  },
  {
    path: '/admin/add-product',
    name: 'add-product',
    component: AddProductView,
    meta: { requiresAdmin: true },
  },
  {
    path: '/admin/users',
    name: 'user-management',
    component: UserManagementView,
    meta: { requiresAdmin: true },
  },
  // {
  // path: '/admin/reports',
  // name: 'admin-reports',
  // component: AdminReportsView,
  // meta: { requiresAdmin: true },
  // },
  {
    path: '/admin/reports',
    name: 'admin-reports',
    component: () => import('@/views/AdminReportsView.vue'),
    meta: { requiresAdmin: true },
  },

  // //404 אופציונלי
  // {
  //   path: '/:pathMatch(.*)*',
  //   name: 'not-found',
  //   component: NotFoundView,
  // }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// ✅ הגנה על דפים שדורשים הרשאת admin
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next('/')
  } else {
    next()
  }
})

export default router
