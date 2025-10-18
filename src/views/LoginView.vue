<template>
  <section class="container my-5" style="max-width: 520px">
    <h1 class="mb-3 text-center">Log in</h1>

    <form @submit.prevent="onLogin">
      <div class="mb-3">
        <label class="form-label">Email</label>
        <input v-model.trim="email" type="email" class="form-control" required />
      </div>

      <div class="mb-3">
        <label class="form-label">Password</label>
        <input v-model="password" type="password" class="form-control" required />
      </div>

      <div class="text-center">
        <div class="d-inline-flex gap-2">
          <button class="btn btn-primary" type="submit" :disabled="loading">
            {{ loading ? 'Signing in…' : 'Log in' }}
          </button>
          <button class="btn btn-outline-secondary" type="button" @click="clear" :disabled="loading">
            Clear
          </button>
        </div>
      </div>

      <p v-if="errorMsg" class="text-danger mt-3">{{ errorMsg }}</p>
    </form>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db, loginWithEmail } from '@/auth'  
import { doc, getDoc } from 'firebase/firestore'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

function clear() {
  email.value = ''
  password.value = ''
  errorMsg.value = ''
}

async function onLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    
    await loginWithEmail(email.value, password.value)

    
    const uid = auth.currentUser?.uid
    let role = 'user'
    if (uid) {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists() && snap.data().role) role = snap.data().role
    }

    
    if (role === 'admin') router.push({ name: 'Admin' })
    else router.push({ name: 'Map' })
  } catch (e) {
    errorMsg.value = e?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.text-danger { font-size: .9rem; }
</style>

