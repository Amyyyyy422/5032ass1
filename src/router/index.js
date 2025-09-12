// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// Views（相对路径，最不容易报错）
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'

// simple auth state
import { isLogin } from '../auth'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/about', name: 'About', component: AboutView, meta: { requiresAuth: true } },
  // 👉 Admin 路由（仅要求已登录，保持简单）
  { path: '/admin', name: 'Admin', component: AdminView, meta: { requiresAuth: true } },
  { path: '/login', name: 'Login', component: LoginView },
  // 可选：兜底重定向
  { path: '/:pathMatch(.*)*', redirect: { name: 'Home' } }
]

const router = createRouter({
  history: createWebHistory(), // 用 Vite 的默认 base 也可以：import.meta.env.BASE_URL
  routes
})

// Very simple guard: block protected routes if not logged in
router.beforeEach((to) => {
  if (to.meta?.requiresAuth && !isLogin.value) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  // already logged-in going to login -> send to About（随意，也可改成 Home）
  if (to.name === 'Login' && isLogin.value) {
    return { name: 'About' }
  }
  return true
})

export default router