import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import MapView from '@/views/MapView.vue'
import AdminPanel from '@/views/AdminPanel.vue'
import LoginView from '@/views/LoginView.vue'
import { auth, db } from '@/auth'
import { doc, getDoc } from 'firebase/firestore'

function waitForAuthInit() {
  return new Promise(resolve => {
    const off = auth.onAuthStateChanged(() => {
      off()
      resolve()
    })
  })
}

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/map', name: 'Map', component: MapView, meta: { requiresAuth: true, roles: ['user','admin'] } },
  { path: '/admin', name: 'Admin', component: AdminPanel, meta: { requiresAuth: true, roles: ['admin'] } },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/:pathMatch(.*)*', redirect: { name: 'Map' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  
  if (!to.meta.requiresAuth) return next()

  await waitForAuthInit()
  const user = auth.currentUser
  if (!user) {
    
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  
  if (to.meta.roles && Array.isArray(to.meta.roles)) {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid))
      const role = snap.exists() ? (snap.data().role || 'user') : 'user'
      if (!to.meta.roles.includes(role)) {
        
        return next({ name: 'Map' })
      }
    } catch {
      
      return next({ name: 'Map' })
    }
  }

  next()
})

export default router