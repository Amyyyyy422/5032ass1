<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth, db } from '@/auth'
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'

const router = useRouter()

const formData = ref({
  username: '',
  gender: '',
  email: '',
  age: '',
  password: '',
  confirmPassword: '',
  reason: '',
  agree: false
})

const errors = ref({
  username: null,
  password: null,
  confirmPassword: null,
  email: null,
  age: null,
  gender: null,
  reason: null,
  agree: null
})

const loading = ref(false)
const errorMsg = ref('')
const okMsg = ref('')

// Add ARIA support to the error message
const errorIds = ref({
  username: 'username-error',
  email: 'email-error', 
  age: 'age-error',
  password: 'password-error',
  confirmPassword: 'confirm-password-error',
  reason: 'reason-error',
  agree: 'agree-error'
})

const validateName = (blur) => {
  if (formData.value.username.length < 3) {
    if (blur) errors.value.username = 'Name must be at least 3 characters.'
  } else {
    errors.value.username = null
  }
}

const validateEmail = (blur) => {
  const email = formData.value.email.trim()
  const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  if (!email) {
    if (blur) errors.value.email = 'Email is required.'
  } else if (!re.test(email)) {
    if (blur) errors.value.email = 'Please enter a valid email address.'
  } else {
    errors.value.email = null
  }
}

const validateAge = (blur) => {
  const n = Number(formData.value.age)
  const isInteger = Number.isInteger(n)
  if (formData.value.age === '') {
    if (blur) errors.value.age = 'Age is required.'
  } else if (!isInteger) {
    if (blur) errors.value.age = 'Age must be a whole number.'
  } else if (n < 12 || n > 99) {
    if (blur) errors.value.age = 'Age must be between 12 and 99.'
  } else {
    errors.value.age = null
  }
}

const validatePassword = (blur) => {
  const password = formData.value.password
  const minLength = 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (password.length < minLength) {
    if (blur) errors.value.password = `Password must be at least ${minLength} characters long.`
  } else if (!hasUppercase) {
    if (blur) errors.value.password = 'Password must contain at least one uppercase letter.'
  } else if (!hasLowercase) {
    if (blur) errors.value.password = 'Password must contain at least one lowercase letter.'
  } else if (!hasNumber) {
    if (blur) errors.value.password = 'Password must contain at least one number.'
  } else if (!hasSpecialChar) {
    if (blur) errors.value.password = 'Password must contain at least one special character.'
  } else {
    errors.value.password = null
  }
}

const validateConfirmPassword = (blur) => {
  if (formData.value.password !== formData.value.confirmPassword) {
    if (blur) errors.value.confirmPassword = 'Passwords do not match.'
  } else {
    errors.value.confirmPassword = null
  }
}

const validateReason = (blur) => {
  
  if (formData.value.reason && formData.value.reason.toLowerCase().includes('friend')) {
    errors.value.reason = 'Great to have a friend.'
  } else {
    errors.value.reason = null
  }
}

const submitForm = async () => {
  errorMsg.value = ''
  okMsg.value = ''

  
  validateName(true)
  validateEmail(true)
  validateAge(true)
  validatePassword(true)
  validateConfirmPassword(true)
  validateReason(true)

  if (!formData.value.agree) {
    errors.value.agree = 'You must agree to the terms and conditions.'
  } else {
    errors.value.agree = null
  }

  const hasBlockingErrors =
    !!errors.value.username ||
    !!errors.value.email ||
    !!errors.value.age ||
    !!errors.value.password ||
    !!errors.value.confirmPassword ||
    !!errors.value.agree

  if (hasBlockingErrors) {
    // Move focus to the first error field
    const firstErrorField = document.querySelector('[aria-invalid="true"]')
    if (firstErrorField) {
      firstErrorField.focus()
    }
    return
  }

  loading.value = true
  try {
    
    const cred = await createUserWithEmailAndPassword(auth, formData.value.email, formData.value.password)
    const user = cred.user

    
    if (formData.value.username) {
      await updateProfile(user, { displayName: formData.value.username })
    }

    
    try { await sendEmailVerification(user) } catch {}

    
    await setDoc(doc(db, 'users', user.uid), {
      username: formData.value.username,
      email: formData.value.email,
      gender: formData.value.gender,
      age: Number(formData.value.age),
      reason: formData.value.reason || '',
      role: 'user',                         
      createdAt: serverTimestamp(),
    }, { merge: true })

    okMsg.value = 'Account created successfully.'
    clearForm()
    
    router.push({ name: 'Map' })
  } catch (e) {
    errorMsg.value = e?.message || 'Registration failed.'
    // Add ARIA support to the error message
    const liveRegion = document.getElementById('live-region')
    if (liveRegion) {
      liveRegion.textContent = errorMsg.value
    }
  } finally {
    loading.value = false
  }
}


const clearForm = () => {
  formData.value = {
    username: '',
    gender: '',
    email: '',
    age: '',
    password: '',
    confirmPassword: '',
    reason: '',
    agree: false
  }
  Object.keys(errors.value).forEach(k => (errors.value[k] = null))
  errorMsg.value = ''
  okMsg.value = ''
}

// Keyboard event handling
const handleKeyDown = (event, nextFieldId) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    const nextField = document.getElementById(nextFieldId)
    if (nextField) {
      nextField.focus()
    }
  }
}
</script>

<template>
  <!-- Live region for screen readers -->
  <div id="live-region" aria-live="polite" aria-atomic="true" class="visually-hidden"></div>
  
  <!-- title -->
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <h1 class="text-center">Register to get started!</h1>
        <div class="mb-4 text-start">
          <p class="mb-2">
            Are you in Australia, 12 to 25 or concerned about a young person 12 to 25?
          </p>
          <p class="mb-2">
            Creating an account is quick, easy, and gives you the choice to access any of these extras that you want to...
          </p>
          <ul class="mb-0">
            <li>access our professional services like 1-on-1 chat</li>
            <li>build a personal mental health toolkit with resources that you like</li>
            <li>participate in our community by contributing to chats or sharing resources</li>
            <li>save your activity and keep a private record of whatever you need</li>
          </ul>
        </div>

        <form @submit.prevent="submitForm" novalidate>
          <div class="row mb-3">
            <div class="col-md-6 col-sm-6">
              <label for="username" class="form-label fw-semibold">Username <span class="text-danger" aria-hidden="true">*</span></label>
              <input
                type="text"
                class="form-control"
                :class="{ 'is-invalid': errors.username, 'is-valid': formData.username && !errors.username }"
                id="username"
                @blur="() => validateName(true)"
                @input="() => validateName(false)"
                @keydown="(e) => handleKeyDown(e, 'gender')"
                v-model="formData.username"
                :aria-describedby="errorIds.username"
                :aria-invalid="!!errors.username"
                :aria-required="true"
                required
              />
              <div v-if="errors.username" :id="errorIds.username" class="invalid-feedback" role="alert">
                {{ errors.username }}
              </div>
            </div>

            <div class="col-md-6 col-sm-6">
              <label for="gender" class="form-label fw-semibold">Gender <span class="text-danger" aria-hidden="true">*</span></label>
              <select 
                class="form-select" 
                :class="{ 'is-invalid': errors.gender, 'is-valid': formData.gender && !errors.gender }"
                id="gender" 
                v-model="formData.gender" 
                @keydown="(e) => handleKeyDown(e, 'email')"
                :aria-required="true"
                required
              >
                <option value="">Please select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <div v-if="errors.gender" class="invalid-feedback" role="alert">
                {{ errors.gender }}
              </div>
            </div>
          </div>
           
          <!-- Add second line: Email / Age -->
          <div class="row mb-3">
            <div class="col-md-6 col-sm-6">
              <label for="email" class="form-label fw-semibold">Email <span class="text-danger" aria-hidden="true">*</span></label>
              <input
                type="email"
                class="form-control"
                :class="{ 'is-invalid': errors.email, 'is-valid': formData.email && !errors.email }"
                id="email"
                @blur="() => validateEmail(true)"
                @input="() => validateEmail(false)"
                @keydown="(e) => handleKeyDown(e, 'age')"
                v-model="formData.email"
                :aria-describedby="errorIds.email"
                :aria-invalid="!!errors.email"
                :aria-required="true"
                required
              />
              <div v-if="errors.email" :id="errorIds.email" class="invalid-feedback" role="alert">
                {{ errors.email }}
              </div>
            </div>

            <div class="col-md-6 col-sm-6">
              <label for="age" class="form-label fw-semibold">Age <span class="text-danger" aria-hidden="true">*</span></label>
              <input
                type="number"
                class="form-control"
                :class="{ 'is-invalid': errors.age, 'is-valid': formData.age && !errors.age }"
                id="age"
                @blur="() => validateAge(true)"
                @input="() => validateAge(false)"
                @keydown="(e) => handleKeyDown(e, 'password')"
                v-model="formData.age"
                :aria-describedby="errorIds.age"
                :aria-invalid="!!errors.age"
                :aria-required="true"
                required
              />
              <div v-if="errors.age" :id="errorIds.age" class="invalid-feedback" role="alert">
                {{ errors.age }}
              </div>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-6 col-sm-6">
              <label for="password" class="form-label fw-semibold">Password <span class="text-danger" aria-hidden="true">*</span></label>
              <input
                type="password"
                class="form-control"
                :class="{ 'is-invalid': errors.password, 'is-valid': formData.password && !errors.password }"
                id="password"
                @blur="() => validatePassword(true)"
                @input="() => validatePassword(false)"
                @keydown="(e) => handleKeyDown(e, 'confirm-password')"
                v-model="formData.password"
                :aria-describedby="errorIds.password"
                :aria-invalid="!!errors.password"
                :aria-required="true"
                required
              />
              <div v-if="errors.password" :id="errorIds.password" class="invalid-feedback" role="alert">
                {{ errors.password }}
              </div>
            </div>

            <div class="col-md-6 col-sm-6">
              <label for="confirm-password" class="form-label fw-semibold">Confirm password <span class="text-danger" aria-hidden="true">*</span></label>
              <input
                type="password"
                class="form-control"
                :class="{ 'is-invalid': errors.confirmPassword, 'is-valid': formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword }"
                id="confirm-password"
                @blur="() => validateConfirmPassword(true)"
                @input="() => validateConfirmPassword(false)"
                @keydown="(e) => handleKeyDown(e, 'reason')"
                v-model="formData.confirmPassword"
                :aria-describedby="errorIds.confirmPassword"
                :aria-invalid="!!errors.confirmPassword"
                :aria-required="true"
                required
              />
              <div v-if="errors.confirmPassword" :id="errorIds.confirmPassword" class="invalid-feedback" role="alert">
                {{ errors.confirmPassword }}
              </div>
            </div>
          </div>

          <div class="mb-3">
            <label for="reason" class="form-label fw-semibold">Reason for joining</label>
            <textarea
              class="form-control"
              :class="{ 'is-valid': formData.reason && formData.reason.toLowerCase().includes('friend') }"
              id="reason"
              rows="3"
              v-model="formData.reason"
              @input="validateReason"
              @keydown="(e) => handleKeyDown(e, 'agree')"
              :aria-describedby="errorIds.reason"
            ></textarea>
            <div v-if="errors.reason" :id="errorIds.reason" class="form-text friend-alert" role="status">
              <span class="visually-hidden">Information: </span>{{ errors.reason }}
            </div>
          </div>
          
          <!-- Terms and conditions checkbox -->
          <div class="mb-4">
            <div class="form-check">
              <input
                type="checkbox"
                class="form-check-input"
                :class="{ 'is-invalid': errors.agree }"
                id="agree"
                v-model="formData.agree"
                :aria-describedby="errorIds.agree"
                :aria-invalid="!!errors.agree"
                :aria-required="true"
                required
              />
              <label class="form-check-label fw-semibold" for="agree">
                I agree to the terms and conditions. <span class="text-danger" aria-hidden="true">*</span>
              </label>
            </div>
            <div v-if="errors.agree" :id="errorIds.agree" class="invalid-feedback d-block" role="alert">
              {{ errors.agree }}
            </div>
          </div>

          <div class="text-center">
            <div class="d-inline-flex gap-2 flex-wrap justify-content-center">
              <button 
                class="btn btn-primary px-4" 
                type="submit" 
                :disabled="loading"
                :aria-describedby="okMsg ? 'success-message' : undefined"
              >
                {{ loading ? 'Submitting…' : 'Submit' }}
              </button>
              <button 
                type="button" 
                class="btn btn-outline-secondary px-4" 
                @click="clearForm" 
                :disabled="loading"
              >
                Clear
              </button>
            </div>
            
            <!-- message alert -->
            <div v-if="errorMsg" class="mt-3 alert alert-danger" role="alert" id="error-message">
              {{ errorMsg }}
            </div>
            <div v-if="okMsg" class="mt-3 alert alert-success" role="status" id="success-message">
              {{ okMsg }}
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 80vw;
  margin: 0 auto;
  padding: 20px;
  border-radius: 10px;
}

/* Improve focus styles */
.form-control:focus,
.form-select:focus,
.form-check-input:focus {
  border-color: #275fda;
  box-shadow: 0 0 0 0.25rem rgba(39, 95, 218, 0.25);
  outline: 2px solid #275fda;
  outline-offset: 2px;
}

.btn:focus {
  box-shadow: 0 0 0 0.25rem rgba(39, 95, 218, 0.5);
  outline: 2px solid #275fda;
  outline-offset: 2px;
}

/* Improve the color of the verification status */
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

/* Visual hiding type, for use by screen readers */
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

/* Improve contrast */
.text-danger {
  color: #dc3545 !important;
}

.friend-alert {
  color: #157347; /* Darker green for better contrast */
  font-weight: 500;
}

.form-label {
  color: #2c3e50; /* Darker color for better contrast */
  margin-bottom: 0.5rem;
}

/* Responsive improvements */
@media (max-width: 768px) {
  .container {
    max-width: 95vw;
    padding: 15px;
  }
  
  .d-inline-flex {
    flex-direction: column;
    gap: 0.5rem !important;
  }
  
  .btn {
    width: 100%;
  }
}

.card {
  border: 2px solid #dee2e6; /* Increase border width for better visibility */
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.card-header {
  background-color: #275fda;
  color: white;
  padding: 12px;
  border-radius: 8px 8px 0 0;
  font-weight: 600;
}
.list-group-item {
  padding: 12px;
  border-left: 2px solid #275fda;
}
</style>