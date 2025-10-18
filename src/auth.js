import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { ref } from 'vue'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export const isLogin = ref(false)
export const currentUser = ref(null)
export const currentRole = ref(null)

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    isLogin.value = false
    currentUser.value = null
    currentRole.value = null
    return
  }
  isLogin.value = true
  currentUser.value = user.displayName || user.email || 'User'
  try {
    const snap = await getDoc(doc(db, 'users', user.uid))
    currentRole.value = snap.exists() ? (snap.data().role || 'user') : 'user'
  } catch {
    currentRole.value = 'user'
  }
})

export async function loginWithEmail(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  return user
}

export async function logout() {
  await signOut(auth)
}
