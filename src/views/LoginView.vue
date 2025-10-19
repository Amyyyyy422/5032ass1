<template>
  <!-- Real-time reporting area -->
  <div id="login-live-region" aria-live="polite" aria-atomic="true" class="visually-hidden"></div>
  
  <section class="container my-5" style="max-width: 520px">
    <!-- welcome title -->
    <div class="text-center mb-4">
      <h1 class="welcome-title mb-3">Welcome to our Youth Mental Health and Wellbeing Website!</h1>
      <p class="login-subtitle">Please log in to access your account</p>
    </div>

    <form @submit.prevent="onLogin" novalidate>
      <div class="mb-3">
        <label for="login-email" class="form-label fw-semibold">Email <span class="text-danger" aria-hidden="true">*</span></label>
        <input 
          id="login-email"
          v-model.trim="email" 
          type="email" 
          class="form-control" 
          :class="{ 'is-invalid': emailError, 'is-valid': email && !emailError }"
          @blur="validateEmail"
          @keydown="(e) => handleKeyDown(e, 'login-password')"
          :aria-describedby="emailError ? 'email-error' : undefined"
          :aria-invalid="!!emailError"
          :aria-required="true"
          required 
        />
        <div v-if="emailError" id="email-error" class="invalid-feedback" role="alert">
          {{ emailError }}
        </div>
      </div>

      <div class="mb-3">
        <label for="login-password" class="form-label fw-semibold">Password <span class="text-danger" aria-hidden="true">*</span></label>
        <input 
          id="login-password"
          v-model="password" 
          type="password" 
          class="form-control" 
          :class="{ 'is-invalid': passwordError, 'is-valid': password && !passwordError }"
          @blur="validatePassword"
          @keydown="(e) => handleKeyDown(e, 'login-submit')"
          :aria-describedby="passwordError ? 'password-error' : undefined"
          :aria-invalid="!!passwordError"
          :aria-required="true"
          required 
        />
        <div v-if="passwordError" id="password-error" class="invalid-feedback" role="alert">
          {{ passwordError }}
        </div>
      </div>

      <div class="text-center">
        <div class="d-inline-flex gap-2 flex-wrap justify-content-center">
          <button 
            id="login-submit"
            class="btn btn-primary px-4" 
            type="submit" 
            :disabled="loading"
            :aria-describedby="errorMsg ? 'login-error-message' : undefined"
          >
            {{ loading ? 'Signing in…' : 'Log in' }}
          </button>
          <button 
            class="btn btn-outline-secondary px-4" 
            type="button" 
            @click="clear" 
            :disabled="loading"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="errorMsg" id="login-error-message" class="mt-3 alert alert-danger" role="alert">
        <strong>Error:</strong> {{ errorMsg }}
      </div>

      <!-- Accessibility links -->
      <div class="mt-4 pt-3 border-top">
        <div class="text-center">
          <p class="mb-2">
            <a href="#" class="text-decoration-none" @click.prevent="handleForgotPassword">
              Forgot your password?
            </a>
          </p>
          <p class="mb-0">
            Don't have an account? 
            <a href="#" class="text-decoration-none fw-semibold" @click.prevent="handleRegister">
              Register here
            </a>
          </p>
        </div>
      </div>
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

const emailError = ref('')
const passwordError = ref('')

const validateEmail = () => {
  const emailValue = email.value.trim()
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  
  if (!emailValue) {
    emailError.value = 'Email is required.'
  } else if (!emailRegex.test(emailValue)) {
    emailError.value = 'Please enter a valid email address.'
  } else {
    emailError.value = ''
  }
}

const validatePassword = () => {
  if (!password.value) {
    passwordError.value = 'Password is required.'
  } else if (password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters long.'
  } else {
    passwordError.value = ''
  }
}

// Keyboard navigation support
const handleKeyDown = (event, nextFieldId) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    const nextField = document.getElementById(nextFieldId)
    if (nextField) {
      nextField.focus()
    }
  }
}

// Password reset processing - Display administrator email address
const handleForgotPassword = () => {
  errorMsg.value = 'Please contact administrator amyren123456@gmail.com'
  
  const liveRegion = document.getElementById('login-live-region')
  if (liveRegion) {
    liveRegion.textContent = 'Please contact administrator amyren123456@gmail.com for password assistance'
  }
}

// Register navigation
const handleRegister = () => {
  router.push({ name: 'Home' }) 
}

function clear() {
  email.value = ''
  password.value = ''
  errorMsg.value = ''
  emailError.value = ''
  passwordError.value = ''
}

async function onLogin() {
  errorMsg.value = ''
  emailError.value = ''
  passwordError.value = ''
  
  validateEmail()
  validatePassword()
  
  if (emailError.value || passwordError.value) {
    errorMsg.value = 'Please fix the errors above before submitting.'
    
    const firstErrorField = document.querySelector('[aria-invalid="true"]')
    if (firstErrorField) {
      firstErrorField.focus()
    }
    return
  }

  loading.value = true
  
  // Screen reader announces the login status
  const liveRegion = document.getElementById('login-live-region')
  if (liveRegion) {
    liveRegion.textContent = 'Signing in, please wait...'
  }
  
  try {
    await loginWithEmail(email.value, password.value)

    // Obtain the user role
    const uid = auth.currentUser?.uid
    let role = 'user'
    if (uid) {
      const snap = await getDoc(doc(db, 'users', uid))
      if (snap.exists() && snap.data().role) role = snap.data().role
    }

    // Screen reader announces the login status
    if (liveRegion) {
      liveRegion.textContent = `Login successful. Redirecting to ${role === 'admin' ? 'admin' : 'main'} page.`
    }

    // Navigate based on role
    if (role === 'admin') {
      router.push({ name: 'Admin' })
    } else {
      router.push({ name: 'Map' })
    }
  } catch (e) {
    const errorMessage = e?.message || 'Login failed'
    errorMsg.value = errorMessage

    // Screen reader announces the error
    if (liveRegion) {
      liveRegion.textContent = `Login error: ${errorMessage}`
    }

    // Provide specific guidance based on the error type
    if (errorMessage.includes('invalid-credential') || errorMessage.includes('wrong-password')) {
      errorMsg.value = 'Invalid email or password. Please check your credentials and try again.'
    } else if (errorMessage.includes('too-many-requests')) {
      errorMsg.value = 'Too many failed login attempts. Please try again later.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.welcome-title {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.8rem;
  line-height: 1.3;
  margin-bottom: 1rem;
}

.login-subtitle {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 1.3rem;
  color: #6c757d;
  font-weight: 500;
  margin-bottom: 2rem;
}

.form-control:focus,
.btn:focus {
  border-color: #275fda;
  box-shadow: 0 0 0 0.25rem rgba(39, 95, 218, 0.25);
  outline: 2px solid #275fda;
  outline-offset: 2px;
}

.is-valid {
  border-color: #198754 !important;
}

.is-invalid {
  border-color: #dc3545 !important;
}

.invalid-feedback {
  display: block;
  font-weight: 500;
}

.visually-hidden {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

.text-decoration-none {
  color: #275fda;
  transition: color 0.2s ease;
}

.text-decoration-none:hover,
.text-decoration-none:focus {
  color: #1a4bb3;
  text-decoration: underline !important;
}

.alert-danger {
  border: 2px solid #dc3545;
  font-weight: 500;
}

@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }
  
  .welcome-title {
    font-size: 1.5rem;
  }
  
  .login-subtitle {
    font-size: 1.1rem;
  }
  
  .d-inline-flex {
    flex-direction: column;
    gap: 0.5rem !important;
  }
  
  .btn {
    width: 100%;
  }
}

/* High contrast support */
@media (prefers-contrast: high) {
  .welcome-title {
    color: #000;
  }
  
  .login-subtitle {
    color: #333 !important;
  }
  
  .text-muted {
    color: #333 !important;
  }
  
  .btn-primary {
    background-color: #0044cc;
    border-color: #0044cc;
  }
}

/* Reduce motion support */
@media (prefers-reduced-motion: reduce) {
  .text-decoration-none {
    transition: none;
  }
}
</style>
