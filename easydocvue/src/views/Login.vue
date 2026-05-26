<script setup lang="ts">
import { useAuth0 } from '@auth0/auth0-vue'
import { useRouter } from 'vue-router'
import logo from '@/assets/images/Logo.png'
import NavBar from '@/components/NavBar.vue'
import AppFooter from '@/components/AppFooter.vue'

const router = useRouter()
const { loginWithRedirect } = useAuth0()

function handleLogin() {
  loginWithRedirect({ appState: { target: '/auth/redirect' } })
}
</script>

<template>
  <NavBar />
  <div class="login-page">
    <div class="login-card">
      <button class="close-btn" @click="router.push('/')">✕</button>

      <div class="login-header">
        <img :src="logo" alt="EasyDoc Logo" class="login-logo" />
        <span class="login-brand">EasyDoc</span>
      </div>

      <h2 class="login-title">Einloggen</h2>

      <button @click="handleLogin" class="login-submit">Mit Auth0 einloggen</button>
    </div>
  </div>
  <AppFooter />
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 75px - 200px);
  background: #eef3fb;
  padding: 60px 20px;
}

.login-card {
  position: relative;
  background: #ffffff;
  border-radius: 16px;
  padding: 40px 48px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
}

.close-btn:hover {
  color: #333;
}

.login-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.login-logo {
  width: 40px;
  height: 40px;
}

.login-brand {
  font-size: 22px;
  font-weight: 700;
  color: #155dfc;
}

.login-title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 28px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 0 14px;
  height: 48px;
  background: #fff;
  transition: border-color 0.2s;
}

.input-group:focus-within {
  border-color: #155dfc;
}

.input-icon {
  font-size: 16px;
  margin-right: 10px;
  color: #999;
}

.input-group input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: #333;
  background: transparent;
}

.input-group input::placeholder {
  color: #aaa;
}

.role-switch {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin: 8px 0;
}

.role-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 24px;
  border-radius: 10px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.role-btn.active {
  border-color: #155dfc;
  color: #155dfc;
  background: #f0f5ff;
}

.role-btn:hover {
  border-color: #155dfc;
}

.role-icon {
  font-size: 16px;
}

.login-submit {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 10px;
  background: #155dfc;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.3s;
}

.login-submit:hover {
  background: #0f4ad4;
}

@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }
}
</style>
