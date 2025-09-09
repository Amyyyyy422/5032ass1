import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import { isLogin } from '../auth'

const routes = [
  { 
    path: '/',
    name: 'Home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'About',
    component: AboutView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  }
]


const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  // Accessing restricted routes, no login -> Go to Login
  if (to.meta?.requiresAuth && !isLogin.value) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  // Already logged in but accessing login page -> Redirect to About
  if (to.name === 'Login' && isLogin.value) {
    return { name: 'About' }
  }
  // Other routes are allowed
})

export default router
