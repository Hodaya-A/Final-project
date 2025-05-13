import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import CartView from '../views/CartView.vue'
// import LoginView from '../views/LoginView.vue'
// import RegisterView from '../views/RegisterView.vue'
// import ProductDetailsView from '../views/ProductDetailsView.vue'
// import BusinessDashboardView from '../views/BusinessDashboardView.vue'
// import NotFoundView from '../views/NotFoundView.vue'

const routes = [
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

  // הנתיבים הבאים יוחזרו רק כשיהיו קבצים תואמים:
  // {
  //   path: '/login',
  //   name: 'login',
  //   component: LoginView,
  // },
  // {
  //   path: '/register',
  //   name: 'register',
  //   component: RegisterView,
  // },
  // {
  //   path: '/product/:id',
  //   name: 'product-details',
  //   component: ProductDetailsView,
  //   props: true,
  // },
  // {
  //   path: '/business',
  //   name: 'business-dashboard',
  //   component: BusinessDashboardView,
  // },
  // {
  //   path: '/:pathMatch(.*)*',
  //   name: 'not-found',
  //   component: NotFoundView,
  // },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
