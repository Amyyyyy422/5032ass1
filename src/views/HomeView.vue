<script setup>
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Rating from 'primevue/rating';

const mark = ref(0)
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

const submittedCards = ref([])

const submitForm = () => {
  validateName(true)
  validateEmail(true)
  validateAge(true)
  validatePassword(true)
  validateConfirmPassword(true)
  validateReason(true)

  // Must agree to terms and conditions
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

  if (!hasBlockingErrors) {
    submittedCards.value.push({ ...formData.value })
    clearForm()
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
}

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

const validateName = (blur) => {
  if (formData.value.username.length < 3) {
    if (blur) errors.value.username = 'Name must be at least 3 characters'
  } else {
    errors.value.username = null
  }
}

const validateEmail = (blur) => {
  const email = formData.value.email.trim()
  // Rigorous email verification
  const re =
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
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

const validateReason = () => {
  if (formData.value.reason.toLowerCase().includes('friend')) {
    errors.value.reason = 'Great to have a friend'
  } else {
    errors.value.reason = null
  }
}

</script>

<template>
  <!-- title -->
  <div class="container mt-5">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <h1 class="text-center">Register to get started!</h1>
        <!---<p class="text-center">
          Enter your login details below.
        </p>-->
        <!-- Add: Youth mental health & wellbeing Explanatory paragraph (left-aligned with Username) -->
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

        <form @submit.prevent="submitForm">
          <div class="row mb-3">
            <div class="col-md-6 col-sm-6">
              <label for="username" class="form-label">Username</label>
              <input
                type="text"
                class="form-control"
                id="username"
                @blur="() => validateName(true)"
                @input="() => validateName(false)"
                v-model="formData.username"
              />
              <div v-if="errors.username" class="text-danger">{{ errors.username }}</div>
            </div>

            <div class="col-md-6 col-sm-6">
              <label for="gender" class="form-label">Gender</label>
              <select class="form-select" id="gender" v-model="formData.gender" required>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
           
          <!-- Add second line: Email / Age -->
          <div class="row mb-3">
            <div class="col-md-6 col-sm-6">
              <label for="email" class="form-label">Email</label>
              <input
                type="email"
                class="form-control"
                id="email"
                @blur="() => validateEmail(true)"
                @input="() => validateEmail(false)"
                v-model="formData.email"
              />
              <div v-if="errors.email" class="text-danger">{{ errors.email }}</div>
            </div>

            <div class="col-md-6 col-sm-6">
              <label for="age" class="form-label">Age</label>
              <input
                type="number"
                class="form-control"
                id="age"
                @blur="() => validateAge(true)"
                @input="() => validateAge(false)"
                v-model="formData.age"
              />
              <div v-if="errors.age" class="text-danger">{{ errors.age }}</div>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-6 col-sm-6">
              <label for="password" class="form-label">Password</label>
              <input
                type="password"
                class="form-control"
                id="password"
                @blur="() => validatePassword(true)"
                @input="() => validatePassword(false)"
                v-model="formData.password"
              />
              <div v-if="errors.password" class="text-danger">{{ errors.password }}</div>
            </div>

            <div class="col-md-6 col-sm-6">
              <label for="confirm-password" class="form-label">Confirm password</label>
              <input
                type="password"
                class="form-control"
                id="confirm-password"
                @blur="() => validateConfirmPassword(true)"
                @input="() => validateConfirmPassword(false)"
                v-model="formData.confirmPassword"
              />
              <div v-if="errors.confirmPassword" class="text-danger">{{ errors.confirmPassword }}</div>
            </div>
          </div>

          <div class="mb-3">
            <label for="reason" class="form-label">Reason for joining</label>
            <textarea
              class="form-control"
              id="reason"
              rows="3"
              v-model="formData.reason"
              @input="validateReason"></textarea>
            <div v-if="errors.reason" class="friend-alert">{{ errors.reason }}</div>
          </div>
          
          <!-- Terms and conditions checkbox -->
          <div class="mb-3">
            <div class="form-check">
              <input
                type="checkbox"
                class="form-check-input"
                id="agree"
                v-model="formData.agree"
              />
              <label class="form-check-label" for="agree">
                I agree to the terms and conditions.
              </label>
            </div>
            <div v-if="errors.agree" class="text-danger">{{ errors.agree }}</div>
          </div>

          <div class="text-center">
            <button type="submit" class="btn btn-primary me-2">Submit</button>
            <button type="button" class="btn btn-secondary" @click="clearForm">Clear</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- PrimeVue DataTable -->
  <div class="row mt-5">
    <h4>This is a Primevue Datatable.</h4>
    <DataTable :value="submittedCards" tableStyle="min-width: 50rem">
      <Column field="username" header="Username"></Column>
      <Column field="gender" header="Gender"></Column>
      <Column field="email" header="E-mail"></Column>
      <Column field="age" header="Age"></Column>
      <Column field="reason" header="Reason"></Column>
    </DataTable>
  </div>

  <!-- Cards + Rating -->
  <div class="row mt-5" v-if="submittedCards.length">
    <div class="d-flex flex-wrap justify-content-start">
      <div
        v-for="(card, index) in submittedCards"
        :key="index"
        class="card m-2"
        style="width: 18rem"
      >
        <div class="card-header">User Information</div>
        <ul class="list-group list-group-flush">
          <li class="list-group-item">Username: {{ card.username }}</li>
          <li class="list-group-item">E-mail: {{ card.email }}</li>
          <li class="list-group-item">Age: {{ card.age }}</li>
          <li class="list-group-item">Gender: {{ card.gender }}</li>
          <li class="list-group-item">Reason: {{ card.reason }}</li>
        </ul>
      </div>
      <Rating v-model="mark" />
      <div>Current rate is {{ mark }}</div>
    </div>
  </div>
</template>

<style scoped>
.container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  max-width: 80vw;
  margin: 0 auto;
  padding: 20px;
  /* background-color: #e0bfbf; */
  border-radius: 10px;
}

/* Class selectors */
.form {
  text-align: center;
  margin-top: 50px;
}

/* ID selectors */
#username:focus,
#email:focus,
#password:focus,
.card {
  border: 1px solid #ccc;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.card-header {
  background-color: #275fda;
  color: white;
  padding: 10px;
  border-radius: 10px 10px 0 0;
}
.list-group-item {
  padding: 10px;
}

.friend-alert {
  color: green;
}
</style>