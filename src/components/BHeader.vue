<script setup>
import { isLogin, logout, currentUser, currentRole } from '@/auth'
import { useRouter } from 'vue-router'

const router = useRouter()

const handleLogout = () => {
  logout();
  router.push('/login')
}

const handleGoAdmin = () => {
  router.push('/admin')
}
</script>

<template>
  <div class="container">
    <header class="d-flex justify-content-center py-3">
      <ul class="nav nav-pills">
        <li class="nav-item">
          <router-link to="/" class="nav-link" active-class="active" v-if="!isLogin">Create Account</router-link>
        </li>
        
        <li class="nav-item">
          <router-link to="/map" class="nav-link" active-class="active" v-if="isLogin">Map</router-link>
        </li>
        <li class="nav-item">
          <router-link to="/login" class="nav-link" active-class="active" v-if="!isLogin">Login</router-link>
        </li>

        <!--
        <li class="nav-item" v-if="isLogin && currentRole === 'admin'">
          <button class="nav-link" active-class="active" type="button" @click="handleGoAdmin">Admin Panel</button>
        </li>
        -->
        <li class="nav-item" v-if="isLogin && currentRole === 'admin'">
          <router-link to="/admin" class="nav-link" active-class="active" @click="handleGoAdmin">Admin Panel</router-link>
        </li>

        <li class="nav-item">
          <button class="nav-link" active-class="active" v-if="isLogin">Hi, {{ currentUser }}</button>
        </li>

        <li class="nav-item">
          <button class="nav-link" active-class="active" v-if="isLogin" @click="handleLogout">Logout</button>
        </li>
      </ul>
    </header>
  </div>
</template>

<style scoped>
.b-example-divider {
  height: 3rem;
  background-color: rgba(0, 0, 0, 0.1);
  border: solid rgba(0, 0, 0, 0.15);
  border-width: 1px 0;
  box-shadow:
    inset 0 0.5em 1.5em rgba(0, 0, 0, 0.1),
    inset 0 0.125em 0.5em rgba(0, 0, 0, 0.15);
}

.form-control-dark {
  color: #fff;
  background-color: var(--bs-dark);
  border-color: var(--bs-gray);
}
.form-control-dark:focus {
  color: #fff;
  background-color: var(--bs-dark);
  border-color: #fff;
  box-shadow: 0 0 0 0.25rem rgba(255, 255, 255, 0.25);
}

.bi {
  vertical-align: -0.125em;
  fill: currentColor;
}

.text-small {
  font-size: 85%;
}

.dropdown-toggle {
  outline: 0;
}
</style>
