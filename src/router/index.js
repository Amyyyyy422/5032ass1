// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'


import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import MapView from '../views/MapView.vue'

// simple auth state
import { isLogin } from '../auth'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/about', name: 'About', component: AboutView, meta: { requiresAuth: true } },
  { path: '/admin', name: 'Admin', component: AdminView, meta: { requiresAuth: true } },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/map', name: 'Map', component: MapView },
  { path: '/:pathMatch(.*)*', redirect: { name: 'Home' } }
]

const router = createRouter({
  history: createWebHistory(), 
  routes
})

// Very simple guard: block protected routes if not logged in
router.beforeEach((to) => {
  if (to.meta?.requiresAuth && !isLogin.value) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  // already logged-in going to login -> send to About
  if (to.name === 'Login' && isLogin.value) {
    return { name: 'About' }
  }
  return true
})

export default router